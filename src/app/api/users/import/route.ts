import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { jsonError, invalidImport } from "@/lib/api";
import {
  importUsersFromExcel,
  validateUploadFile,
} from "@/lib/excel/import";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return jsonError(401, {
      code: "UNAUTHORIZED",
      message: "Authentication required",
    });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return invalidImport([
      { row: 0, field: "file", message: "Invalid multipart form data" },
    ]);
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return invalidImport([
      { row: 0, field: "file", message: "No file uploaded" },
    ]);
  }

  const fileErrors = validateUploadFile(file);
  if (fileErrors.length) {
    return invalidImport(fileErrors);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await importUsersFromExcel(buffer);

  if (!result.ok) {
    return invalidImport(result.errors);
  }

  return NextResponse.json({
    code: "IMPORT_SUCCESS",
    inserted: result.inserted,
  });
}
