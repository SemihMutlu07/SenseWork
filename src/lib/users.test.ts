import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";
import { listUsers } from "@/lib/users";

describe("dashboard listing", () => {
  beforeEach(async () => {
    await prisma.user.deleteMany();
    const password = await hashPassword("pw");
    await prisma.user.createMany({
      data: [
        {
          firstName: "Young",
          lastName: "One",
          email: "young@example.com",
          age: 18,
          password,
        },
        {
          firstName: "Mid",
          lastName: "Two",
          email: "mid@example.com",
          age: 25,
          password,
        },
        {
          firstName: "Old",
          lastName: "Three",
          email: "old@example.com",
          age: 40,
          password,
        },
      ],
    });
  });

  it("filters by age using URL params", async () => {
    const result = await listUsers(
      new URLSearchParams("minAge=20&maxAge=30"),
    );
    expect(result.users).toHaveLength(1);
    expect(result.users[0].email).toBe("mid@example.com");
    expect(result.pagination.total).toBe(1);
  });

  it("paginates via URL page param", async () => {
    const page1 = await listUsers(new URLSearchParams("page=1&pageSize=2"));
    const page2 = await listUsers(new URLSearchParams("page=2&pageSize=2"));
    expect(page1.users).toHaveLength(2);
    expect(page2.users).toHaveLength(1);
    expect(page1.pagination.totalPages).toBe(2);
  });

  it("clamps nonexistent pages and returns empty filters safely", async () => {
    const empty = await listUsers(
      new URLSearchParams("minAge=90&maxAge=95"),
    );
    expect(empty.users).toHaveLength(0);
    expect(empty.pagination.total).toBe(0);
    expect(empty.pagination.page).toBe(1);

    const hugePage = await listUsers(new URLSearchParams("page=999"));
    expect(hugePage.pagination.page).toBe(1);
    expect(hugePage.users.length).toBeGreaterThan(0);
  });

  it("stores hashed passwords for created users", async () => {
    const user = await prisma.user.findFirstOrThrow({
      where: { email: "young@example.com" },
    });
    expect(user.password).not.toBe("pw");
    expect(await verifyPassword("pw", user.password)).toBe(true);
  });
});
