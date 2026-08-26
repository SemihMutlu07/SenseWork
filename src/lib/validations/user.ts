import { z } from "zod";

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export const createUserSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, "First name is required")
    .max(100, "First name is too long"),
  lastName: z
    .string()
    .trim()
    .min(1, "Last name is required")
    .max(100, "Last name is too long"),
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Invalid email address")
    .transform(normalizeEmail),
  age: z.coerce
    .number({ error: "Age must be a number" })
    .int("Age must be a whole number")
    .min(0, "Age must be at least 0")
    .max(150, "Age must be at most 150"),
  password: z
    .string()
    .min(1, "Password is required")
    .max(200, "Password is too long"),
});

export const loginSchema = z.object({
  email: z.string().trim().min(1, "Email is required"),
  password: z.string().min(1, "Password is required"),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
