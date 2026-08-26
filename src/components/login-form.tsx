"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { useState } from "react";

const formSchema = z.object({
  email: z.string().trim().min(1, "Email is required"),
  password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof formSchema>;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "", password: "" },
  });

  const loginMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          typeof data.message === "string"
            ? data.message
            : "Login failed",
        );
      }
      return data;
    },
    onSuccess: () => {
      const next = searchParams.get("next");
      router.replace(
        next && next.startsWith("/dashboard") ? next : "/dashboard",
      );
      router.refresh();
    },
    onError: (err: Error) => {
      setServerError(err.message);
    },
  });

  return (
    <form
      className="flex w-full max-w-sm flex-col gap-4"
      onSubmit={handleSubmit((values) => {
        setServerError(null);
        loginMutation.mutate(values);
      })}
      noValidate
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium text-slate-700">
          Email
        </label>
        <input
          id="email"
          type="text"
          autoComplete="username"
          className="rounded-md border border-border bg-white px-3 py-2 outline-none ring-accent focus:ring-2"
          {...register("email")}
        />
        {errors.email && (
          <p className="text-sm text-danger">{errors.email.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="password"
          className="text-sm font-medium text-slate-700"
        >
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          className="rounded-md border border-border bg-white px-3 py-2 outline-none ring-accent focus:ring-2"
          {...register("password")}
        />
        {errors.password && (
          <p className="text-sm text-danger">{errors.password.message}</p>
        )}
      </div>

      {serverError && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-danger">
          {serverError}
        </p>
      )}

      <button
        type="submit"
        disabled={loginMutation.isPending}
        className="rounded-md bg-accent px-4 py-2.5 font-medium text-white transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loginMutation.isPending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
