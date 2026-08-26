import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import type { ImportRowError } from "@/lib/api";
import {
  findDuplicateEmailsInFile,
  mapAndValidateRows,
  parseWorkbookBuffer,
  validateHeaders,
  type MappedImportRow,
} from "@/lib/excel/parse";

const MAX_UPLOAD_BYTES = 2 * 1024 * 1024; // 2 MB
const ALLOWED_MIME = new Set([
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "application/octet-stream",
]);

export type ImportResult =
  | { ok: true; inserted: number }
  | { ok: false; errors: ImportRowError[] };

export function validateUploadFile(file: File | null): ImportRowError[] {
  if (!file) {
    return [{ row: 0, field: "file", message: "No file uploaded" }];
  }

  const name = file.name.toLowerCase();
  const hasExcelExt = name.endsWith(".xlsx") || name.endsWith(".xls");
  if (!hasExcelExt && !ALLOWED_MIME.has(file.type)) {
    return [
      {
        row: 0,
        field: "file",
        message: "File must be an Excel workbook (.xlsx or .xls)",
      },
    ];
  }

  if (file.size === 0) {
    return [{ row: 0, field: "file", message: "File is empty" }];
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return [
      {
        row: 0,
        field: "file",
        message: "File exceeds the 2 MB upload limit",
      },
    ];
  }

  return [];
}

async function findExistingEmailConflicts(
  mapped: MappedImportRow[],
): Promise<ImportRowError[]> {
  if (mapped.length === 0) return [];

  const emails = [...new Set(mapped.map((r) => r.email))];
  const existing = await prisma.user.findMany({
    where: { email: { in: emails } },
    select: { email: true },
  });
  const existingSet = new Set(existing.map((u) => u.email));

  return mapped
    .filter((r) => existingSet.has(r.email))
    .map((r) => ({
      row: r.row,
      field: "email" as const,
      message: "Email already exists",
    }));
}

/**
 * Atomic Excel import pipeline:
 * file validation → parse → headers → row map/validate →
 * in-file duplicates → DB duplicates → hash → single transaction insert.
 *
 * If any row is invalid or duplicated, zero users are inserted.
 */
export async function importUsersFromExcel(
  buffer: ArrayBuffer | Buffer,
): Promise<ImportResult> {
  const parsed = parseWorkbookBuffer(buffer);
  if (parsed.errors.length) {
    return { ok: false, errors: parsed.errors };
  }

  const headerErrors = validateHeaders(parsed.headers);
  if (headerErrors.length) {
    return { ok: false, errors: headerErrors };
  }

  if (parsed.rows.length === 0) {
    return {
      ok: false,
      errors: [
        {
          row: 0,
          field: "file",
          message: "Workbook has no data rows",
        },
      ],
    };
  }

  const { mapped, errors: rowErrors } = mapAndValidateRows(parsed.rows);
  const inFileDupes = findDuplicateEmailsInFile(mapped);
  const dbDupes = await findExistingEmailConflicts(mapped);

  const allErrors = [...rowErrors, ...inFileDupes, ...dbDupes].sort(
    (a, b) => a.row - b.row || a.field.localeCompare(b.field),
  );

  if (allErrors.length > 0) {
    return { ok: false, errors: allErrors };
  }

  const hashed = await Promise.all(
    mapped.map(async (row) => ({
      firstName: row.firstName,
      lastName: row.lastName,
      email: row.email,
      age: row.age,
      password: await hashPassword(row.password),
    })),
  );

  try {
    await prisma.$transaction(
      async (tx) => {
        // Re-check uniqueness inside the transaction to catch races.
        const emails = hashed.map((u) => u.email);
        const existing = await tx.user.findMany({
          where: { email: { in: emails } },
          select: { email: true },
        });
        if (existing.length > 0) {
          throw new ImportConflictError(
            existing.map((u) => u.email),
          );
        }

        await tx.user.createMany({ data: hashed });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  } catch (error) {
    if (error instanceof ImportConflictError) {
      const conflictSet = new Set(error.emails);
      return {
        ok: false,
        errors: mapped
          .filter((r) => conflictSet.has(r.email))
          .map((r) => ({
            row: r.row,
            field: "email",
            message: "Email already exists",
          })),
      };
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        ok: false,
        errors: [
          {
            row: 0,
            field: "email",
            message:
              "One or more emails already exist; no users were imported",
          },
        ],
      };
    }

    throw error;
  }

  return { ok: true, inserted: hashed.length };
}

class ImportConflictError extends Error {
  emails: string[];
  constructor(emails: string[]) {
    super("Import email conflict");
    this.emails = emails;
  }
}
