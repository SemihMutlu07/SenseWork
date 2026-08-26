"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

type RowError = { row: number; message: string };

export function BulkUploadForm() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [rowErrors, setRowErrors] = useState<RowError[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/users/bulk", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        const error = new Error(data.error ?? "Upload failed") as Error & {
          errors?: RowError[];
        };
        error.errors = data.errors;
        throw error;
      }
      return data as { message: string; count: number };
    },
    onSuccess: (data) => {
      setRowErrors([]);
      setSuccessMessage(data.message);
      setFileName(null);
      if (inputRef.current) inputRef.current.value = "";
      router.refresh();
    },
    onError: (error: Error & { errors?: RowError[] }) => {
      setSuccessMessage(null);
      setRowErrors(error.errors ?? []);
    },
  });

  return (
    <div className="max-w-2xl space-y-4">
      <form
        className="space-y-4 rounded-xl border border-border bg-surface p-6 shadow-[var(--shadow)]"
        onSubmit={(event) => {
          event.preventDefault();
          const file = inputRef.current?.files?.[0];
          if (!file) {
            setSuccessMessage(null);
            setRowErrors([{ row: 0, message: "Please choose an Excel file first." }]);
            return;
          }
          mutation.mutate(file);
        }}
      >
        <div className="space-y-2">
          <p className="text-sm text-foreground/70">
            Upload an <code className="rounded bg-surface-muted px-1.5 py-0.5">.xlsx</code> or{" "}
            <code className="rounded bg-surface-muted px-1.5 py-0.5">.xls</code> file with columns:
          </p>
          <p className="rounded-md bg-accent-soft px-3 py-2 font-mono text-sm text-accent-strong">
            name · surname · email · age · password
          </p>
        </div>

        <label className="flex cursor-pointer flex-col items-start gap-2 rounded-lg border border-dashed border-border bg-surface-muted/50 px-4 py-6">
          <span className="text-sm font-medium">Choose Excel file</span>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            className="text-sm"
            onChange={(event) => {
              const file = event.target.files?.[0];
              setFileName(file?.name ?? null);
              setRowErrors([]);
              setSuccessMessage(null);
            }}
          />
          {fileName && <span className="text-sm text-foreground/70">Selected: {fileName}</span>}
        </label>

        <button
          type="submit"
          disabled={mutation.isPending}
          className="rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-strong disabled:opacity-60"
        >
          {mutation.isPending ? "Uploading…" : "Upload and import"}
        </button>
      </form>

      {successMessage && (
        <div className="rounded-xl border border-success/20 bg-success-soft px-4 py-3 text-sm text-success animate-rise">
          {successMessage}
        </div>
      )}

      {mutation.isError && (
        <div className="space-y-2 rounded-xl border border-danger/20 bg-danger-soft px-4 py-3 text-sm text-danger animate-rise">
          <p className="font-semibold">{(mutation.error as Error).message}</p>
          {rowErrors.length > 0 && (
            <ul className="list-disc space-y-1 pl-5">
              {rowErrors.map((error) => (
                <li key={`${error.row}-${error.message}`}>
                  {error.row > 0 ? `Row ${error.row}: ` : ""}
                  {error.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
