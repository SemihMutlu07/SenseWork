import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { excelUserRowSchema } from "@/lib/validations";

type RowError = {
  row: number;
  message: string;
};

function normalizeHeader(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

const REQUIRED_HEADERS = ["name", "surname", "email", "age", "password"] as const;

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Excel file is required" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];

    if (!sheetName) {
      return NextResponse.json({ error: "Excel file has no sheets" }, { status: 400 });
    }

    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: "",
      raw: false,
    });

    if (rows.length === 0) {
      return NextResponse.json({ error: "Excel file has no data rows" }, { status: 400 });
    }

    const headers = Object.keys(rows[0] ?? {}).map(normalizeHeader);
    const missingHeaders = REQUIRED_HEADERS.filter((header) => !headers.includes(header));
    if (missingHeaders.length > 0) {
      return NextResponse.json(
        {
          error: `Invalid file structure. Missing columns: ${missingHeaders.join(", ")}`,
          expected: REQUIRED_HEADERS,
        },
        { status: 400 },
      );
    }

    const errors: RowError[] = [];
    const normalizedRows: Array<{
      rowNumber: number;
      firstName: string;
      lastName: string;
      email: string;
      age: number;
      password: string;
    }> = [];

    const emailsInFile = new Map<string, number>();

    rows.forEach((rawRow, index) => {
      const rowNumber = index + 2; // header is row 1
      const mapped: Record<string, unknown> = {};

      for (const [key, value] of Object.entries(rawRow)) {
        mapped[normalizeHeader(key)] = typeof value === "string" ? value.trim() : value;
      }

      const parsed = excelUserRowSchema.safeParse(mapped);
      if (!parsed.success) {
        const message = parsed.error.issues.map((issue) => issue.message).join("; ");
        errors.push({ row: rowNumber, message });
        return;
      }

      const emailKey = parsed.data.email.toLowerCase();
      const duplicateRow = emailsInFile.get(emailKey);
      if (duplicateRow !== undefined) {
        errors.push({
          row: rowNumber,
          message: `Duplicate email "${parsed.data.email}" also found on row ${duplicateRow}`,
        });
        return;
      }

      emailsInFile.set(emailKey, rowNumber);
      normalizedRows.push({
        rowNumber,
        firstName: parsed.data.name,
        lastName: parsed.data.surname,
        email: parsed.data.email,
        age: parsed.data.age,
        password: parsed.data.password,
      });
    });

    if (errors.length === 0 && normalizedRows.length > 0) {
      const emails = normalizedRows.map((row) => row.email);
      const existing = await prisma.user.findMany({
        where: { email: { in: emails, mode: "insensitive" } },
        select: { email: true },
      });

      if (existing.length > 0) {
        const existingSet = new Set(existing.map((user) => user.email.toLowerCase()));
        for (const row of normalizedRows) {
          if (existingSet.has(row.email.toLowerCase())) {
            errors.push({
              row: row.rowNumber,
              message: `Duplicate entry: email "${row.email}" already exists in the database`,
            });
          }
        }
      }
    }

    if (errors.length > 0) {
      return NextResponse.json(
        {
          error: "Validation failed. No users were added.",
          errors: errors.sort((a, b) => a.row - b.row),
        },
        { status: 400 },
      );
    }

    const created = await prisma.$transaction(async (tx) => {
      const results = [];
      for (const row of normalizedRows) {
        const passwordHash = await bcrypt.hash(row.password, 10);
        const user = await tx.user.create({
          data: {
            firstName: row.firstName,
            lastName: row.lastName,
            email: row.email,
            age: row.age,
            password: passwordHash,
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            age: true,
          },
        });
        results.push(user);
      }
      return results;
    });

    return NextResponse.json({
      message: `Successfully added ${created.length} user(s)`,
      count: created.length,
      users: created,
    });
  } catch (error) {
    console.error("Bulk upload error:", error);
    return NextResponse.json({ error: "Failed to process Excel file" }, { status: 500 });
  }
}
