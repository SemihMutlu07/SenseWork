/**
 * Focused regression tests for invariants fixed during adversarial verification.
 * Runs against LOCAL isolated DB only (refuses non-localhost DATABASE_URL).
 *
 * Excluded from Next.js tsconfig; run via: pnpm test:invariants
 */
import { PrismaClient } from "@prisma/client";
import * as XLSX from "xlsx";
import { clampPage } from "../src/lib/pagination";
import { normalizeEmail, createUserSchema, excelUserRowSchema } from "../src/lib/validations";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const prisma = new PrismaClient();
let failed = 0;

function assert(name: string, cond: boolean, detail?: unknown) {
  if (cond) {
    console.log(`PASS: ${name}`);
  } else {
    failed += 1;
    console.error(`FAIL: ${name}`, detail ?? "");
  }
}

function assertEnvSafe() {
  const url = process.env.DATABASE_URL || "";
  if (!url.includes("localhost") && !url.includes("127.0.0.1")) {
    throw new Error("ABORT non-local DATABASE_URL: " + url);
  }
}

function workbook(headers: string[], rows: unknown[][]) {
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Users");
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
}

async function login() {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "admin", password: "admin" }),
  });
  const setCookie = res.headers.getSetCookie?.() || [];
  return setCookie.map((c) => c.split(";")[0]).join("; ");
}

async function main() {
  assertEnvSafe();

  assert("normalizeEmail lowercases+trims", normalizeEmail("  JOHN@Ex.com ") === "john@ex.com");
  assert(
    "createUserSchema rejects whitespace-only name",
    !createUserSchema.safeParse({
      firstName: "   ",
      lastName: "Ok",
      email: "a@b.com",
      age: 20,
      password: "secret12",
    }).success,
  );
  assert(
    "createUserSchema normalizes email",
    createUserSchema.safeParse({
      firstName: "A",
      lastName: "B",
      email: "  Case@Ex.com ",
      age: 20,
      password: "secret12",
    }).data?.email === "case@ex.com",
  );
  assert(
    "excelUserRowSchema normalizes email",
    excelUserRowSchema.safeParse({
      name: "A",
      surname: "B",
      email: "X@Y.com",
      age: "22",
      password: "secret12",
    }).data?.email === "x@y.com",
  );

  assert(
    "clampPage clamps 5 → 1 when totalPages=1",
    clampPage(5, 5, 10).page === 1 && clampPage(5, 5, 10).totalPages === 1,
  );
  assert(
    "clampPage keeps valid page",
    clampPage(2, 25, 10).page === 2 && clampPage(2, 25, 10).totalPages === 3,
  );

  const cookie = await login();
  assert("login cookie", cookie.includes("auth_token="));

  const stamp = Date.now();
  const emailA = `CaseFix-${stamp}@Example.com`;
  const r1 = await fetch(`${BASE}/api/users`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie },
    body: JSON.stringify({
      firstName: "A",
      lastName: "B",
      email: emailA,
      age: 20,
      password: "secret12",
    }),
  });
  const b1 = await r1.json();
  const r2 = await fetch(`${BASE}/api/users`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie },
    body: JSON.stringify({
      firstName: "C",
      lastName: "D",
      email: emailA.toLowerCase(),
      age: 21,
      password: "secret12",
    }),
  });
  const count = await prisma.user.count({
    where: { email: { equals: emailA.toLowerCase(), mode: "insensitive" } },
  });
  assert("case-variant create → 201 then 409, single row", r1.status === 201 && r2.status === 409 && count === 1, {
    r1: r1.status,
    r2: r2.status,
    count,
    stored: b1.user?.email,
  });
  assert("stored email is lowercase", b1.user?.email === emailA.toLowerCase());

  const rows = Array.from({ length: 100 }, (_, i) => {
    const n = i + 1;
    if (n === 99) return [`U${n}`, "T", `atomic-fix-${stamp}-${n}@t.com`, "NOPE", "secret12"];
    return [`U${n}`, "T", `atomic-fix-${stamp}-${n}@t.com`, "25", "secret12"];
  });
  const before = await prisma.user.count();
  const form = new FormData();
  form.append(
    "file",
    new Blob([workbook(["name", "surname", "email", "age", "password"], rows)]),
    "a.xlsx",
  );
  const bulk = await fetch(`${BASE}/api/users/bulk`, { method: "POST", headers: { cookie }, body: form });
  const bulkBody = await bulk.json();
  const after = await prisma.user.count();
  assert("atomic invalid row → 0 inserts", bulk.status === 400 && after === before, {
    status: bulk.status,
    delta: after - before,
    errors: bulkBody.errors,
  });
  assert(
    "atomic error points at excel row 100 (data index 99 → row 100)",
    (bulkBody.errors || []).some((e: { row: number }) => e.row === 100),
    bulkBody.errors,
  );

  for (let i = 0; i < 3; i++) {
    await prisma.user.create({
      data: {
        firstName: "P",
        lastName: `F${i}`,
        email: `pagefix-${stamp}-${i}@t.com`,
        age: 88,
        password: "$2a$10$abcdefghijklmnopqrstuu",
      },
    });
  }
  const pageRes = await fetch(`${BASE}/dashboard?page=9&ageMin=88&ageMax=88`, {
    headers: { cookie },
    redirect: "follow",
  });
  const html = await pageRes.text();
  const coherent = /Page\s+<!-- -->1<!-- --> of <!-- -->1/.test(html) || /Page 1 of 1/.test(html);
  const notStale = !/Page\s+<!-- -->9<!-- --> of <!-- -->1/.test(html) && !/Page 9 of 1/.test(html);
  assert("pagination desync clamped to page 1 of 1", pageRes.status === 200 && coherent && notStale, {
    status: pageRes.status,
    coherent,
    notStale,
  });

  const bigRows = Array.from({ length: 100 }, (_, i) => [
    "L",
    `U${i}`,
    `large-fix-${stamp}-${i}@t.com`,
    "26",
    "secret12",
  ]);
  const beforeBig = await prisma.user.count();
  const formBig = new FormData();
  formBig.append(
    "file",
    new Blob([workbook(["name", "surname", "email", "age", "password"], bigRows)]),
    "big.xlsx",
  );
  const t0 = Date.now();
  const big = await fetch(`${BASE}/api/users/bulk`, { method: "POST", headers: { cookie }, body: formBig });
  const ms = Date.now() - t0;
  const afterBig = await prisma.user.count();
  assert("100-row import succeeds", big.status === 200 && afterBig - beforeBig === 100, {
    status: big.status,
    delta: afterBig - beforeBig,
    ms,
  });

  await prisma.$disconnect();
  if (failed) {
    console.error(`\n${failed} regression failure(s)`);
    process.exit(1);
  }
  console.log("\nAll regression checks passed");
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(2);
});
