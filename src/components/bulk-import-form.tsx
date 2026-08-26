"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";

type ImportRowError = {
  row: number;
  field: string;
  message: string;
};

export function BulkImportForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<ImportRowError[]>([]);
  const [success, setSuccess] = useState<string | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);

  const importMutation = useMutation({
    mutationFn: async (upload: File) => {
      const body = new FormData();
      body.append("file", upload);
      const res = await fetch("/api/users/import", {
        method: "POST",
        body,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const err = new Error(
          data.code === "INVALID_IMPORT"
            ? "Import validation failed"
            : typeof data.message === "string"
              ? data.message
              : "Import failed",
        ) as Error & { errors?: ImportRowError[] };
        if (Array.isArray(data.errors)) {
          err.errors = data.errors;
        }
        throw err;
      }
      return data as { inserted: number };
    },
    onSuccess: (data) => {
      setErrors([]);
      setClientError(null);
      setSuccess(`Successfully imported ${data.inserted} user(s).`);
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
      queryClient.invalidateQueries({ queryKey: ["users"] });
      router.refresh();
    },
    onError: (err: Error & { errors?: ImportRowError[] }) => {
      setSuccess(null);
      if (err.errors?.length) {
        setErrors(err.errors);
        setClientError(null);
      } else {
        setErrors([]);
        setClientError(err.message);
      }
    },
  });

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <div className="rounded-md border border-border bg-slate-50 px-4 py-3 text-sm text-slate-700">
        <p className="font-medium">Required columns</p>
        <p className="mt-1 font-mono text-xs">
          name, surname, email, age, password
        </p>
        <p className="mt-2 text-muted">
          Import is all-or-nothing: if any row is invalid or duplicated, no
          users from the file are inserted.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="file" className="text-sm font-medium text-slate-700">
          Excel file (.xlsx / .xls)
        </label>
        <input
          id="file"
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null);
            setErrors([]);
            setSuccess(null);
            setClientError(null);
          }}
          className="block w-full text-sm"
        />
      </div>

      <button
        type="button"
        disabled={!file || importMutation.isPending}
        onClick={() => {
          if (!file) {
            setClientError("Choose an Excel file first");
            return;
          }
          importMutation.mutate(file);
        }}
        className="w-fit rounded-md bg-accent px-4 py-2.5 font-medium text-white hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        {importMutation.isPending ? "Importing…" : "Upload and import"}
      </button>

      {success && (
        <p className="rounded-md border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-800">
          {success}
        </p>
      )}

      {clientError && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-danger">
          {clientError}
        </p>
      )}

      {errors.length > 0 && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-3">
          <p className="text-sm font-medium text-danger">
            Import failed — no users were inserted ({errors.length} error
            {errors.length === 1 ? "" : "s"})
          </p>
          <ul className="mt-2 max-h-64 overflow-auto text-sm text-red-800">
            {errors.map((err, idx) => (
              <li key={`${err.row}-${err.field}-${idx}`} className="py-0.5">
                {err.row > 0 ? `Row ${err.row}` : "File"} ·{" "}
                <span className="font-mono">{err.field}</span>: {err.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
