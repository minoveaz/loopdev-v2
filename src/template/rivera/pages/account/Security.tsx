import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Eye,
  EyeOff,
  Globe,
  Loader2,
  Lock,
  LogOut,
  Monitor,
  ShieldCheck,
  Smartphone,
  Trash2,
} from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog, DataCard, PageContainer, PageHeader, StatusBadge } from "@/components/common";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { useAuth } from "@/hooks/use-auth";
import { storage } from "@/lib/storage";
import { formatDate } from "@/lib/formatters";

const SECURITY_KEY = "account:security";

interface SecurityState {
  twoFactor: boolean;
  passwordUpdatedAt?: string;
}

const passwordSchema = z
  .object({
    current: z.string().min(1, "Enter your current password."),
    next: z
      .string()
      .min(8, "Use at least 8 characters.")
      .max(128)
      .refine((v) => /[A-Za-z]/.test(v) && /\d/.test(v), {
        message: "Mix letters and numbers for a stronger password.",
      }),
    confirm: z.string(),
  })
  .refine((v) => v.next === v.confirm, {
    message: "Passwords do not match.",
    path: ["confirm"],
  });

const sessions = [
  {
    id: "s_01",
    label: "MacBook Pro · Chrome",
    location: "Lisbon, Portugal",
    ip: "85.241.12.4",
    lastActive: new Date().toISOString(),
    current: true,
    device: "desktop" as const,
  },
  {
    id: "s_02",
    label: "iPhone 15 · Safari",
    location: "Lisbon, Portugal",
    ip: "85.241.12.4",
    lastActive: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    current: false,
    device: "mobile" as const,
  },
  {
    id: "s_03",
    label: "Linux · Firefox",
    location: "Berlin, Germany",
    ip: "94.112.83.220",
    lastActive: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    current: false,
    device: "desktop" as const,
  },
];

