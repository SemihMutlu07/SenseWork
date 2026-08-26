"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { loginSchema, type LoginInput } from "@/lib/validations";

export function LoginForm() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const mutation = useMutation({
    mutationFn: async (values: LoginInput) => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Login failed");
      }
      return data;
    },
    onSuccess: () => {
      router.push("/dashboard");
      router.refresh();
    },
  });

  return (
    <form
      onSubmit={handleSubmit((values) => mutation.mutate(values))}
      className="flex w-full flex-col gap-4"
    >
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">Email / username</span>
        <input
          {...register("email")}
          autoComplete="username"
          className="rounded-md border border-border bg-white px-3 py-2.5 outline-none ring-accent focus:ring-2"
          placeholder="admin"
        />
        {errors.email && <span className="text-danger">{errors.email.message}</span>}
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">Password</span>
        <input
          {...register("password")}
          type="password"
          autoComplete="current-password"
          className="rounded-md border border-border bg-white px-3 py-2.5 outline-none ring-accent focus:ring-2"
          placeholder="••••••••"
        />
        {errors.password && <span className="text-danger">{errors.password.message}</span>}
      </label>

      {mutation.isError && (
        <p className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">
          {(mutation.error as Error).message}
        </p>
      )}

      <button
        type="submit"
        disabled={mutation.isPending}
        className="mt-1 rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-strong disabled:opacity-60"
      >
        {mutation.isPending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
