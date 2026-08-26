import * as XLSX from "xlsx";
import type { ImportRowError } from "@/lib/api";
import { normalizeEmail } from "@/lib/validations/user";

/** Excel column headers required by the case. */
export const EXCEL_HEADERS = [
  "name",
  "surname",
  "email",
  "age",
  "password",
] as const;

export type ExcelHeader = (typeof EXCEL_HEADERS)[number];

/** Explicit mapping from Excel columns → database User fields. */
export const EXCEL_TO_USER_FIELD = {
  name: "firstName",
  surname: "lastName",
  email: "email",
  age: "age",
  password: "password",
} as const satisfies Record<ExcelHeader, string>;

export type MappedImportRow = {
  /** 1-based Excel row number (header is row 1). */
  row: number;
  firstName: string;
  lastName: string;
  email: string;
  age: number;
  password: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function cellToString(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value).trim();
  }
  return String(value).trim();
}

/**
 * Age must be an integer domain value. Do not silently coerce
 * "twenty", 25.5, or empty cells into valid ages.
 */
function parseAge(value: unknown): { ok: true; value: number } | { ok: false } {
  if (value == null || value === "") return { ok: false };
  if (typeof value === "number") {
    if (!Number.isFinite(value) || !Number.isInteger(value)) return { ok: false };
    return { ok: true, value };
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!/^-?\d+$/.test(trimmed)) return { ok: false };
    const n = Number(trimmed);
    if (!Number.isInteger(n)) return { ok: false };
    return { ok: true, value: n };
  }
  return { ok: false };
}

export function validateHeaders(headers: string[]): ImportRowError[] {
  const normalized = headers.map((h) => h.trim().toLowerCase());
  const errors: ImportRowError[] = [];

  for (const required of EXCEL_HEADERS) {
    if (!normalized.includes(required)) {
      errors.push({
        row: 1,
        field: required,
        message: `Missing required column "${required}"`,
      });
    }
  }

  return errors;
}

export function parseWorkbookBuffer(buffer: ArrayBuffer | Buffer): {
  headers: string[];
  rows: Record<string, unknown>[];
  errors: ImportRowError[];
} {
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buffer, { type: "buffer", cellDates: false });
  } catch {
    return {
      headers: [],
      rows: [],
      errors: [
        {
          row: 0,
          field: "file",
          message: "Unable to parse Excel file",
        },
      ],
    };
  }

  if (!workbook.SheetNames.length) {
    return {
      headers: [],
      rows: [],
      errors: [
        {
          row: 0,
          field: "file",
          message: "Workbook is empty",
        },
      ],
    };
  }

  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet || !sheet["!ref"]) {
    return {
      headers: [],
      rows: [],
      errors: [
        {
          row: 0,
          field: "file",
          message: "Workbook is empty",
        },
      ],
    };
  }

  const matrix = XLSX.utils.sheet_to_json<(string | number | boolean | null)[]>(
    sheet,
    {
      header: 1,
      defval: null,
      blankrows: false,
      raw: true,
    },
  );

  if (!matrix.length) {
    return {
      headers: [],
      rows: [],
      errors: [
        {
          row: 0,
          field: "file",
          message: "Workbook is empty",
        },
      ],
    };
  }

  const headerRow = matrix[0] ?? [];
  const headers = headerRow.map((cell) => cellToString(cell).toLowerCase());

  if (headers.every((h) => h === "")) {
    return {
      headers: [],
      rows: [],
      errors: [
        {
          row: 1,
          field: "file",
          message: "Header row is empty",
        },
      ],
    };
  }

  const rows: Record<string, unknown>[] = [];
  for (let i = 1; i < matrix.length; i++) {
    const values = matrix[i] ?? [];
    const isBlank = values.every(
      (v) => v == null || cellToString(v) === "",
    );
    if (isBlank) continue;

    const record: Record<string, unknown> = {};
    for (let c = 0; c < headers.length; c++) {
      const key = headers[c];
      if (!key) continue;
      record[key] = values[c] ?? null;
    }
    // Attach Excel row number (header = 1)
    record.__row = i + 1;
    rows.push(record);
  }

  return { headers, rows, errors: [] };
}

export function mapAndValidateRows(
  rows: Record<string, unknown>[],
): { mapped: MappedImportRow[]; errors: ImportRowError[] } {
  const mapped: MappedImportRow[] = [];
  const errors: ImportRowError[] = [];

  for (const raw of rows) {
    const row = Number(raw.__row) || 0;
    const firstName = cellToString(raw.name);
    const lastName = cellToString(raw.surname);
    const emailRaw = cellToString(raw.email);
    const password = cellToString(raw.password);
    const ageParsed = parseAge(raw.age);

    if (!firstName) {
      errors.push({ row, field: "name", message: "Name is required" });
    }
    if (!lastName) {
      errors.push({ row, field: "surname", message: "Surname is required" });
    }
    if (!emailRaw) {
      errors.push({ row, field: "email", message: "Email is required" });
    } else if (!EMAIL_RE.test(emailRaw)) {
      errors.push({
        row,
        field: "email",
        message: "Invalid email address",
      });
    }
    if (!ageParsed.ok) {
      errors.push({
        row,
        field: "age",
        message: "Age must be a whole number between 0 and 150",
      });
    } else if (ageParsed.value < 0 || ageParsed.value > 150) {
      errors.push({
        row,
        field: "age",
        message: "Age must be a whole number between 0 and 150",
      });
    }
    if (!password) {
      errors.push({
        row,
        field: "password",
        message: "Password is required",
      });
    }

    if (
      firstName &&
      lastName &&
      emailRaw &&
      EMAIL_RE.test(emailRaw) &&
      ageParsed.ok &&
      ageParsed.value >= 0 &&
      ageParsed.value <= 150 &&
      password
    ) {
      mapped.push({
        row,
        firstName,
        lastName,
        email: normalizeEmail(emailRaw),
        age: ageParsed.value,
        password,
      });
    }
  }

  return { mapped, errors };
}

export function findDuplicateEmailsInFile(
  mapped: MappedImportRow[],
): ImportRowError[] {
  const seen = new Map<string, number>();
  const errors: ImportRowError[] = [];

  for (const row of mapped) {
    const prev = seen.get(row.email);
    if (prev != null) {
      errors.push({
        row: row.row,
        field: "email",
        message: `Duplicate email in file (also on row ${prev})`,
      });
    } else {
      seen.set(row.email, row.row);
    }
  }

  return errors;
}
