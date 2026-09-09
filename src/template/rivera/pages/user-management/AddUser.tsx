import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";
import { DataCard, PageContainer, PageHeader } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { useLocalStore } from "@/lib/localStore";
import { rolesStore, usersStore } from "@/template/rivera/data";
import type { UserStatus } from "@/types";

const schema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  email: z.string().trim().email("Enter a valid email").max(160),
  title: z.string().trim().max(80).optional().or(z.literal("")),
  department: z.string().trim().max(80).optional().or(z.literal("")),
  roleId: z.string().min(1, "Pick a role"),
  status: z.enum(["active", "pending", "suspended", "archived"]),
});

type Form = z.infer<typeof schema>;

const empty: Form = { name: "", email: "", title: "", department: "", roleId: "", status: "active" };

export default function AddUserPage() {
  const { trail } = useBreadcrumbs();
  const navigate = useNavigate();
  const roles = useLocalStore(rolesStore);
  const [form, setForm] = useState<Form>({ ...empty, roleId: roles[0]?.id ?? "" });
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});

  const update = <K extends keyof Form>(key: K, value: Form[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: Partial<Record<keyof Form, string>> = {};
      for (const issue of parsed.error.issues) {
        const k = issue.path[0] as keyof Form;
        if (!fieldErrors[k]) fieldErrors[k] = issue.message;
      }
      setErrors(fieldErrors);
      toast.error("Please fix the highlighted fields.");
      return;
    }
    const data = parsed.data;
    usersStore.create({
      name: data.name,
      email: data.email,
      roleId: data.roleId,
      status: data.status as UserStatus,
      title: data.title || undefined,
      department: data.department || undefined,
      lastActiveAt: new Date().toISOString(),
    });
    navigate("/user-management/users");
  };

  return (
    <PageContainer width="narrow">
      <PageHeader
        eyebrow="User management"
        title="Add user"
        description="Invite a new member to the workspace."
        breadcrumbs={trail.length ? trail : [{ label: "User management" }, { label: "Users" }, { label: "Add" }]}
        actions={
          <Button variant="outline" asChild>
            <Link to="/user-management/users"><ArrowLeft className="h-3.5 w-3.5" />Back</Link>
          </Button>
        }
      />

      <form onSubmit={submit}>
        <DataCard title="Member details" description="All fields validated locally">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" error={errors.name}>
              <Input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Jane Doe" maxLength={80} />
            </Field>
            <Field label="Email" error={errors.email}>
              <Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="jane@rivera.app" maxLength={160} />
            </Field>
            <Field label="Title" error={errors.title}>
              <Input value={form.title ?? ""} onChange={(e) => update("title", e.target.value)} placeholder="Designer" maxLength={80} />
            </Field>
            <Field label="Department" error={errors.department}>
              <Input value={form.department ?? ""} onChange={(e) => update("department", e.target.value)} placeholder="Design" maxLength={80} />
            </Field>
            <Field label="Role" error={errors.roleId}>
              <Select value={form.roleId} onValueChange={(v) => update("roleId", v)}>
                <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                <SelectContent>{roles.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Status" error={errors.status}>
              <Select value={form.status} onValueChange={(v) => update("status", v as UserStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="mt-6 flex justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="ghost" asChild><Link to="/user-management/users">Cancel</Link></Button>
            <Button type="submit"><Save className="h-3.5 w-3.5" />Create user</Button>
          </div>
        </DataCard>
      </form>
    </PageContainer>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}