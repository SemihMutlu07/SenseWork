"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useState } from "react";

const formSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(100),
  lastName: z.string().trim().min(1, "Last name is required").max(100),
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Invalid email address"),
  age: z
    .number({ error: "Age must be a number" })
    .int("Age must be a whole number")
    .min(0, "Age must be at least 0")
    .max(150, "Age must be at most 150"),
  password: z.string().min(1, "Password is required").max(200),
});

type FormValues = z.infer<typeof formSchema>;

export function AddUserForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      age: 18,
      password: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const err = new Error(
          typeof data.message === "string" ? data.message : "Create failed",
        ) as Error & {
          fieldErrors?: Record<string, string>;
        };
        if (Array.isArray(data.errors)) {
          err.fieldErrors = Object.fromEntries(
            data.errors.map((e: { field: string; message: string }) => [
              e.field,
              e.message,
            ]),
          );
        }
        throw err;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      reset();
      router.push("/dashboard");
      router.refresh();
    },
    onError: (err: Error & { fieldErrors?: Record<string, string> }) => {
      setServerError(err.message);
      setFieldErrors(err.fieldErrors ?? {});
    },
  });

  return (
    <form
      className="flex max-w-lg flex-col gap-4"
      onSubmit={handleSubmit((values) => {
        setServerError(null);
        setFieldErrors({});
        createMutation.mutate(values);
      })}
      noValidate
    >
      {(
        [
          ["firstName", "First name", "text"],
          ["lastName", "Last name", "text"],
          ["email", "Email", "email"],
          ["password", "Password", "password"],
        ] as const
      ).map(([name, label, type]) => (
        <div key={name} className="flex flex-col gap-1.5">
          <label htmlFor={name} className="text-sm font-medium text-slate-700">
            {label}
          </label>
          <input
            id={name}
            type={type}
            className="rounded-md border border-border bg-white px-3 py-2 outline-none ring-accent focus:ring-2"
            {...register(name)}
          />
          {(errors[name] || fieldErrors[name]) && (
            <p className="text-sm text-danger">
              {errors[name]?.message ?? fieldErrors[name]}
            </p>
          )}
        </div>
      ))}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="age" className="text-sm font-medium text-slate-700">
          Age
        </label>
        <input
          id="age"
          type="number"
          className="rounded-md border border-border bg-white px-3 py-2 outline-none ring-accent focus:ring-2"
          {...register("age", { valueAsNumber: true })}
        />
        {(errors.age || fieldErrors.age) && (
          <p className="text-sm text-danger">
            {errors.age?.message ?? fieldErrors.age}
          </p>
        )}
      </div>

      {serverError && !Object.keys(fieldErrors).length && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-danger">
          {serverError}
        </p>
      )}

      <button
        type="submit"
        disabled={createMutation.isPending}
        className="rounded-md bg-accent px-4 py-2.5 font-medium text-white hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        {createMutation.isPending ? "Creating…" : "Create user"}
      </button>
    </form>
  );
}
