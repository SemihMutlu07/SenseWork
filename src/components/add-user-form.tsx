"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { createUserSchema, type CreateUserInput } from "@/lib/validations";

export function AddUserForm() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      age: 18,
      password: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: CreateUserInput) => {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to create user");
      }
      return data;
    },
    onSuccess: (data: { user: { id: string } }) => {
      reset();
      router.push(`/dashboard/${data.user.id}`);
      router.refresh();
    },
  });

  return (
    <form
      onSubmit={handleSubmit((values) => mutation.mutate(values))}
      className="grid max-w-2xl gap-4 rounded-xl border border-border bg-surface p-6 shadow-[var(--shadow)]"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">First name</span>
          <input
            {...register("firstName")}
            className="rounded-md border border-border bg-white px-3 py-2.5 outline-none ring-accent focus:ring-2"
          />
          {errors.firstName && <span className="text-danger">{errors.firstName.message}</span>}
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Last name</span>
          <input
            {...register("lastName")}
            className="rounded-md border border-border bg-white px-3 py-2.5 outline-none ring-accent focus:ring-2"
          />
          {errors.lastName && <span className="text-danger">{errors.lastName.message}</span>}
        </label>
      </div>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">Email</span>
        <input
          {...register("email")}
          type="email"
          className="rounded-md border border-border bg-white px-3 py-2.5 outline-none ring-accent focus:ring-2"
        />
        {errors.email && <span className="text-danger">{errors.email.message}</span>}
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Age</span>
          <input
            {...register("age", { valueAsNumber: true })}
            type="number"
            min={0}
            className="rounded-md border border-border bg-white px-3 py-2.5 outline-none ring-accent focus:ring-2"
          />
          {errors.age && <span className="text-danger">{errors.age.message}</span>}
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Password</span>
          <input
            {...register("password")}
            type="password"
            className="rounded-md border border-border bg-white px-3 py-2.5 outline-none ring-accent focus:ring-2"
          />
          {errors.password && <span className="text-danger">{errors.password.message}</span>}
        </label>
      </div>

      {mutation.isError && (
        <p className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">
          {(mutation.error as Error).message}
        </p>
      )}

      {mutation.isSuccess && (
        <p className="rounded-md bg-success-soft px-3 py-2 text-sm text-success">
          User created successfully.
        </p>
      )}

      <button
        type="submit"
        disabled={mutation.isPending}
        className="justify-self-start rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-strong disabled:opacity-60"
      >
        {mutation.isPending ? "Saving…" : "Create user"}
      </button>
    </form>
  );
}
