import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog, PageContainer, PageHeader } from "@/components/common";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { Showcase, ShowcaseRow } from "@/features/ui-kit/Showcase";
import { toast } from "sonner";

export default function ModalsPage() {
  const { trail } = useBreadcrumbs();
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <PageContainer width="default">
      <PageHeader
        eyebrow="UI Kit"
        title="Modals"
        description="Dialogs, drawers, confirmation prompts, and toasts."
        breadcrumbs={trail.length ? trail : [{ label: "UI Kit" }, { label: "Modals" }]}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Showcase title="Dialog" description="Centered modal for forms or focused tasks" hint="Dialog">
          <ShowcaseRow>
            <Dialog>
              <DialogTrigger asChild>
                <Button>Open dialog</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite teammate</DialogTitle>
                  <DialogDescription>
                    They'll receive an email invitation to join your workspace.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3 py-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="invite-email">Email</Label>
                    <Input id="invite-email" type="email" placeholder="teammate@rivera.app" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="invite-msg">Note (optional)</Label>
                    <Textarea id="invite-msg" rows={3} placeholder="Welcome to the team!" />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline">Cancel</Button>
                  <Button>Send invite</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </ShowcaseRow>
        </Showcase>

        <Showcase title="Drawer / Sheet" description="Slide-in panel for details and side flows" hint="Sheet">
          <ShowcaseRow>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline">Open drawer</Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Order details</SheetTitle>
                  <SheetDescription>Review payment, items, and shipping.</SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Order</span>
                    <span className="font-mono text-foreground">ORD-30418</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Customer</span>
                    <span className="text-foreground">Aurora Studio</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total</span>
                    <span className="font-mono text-foreground">$1,240.00</span>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </ShowcaseRow>
        </Showcase>

        <Showcase title="Alert dialog" description="Block-and-confirm destructive actions" hint="AlertDialog">
          <ShowcaseRow>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 /> Delete project
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this project?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. All tasks, files, and history will be permanently removed.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </ShowcaseRow>
        </Showcase>

        <Showcase title="Confirm dialog" description="Rivera helper for inline confirmations" hint="ConfirmDialog">
          <ShowcaseRow>
            <Button variant="outline" onClick={() => setConfirmOpen(true)}>
              Confirm action
            </Button>
          </ShowcaseRow>
          <ConfirmDialog
            open={confirmOpen}
            onOpenChange={setConfirmOpen}
            title="Archive workspace?"
            description="You can restore archived workspaces from settings within 30 days."
            confirmLabel="Archive"
            tone="warning"
            onConfirm={() => {
              toast.success("Workspace archived");
            }}
          />
        </Showcase>

        <Showcase title="Toasts" description="Non-blocking feedback via sonner" hint="toast" className="lg:col-span-2">
          <ShowcaseRow label="Variants">
            <Button variant="outline" onClick={() => toast("Settings updated")}>Default</Button>
            <Button variant="outline" onClick={() => toast.success("Invoice sent")}>Success</Button>
            <Button variant="outline" onClick={() => toast.warning("Storage almost full")}>Warning</Button>
            <Button variant="outline" onClick={() => toast.error("Could not save changes")}>Error</Button>
            <Button variant="outline" onClick={() => toast("Project archived", { description: "You can restore it within 30 days.", action: { label: "Undo", onClick: () => toast("Restored") } })}>
              With action
            </Button>
          </ShowcaseRow>
        </Showcase>
      </div>
    </PageContainer>
  );
}