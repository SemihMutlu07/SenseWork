import { AddUserForm } from "@/components/add-user-form";

export default function AddUserPage() {
  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Add user</h1>
        <p className="text-sm text-foreground/70">
          Create a single user with React Hook Form and Zod validation.
        </p>
      </div>
      <AddUserForm />
    </section>
  );
}
