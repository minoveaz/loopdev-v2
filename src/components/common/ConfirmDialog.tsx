import type { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

type Tone = "default" | "destructive" | "warning";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: Tone;
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
  /** Optional extra body slot (e.g., a typed-confirm input). */
  children?: ReactNode;
}

const toneIcon: Record<Tone, string> = {
  default: "bg-primary-soft text-primary",
  destructive: "bg-destructive-soft text-destructive",
  warning: "bg-warning-soft text-warning",
};

const toneButton: Record<Tone, string> = {
  default: "bg-primary text-primary-foreground hover:opacity-95",
  destructive: "bg-destructive text-destructive-foreground hover:opacity-95",
  warning: "bg-warning text-warning-foreground hover:opacity-95",
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "default",
  loading = false,
  onConfirm,
  children,
}: ConfirmDialogProps) {
  const handleConfirm = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    await onConfirm();
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <div className="mb-2 flex items-start gap-3">
            <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", toneIcon[tone])}>
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <AlertDialogTitle className="font-display text-lg">{title}</AlertDialogTitle>
              {description && (
                <AlertDialogDescription className="mt-1 text-sm text-muted-foreground">
                  {description}
                </AlertDialogDescription>
              )}
            </div>
          </div>
          {children && <div className="pt-2">{children}</div>}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={loading}
            className={cn("font-semibold", toneButton[tone])}
          >
            {loading ? "Working…" : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
