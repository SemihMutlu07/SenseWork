import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";
import { importUsersFromExcel } from "@/lib/excel/import";
import {
  buildEmptyWorkbookBuffer,
  buildWorkbookBuffer,
} from "@/test/excel-fixtures";

async function resetUsers() {
  await prisma.user.deleteMany();
}

describe("Excel import", () => {
  beforeEach(async () => {
    await resetUsers();
  });

  it("inserts all users from a valid file", async () => {
    const buffer = buildWorkbookBuffer([
      {
        name: "John",
        surname: "Doe",
        email: "john@example.com",
        age: 25,
        password: "secret1",
      },
      {
        name: "Jane",
        surname: "Roe",
        email: "jane@example.com",
        age: 30,
        password: "secret2",
      },
    ]);

    const result = await importUsersFromExcel(buffer);
    expect(result).toEqual({ ok: true, inserted: 2 });

    const users = await prisma.user.findMany({ orderBy: { email: "asc" } });
    expect(users).toHaveLength(2);
    expect(users[0].email).toBe("jane@example.com");
    expect(users[0].firstName).toBe("Jane");
    expect(users[0].lastName).toBe("Roe");
    expect(users[1].firstName).toBe("John");
    expect(users[1].lastName).toBe("Doe");
    expect(await verifyPassword("secret1", users[1].password)).toBe(true);
    expect(users[1].password).not.toBe("secret1");
  });

  it("inserts zero users when one row is invalid", async () => {
    const buffer = buildWorkbookBuffer([
      {
        name: "Valid",
        surname: "User",
        email: "valid@example.com",
        age: 22,
        password: "ok",
      },
      {
        name: "Bad",
        surname: "Age",
        email: "bad@example.com",
        age: "twenty",
        password: "ok",
      },
    ]);

    const before = await prisma.user.count();
    const result = await importUsersFromExcel(buffer);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.row === 3 && e.field === "age")).toBe(
        true,
      );
    }
    expect(await prisma.user.count()).toBe(before);
  });

  it("inserts zero users when email is duplicated inside the file", async () => {
    const buffer = buildWorkbookBuffer([
      {
        name: "A",
        surname: "One",
        email: "dup@example.com",
        age: 20,
        password: "x",
      },
      {
        name: "B",
        surname: "Two",
        email: "DUP@example.com",
        age: 21,
        password: "y",
      },
    ]);

    const result = await importUsersFromExcel(buffer);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(
        result.errors.some(
          (e) => e.field === "email" && e.message.includes("Duplicate"),
        ),
      ).toBe(true);
    }
    expect(await prisma.user.count()).toBe(0);
  });

  it("inserts zero users when email already exists in the database", async () => {
    await prisma.user.create({
      data: {
        firstName: "Existing",
        lastName: "User",
        email: "taken@example.com",
        age: 40,
        password: await hashPassword("existing"),
      },
    });

    const buffer = buildWorkbookBuffer([
      {
        name: "New",
        surname: "Person",
        email: "fresh@example.com",
        age: 19,
        password: "x",
      },
      {
        name: "Clash",
        surname: "Person",
        email: "taken@example.com",
        age: 20,
        password: "y",
      },
    ]);

    const result = await importUsersFromExcel(buffer);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(
        result.errors.some(
          (e) => e.field === "email" && e.message.includes("already exists"),
        ),
      ).toBe(true);
    }
    expect(await prisma.user.count()).toBe(1);
  });

  it("rejects missing required columns without inserting", async () => {
    const buffer = buildWorkbookBuffer(
      [{ name: "Only", email: "a@b.com", age: 1, password: "x" }],
      ["name", "email", "age", "password"],
    );

    const result = await importUsersFromExcel(buffer);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(
        result.errors.some(
          (e) => e.field === "surname" && e.message.includes("Missing"),
        ),
      ).toBe(true);
    }
    expect(await prisma.user.count()).toBe(0);
  });

  it("rejects an empty workbook", async () => {
    const result = await importUsersFromExcel(buildEmptyWorkbookBuffer());
    expect(result.ok).toBe(false);
    expect(await prisma.user.count()).toBe(0);
  });

  it("returns a row/field error for invalid email", async () => {
    const buffer = buildWorkbookBuffer([
      {
        name: "Bad",
        surname: "Mail",
        email: "not-an-email",
        age: 25,
        password: "x",
      },
    ]);

    const result = await importUsersFromExcel(buffer);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toEqual([
        {
          row: 2,
          field: "email",
          message: "Invalid email address",
        },
      ]);
    }
  });

  it("returns a row/field error for invalid age", async () => {
    const buffer = buildWorkbookBuffer([
      {
        name: "Bad",
        surname: "Age",
        email: "age@example.com",
        age: 25.5,
        password: "x",
      },
    ]);

    const result = await importUsersFromExcel(buffer);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0]).toMatchObject({
        row: 2,
        field: "age",
      });
    }
  });
});
