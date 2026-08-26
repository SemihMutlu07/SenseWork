export type ImportRowError = {
  row: number;
  field: string;
  message: string;
};

export type InvalidImportErrorBody = {
  code: "INVALID_IMPORT";
  errors: ImportRowError[];
};

export type ApiErrorBody = {
  code: string;
  message: string;
  errors?: ImportRowError[] | Array<{ field: string; message: string }>;
};

export function jsonError(
  status: number,
  body: ApiErrorBody | InvalidImportErrorBody,
) {
  return Response.json(body, { status });
}

export function invalidImport(errors: ImportRowError[]) {
  return jsonError(400, {
    code: "INVALID_IMPORT",
    errors,
  });
}
