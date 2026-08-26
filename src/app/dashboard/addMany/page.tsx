import { BulkUploadForm } from "@/components/bulk-upload-form";

export default function AddManyPage() {
  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Bulk upload</h1>
        <p className="text-sm text-foreground/70">
          Import users from Excel. Validation errors are returned with row numbers and nothing is
          saved if any row fails.
        </p>
      </div>
      <BulkUploadForm />
    </section>
  );
}
