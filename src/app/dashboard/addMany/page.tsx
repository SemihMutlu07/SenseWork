import { BulkImportForm } from "@/components/bulk-import-form";

export default function AddManyPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Bulk import</h1>
        <p className="mt-1 text-sm text-muted">
          Upload an Excel workbook to create multiple users atomically.
        </p>
      </div>
      <div className="rounded-lg border border-border bg-white p-6">
        <BulkImportForm />
      </div>
    </div>
  );
}
