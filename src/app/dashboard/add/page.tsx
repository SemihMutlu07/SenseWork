import { AddUserForm } from "@/components/add-user-form";

export default function AddUserPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Add user</h1>
        <p className="mt-1 text-sm text-muted">
          Create a single user. Passwords are hashed before storage.
        </p>
      </div>
      <div className="rounded-lg border border-border bg-white p-6">
        <AddUserForm />
      </div>
    </div>
  );
}