export default function SecurityPage() {
  const { trail } = useBreadcrumbs();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const [state, setState] = useState<SecurityState>(() =>
    storage.get<SecurityState>(SECURITY_KEY, { twoFactor: false }),
  );

  const [pwOpen, setPwOpen] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [pwErrors, setPwErrors] = useState<{ current?: string; next?: string; confirm?: string }>({});
  const [pwSaving, setPwSaving] = useState(false);

  const [twoFaOpen, setTwoFaOpen] = useState(false);
  const [twoFaCode, setTwoFaCode] = useState("");
  const [twoFaError, setTwoFaError] = useState<string>();

  const [revokeId, setRevokeId] = useState<string | null>(null);
  const [revokeAllOpen, setRevokeAllOpen] = useState(false);
  const [activeSessions, setActiveSessions] = useState(sessions);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteText, setDeleteText] = useState("");

  function persist(nextState: SecurityState) {
    setState(nextState);
    storage.set(SECURITY_KEY, nextState);
  }

  function submitPasswordChange() {
    const result = passwordSchema.safeParse({ current, next, confirm });
    if (!result.success) {
      const errs: typeof pwErrors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof typeof errs;
        if (!errs[key]) errs[key] = issue.message;
      }
      setPwErrors(errs);
      return;
    }
    setPwErrors({});
    setPwSaving(true);
    setTimeout(() => {
      persist({ ...state, passwordUpdatedAt: new Date().toISOString() });
      setPwSaving(false);
      setPwOpen(false);
      setCurrent("");
      setNext("");
      setConfirm("");
      toast.success("Password updated", { description: "Use your new password next time you sign in." });
    }, 600);
  }

  function handleTwoFactorToggle(enabled: boolean) {
    if (enabled) {
      setTwoFaCode("");
      setTwoFaError(undefined);
      setTwoFaOpen(true);
    } else {
      persist({ ...state, twoFactor: false });
      toast("Two-factor authentication disabled");
    }
  }

  function confirmTwoFa() {
    if (!/^\d{6}$/.test(twoFaCode)) {
      setTwoFaError("Enter the 6-digit code from your authenticator app.");
      return;
    }
    persist({ ...state, twoFactor: true });
    setTwoFaOpen(false);
    toast.success("Two-factor authentication enabled");
  }

  function revokeSession(id: string) {
    setActiveSessions((prev) => prev.filter((s) => s.id !== id));
    toast.success("Session revoked");
    setRevokeId(null);
  }

  function revokeAllOthers() {
    setActiveSessions((prev) => prev.filter((s) => s.current));
    toast.success("All other sessions signed out");
    setRevokeAllOpen(false);
  }

  function handleDeleteAccount() {
    storage.remove(SECURITY_KEY);
    storage.remove("account:profile");
    storage.remove("account:settings");
    toast.success("Account deleted (mock)");
    setDeleteOpen(false);
    signOut();
    navigate("/pages/login", { replace: true });
  }

  return (
    <PageContainer width="default">
      <PageHeader
        eyebrow="Account Settings"
        title="Security"
        description="Manage your password, two-factor authentication, and active sessions."
        breadcrumbs={trail.length ? trail : [{ label: "Account Settings" }, { label: "Security" }]}
      />

      <div className="space-y-6">
        <DataCard
          title="Password"
          description={
            state.passwordUpdatedAt
              ? `Last changed on ${formatDate(state.passwordUpdatedAt, "medium")}`
              : "We recommend rotating your password every 90 days."
          }
          action={<Button onClick={() => setPwOpen(true)}>Change password</Button>}
        >
          <div className="flex items-center gap-3 surface-card-muted-compact p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <Lock className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Strong password recommended</p>
              <p className="text-xs text-muted-foreground">
                Use at least 8 characters, including letters and numbers.
              </p>
            </div>
          </div>
        </DataCard>

        <DataCard
          title="Two-factor authentication"
          description="Add an extra layer of security at sign in"
        >
          <label className="flex items-start justify-between gap-4 surface-card-muted-compact p-4">
            <div className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-success-soft text-success">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-foreground">Authenticator app</p>
                  <StatusBadge tone={state.twoFactor ? "success" : "neutral"} dot>
                    {state.twoFactor ? "Enabled" : "Disabled"}
                  </StatusBadge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Use a TOTP app like 1Password or Authy to generate codes when signing in.
                </p>
              </div>
            </div>
            <Switch checked={state.twoFactor} onCheckedChange={handleTwoFactorToggle} />
          </label>
        </DataCard>

        <DataCard
          title="Active sessions"
          description="Devices currently signed in to your Rivera account"
          action={
            activeSessions.length > 1 ? (
              <Button variant="outline" size="sm" onClick={() => setRevokeAllOpen(true)}>
                <LogOut className="h-4 w-4" /> Sign out everywhere else
              </Button>
            ) : undefined
          }
          flush
        >
          <ul className="divide-y divide-border">
            {activeSessions.map((s) => {
              const Icon = s.device === "mobile" ? Smartphone : Monitor;
              return (
                <li key={s.id} className="flex items-center justify-between gap-4 px-5 py-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-card-muted text-foreground">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-foreground">{s.label}</p>
                        {s.current && <StatusBadge tone="primary" dot>This device</StatusBadge>}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        <Globe className="mr-1 inline h-3 w-3" />
                        {s.location} · {s.ip}
                      </p>
                      <p className="font-mono text-[11px] text-muted-foreground">
                        Last active {formatDate(s.lastActive, "datetime")}
                      </p>
                    </div>
                  </div>
                  {!s.current && (
                    <Button variant="ghost" size="sm" onClick={() => setRevokeId(s.id)}>Revoke</Button>
                  )}
                </li>
              );
            })}
          </ul>
        </DataCard>

        <DataCard
          title="Danger zone"
          description="Irreversible actions for your account"
          className="border-destructive/40"
        >
          <div className="flex flex-col gap-3 rounded-xl border border-destructive/30 bg-destructive-soft/40 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-destructive-soft text-destructive">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-foreground">Delete account</p>
                <p className="text-sm text-muted-foreground">
                  Permanently remove your account and all associated workspace data. This action cannot be undone.
                </p>
              </div>
            </div>
            <Button variant="destructive" onClick={() => setDeleteOpen(true)} className="gap-2">
              <Trash2 className="h-4 w-4" /> Delete account
            </Button>
          </div>
        </DataCard>
      </div>

      {/* Change password dialog */}
      <Dialog open={pwOpen} onOpenChange={setPwOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change password</DialogTitle>
            <DialogDescription>Enter your current password and choose a new one.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="current">Current password</Label>
              <div className="relative">
                <Input
                  id="current"
                  type={showCurrent ? "text" : "password"}
                  value={current}
                  onChange={(e) => setCurrent(e.target.value)}
                  aria-invalid={!!pwErrors.current}
                />
                <button
                  type="button"
                  aria-label={showCurrent ? "Hide password" : "Show password"}
                  onClick={() => setShowCurrent((v) => !v)}
                  className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {pwErrors.current && <p className="text-xs text-destructive">{pwErrors.current}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="next">New password</Label>
              <div className="relative">
                <Input
                  id="next"
                  type={showNext ? "text" : "password"}
                  value={next}
                  onChange={(e) => setNext(e.target.value)}
                  aria-invalid={!!pwErrors.next}
                />
                <button
                  type="button"
                  aria-label={showNext ? "Hide password" : "Show password"}
                  onClick={() => setShowNext((v) => !v)}
                  className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  {showNext ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {pwErrors.next && <p className="text-xs text-destructive">{pwErrors.next}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm">Confirm new password</Label>
              <Input
                id="confirm"
                type={showNext ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                aria-invalid={!!pwErrors.confirm}
              />
              {pwErrors.confirm && <p className="text-xs text-destructive">{pwErrors.confirm}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPwOpen(false)} disabled={pwSaving}>Cancel</Button>
            <Button onClick={submitPasswordChange} disabled={pwSaving} className="gap-2">
              {pwSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              {pwSaving ? "Saving…" : "Update password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Two-factor enable dialog */}
      <Dialog open={twoFaOpen} onOpenChange={setTwoFaOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enable two-factor authentication</DialogTitle>
            <DialogDescription>
              Scan the QR code with your authenticator app, then enter the 6-digit code below to confirm.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-center justify-center surface-card-muted-compact p-6">
              <div
                className="grid h-32 w-32 grid-cols-8 grid-rows-8 gap-px rounded-md bg-muted p-2"
                aria-hidden
              >
                {Array.from({ length: 64 }).map((_, i) => (
                  <span
                    key={i}
                    className={(i * 13) % 3 === 0 ? "rounded-sm bg-foreground" : "rounded-sm bg-card"}
                  />
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="totp">Verification code</Label>
              <Input
                id="totp"
                inputMode="numeric"
                maxLength={6}
                value={twoFaCode}
                onChange={(e) => setTwoFaCode(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                aria-invalid={!!twoFaError}
              />
              {twoFaError && <p className="text-xs text-destructive">{twoFaError}</p>}
              <p className="text-xs text-muted-foreground">Demo code: any 6 digits will be accepted.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTwoFaOpen(false)}>Cancel</Button>
            <Button onClick={confirmTwoFa}>Enable 2FA</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke single session */}
      <ConfirmDialog
        open={!!revokeId}
        onOpenChange={(o) => !o && setRevokeId(null)}
        title="Revoke this session?"
        description="The device will be signed out immediately."
        confirmLabel="Revoke"
        tone="warning"
        onConfirm={() => revokeId && revokeSession(revokeId)}
      />

      {/* Revoke all others */}
      <ConfirmDialog
        open={revokeAllOpen}
        onOpenChange={setRevokeAllOpen}
        title="Sign out all other sessions?"
        description="You'll stay signed in on this device. All other devices will need to sign in again."
        confirmLabel="Sign them out"
        tone="warning"
        onConfirm={revokeAllOthers}
      />

      {/* Delete account */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={(o) => {
          setDeleteOpen(o);
          if (!o) setDeleteText("");
        }}
        title="Delete your account?"
        description="This permanently removes your account and all associated data. This action cannot be undone."
        confirmLabel={deleteText === "DELETE" ? "Delete account" : "Type DELETE to confirm"}
        tone="destructive"
        loading={false}
        onConfirm={() => {
          if (deleteText !== "DELETE") {
            toast.error("Type DELETE to confirm");
            return;
          }
          handleDeleteAccount();
        }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="confirm-delete">Type <span className="font-mono text-destructive">DELETE</span> to confirm</Label>
          <Input
            id="confirm-delete"
            value={deleteText}
            onChange={(e) => setDeleteText(e.target.value)}
            placeholder="DELETE"
          />
        </div>
      </ConfirmDialog>
    </PageContainer>
  );
}