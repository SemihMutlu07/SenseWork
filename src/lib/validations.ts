import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().min(1, "Email/username is required"),
  password: z.string().min(1, "Password is required"),
});

const trimmedName = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .max(100);

/** Normalize emails for consistent uniqueness (case-insensitive policy). */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export const createUserSchema = z.object({
  firstName: trimmedName("First name"),
  lastName: trimmedName("Last name"),
  email: z
    .string()
    .trim()
    .email("Valid email is required")
    .max(255)
    .transform(normalizeEmail),
  age: z
    .number({ error: "Age must be a number" })
    .int("Age must be an integer")
    .min(0, "Age must be at least 0")
    .max(150, "Age must be at most 150"),
  password: z.string().min(6, "Password must be at least 6 characters").max(128),
});

/** Excel row shape: name, surname, email, age, password */
export const excelUserRowSchema = z.object({
  name: trimmedName("name"),
  surname: trimmedName("surname"),
  email: z
    .string()
    .trim()
    .email("valid email is required")
    .max(255)
    .transform(normalizeEmail),
  age: z.coerce
    .number()
    .int("age must be an integer")
    .min(0, "age must be at least 0")
    .max(150, "age must be at most 150"),
  password: z.string().min(6, "password must be at least 6 characters").max(128),
});

export const excelUsersSchema = z.array(excelUserRowSchema).min(1, "Excel file has no data rows");

export type LoginInput = z.infer<typeof loginSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type ExcelUserRow = z.infer<typeof excelUserRowSchema>;
