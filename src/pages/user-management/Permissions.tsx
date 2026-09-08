import { useEffect, useMemo, useState } from "react";
import { Check, ShieldCheck, X, RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";
import { DataCard, PageContainer, PageHeader, StatusBadge } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { useLocalStore } from "@/lib/localStore";
import { rolesStore } from "@/data";
import {
  ALL_SIM_PERMISSION_KEYS, SIM_PERMISSIONS, type SimPermissionKey,
  rolePermsToSim,
} from "@/features/roles/permissions";

const KEY = "user-management:permission-overrides";

type Matrix = Record<string, SimPermissionKey[]>;

function loadOverrides(): Matrix {
  try { return JSON.parse(localStorage.getItem(KEY) || "{}"); }
  catch { return {}; }
}

export default function PermissionsPage() {
  const { trail } = useBreadcrumbs();
  const roles = useLocalStore(rolesStore);

  // base matrix from role.permissions, then overlay any local overrides
  const initial = useMemo<Matrix>(() => {
    const base: Matrix = {};
    for (const r of roles) base[r.id] = rolePermsToSim(r.permissions);
    return base;
  }, [roles]);

  const [matrix, setMatrix] = useState<Matrix>(() => ({ ...initial, ...loadOverrides() }));
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setMatrix((m) => ({ ...initial, ...m, ...loadOverrides() }));
  }, [initial]);

  const toggle = (roleId: string, key: SimPermissionKey) => {
    setMatrix((m) => {
      const list = new Set(m[roleId] ?? []);
      list.has(key) ? list.delete(key) : list.add(key);
      return { ...m, [roleId]: [...list] };
    });
    setDirty(true);
  };

  const setAll = (roleId: string, on: boolean) => {
    setMatrix((m) => ({ ...m, [roleId]: on ? [...ALL_SIM_PERMISSION_KEYS] : [] }));
    setDirty(true);
  };

  const save = () => {
    localStorage.setItem(KEY, JSON.stringify(matrix));
    setDirty(false);
    toast.success("Permission overrides saved locally.");
  };

  const reset = () => {
    localStorage.removeItem(KEY);
    setMatrix(initial);
    setDirty(false);
    toast.success("Reset to role defaults.");
  };

  return (
    <PageContainer width="wide">
      <PageHeader
        eyebrow="User management"
        title="User permissions"
        description="Visualise and toggle simulated permissions per role. Local-only — not enforced."
        breadcrumbs={trail.length ? trail : [{ label: "User management" }, { label: "Permissions" }]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={reset}><RotateCcw className="h-3.5 w-3.5" />Reset</Button>
            <Button onClick={save} disabled={!dirty}><Save className="h-3.5 w-3.5" />Save changes</Button>
          </div>
        }
      />

      <div className="rounded-lg border border-info/30 bg-info-soft/40 px-4 py-3 text-sm text-foreground">
        <p className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-info" /> Permissions on this page are visual only — Rivera does not enforce authorization.</p>
      </div>

      <DataCard title="Permission matrix" description="Toggle to grant or revoke per role" flush>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-card-muted text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="sticky left-0 bg-card-muted px-5 py-3 font-medium">Permission</th>
                {roles.map((r) => (
                  <th key={r.id} className="px-3 py-3 text-center font-medium">
                    <p>{r.name}</p>
                    <div className="mt-1 flex justify-center gap-1">
                      <button onClick={() => setAll(r.id, true)} className="text-[10px] text-muted-foreground hover:text-foreground">All</button>
                      <span className="text-[10px] text-muted-foreground">·</span>
                      <button onClick={() => setAll(r.id, false)} className="text-[10px] text-muted-foreground hover:text-foreground">None</button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {SIM_PERMISSIONS.map((p) => (
                <tr key={p.key} className="transition-fast hover:bg-muted/40">
                  <td className="sticky left-0 bg-card px-5 py-3">
                    <p className="font-medium text-foreground">{p.label}</p>
                    <p className="text-xs text-muted-foreground">{p.description}</p>
                    <StatusBadge tone="neutral" className="mt-1.5">{p.group}</StatusBadge>
                  </td>
                  {roles.map((r) => {
                    const granted = (matrix[r.id] ?? []).includes(p.key);
                    return (
                      <td key={r.id} className="px-3 py-3 text-center">
                        <div className="flex flex-col items-center gap-1.5">
                          <span className={`inline-flex h-6 w-6 items-center justify-center rounded-md ${granted ? "bg-success-soft text-success" : "bg-muted text-muted-foreground/60"}`}>
                            {granted ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                          </span>
                          <Switch checked={granted} onCheckedChange={() => toggle(r.id, p.key)} />
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DataCard>
    </PageContainer>
  );
}