import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/common";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, CreditCard, Mail, Trash2 } from "lucide-react";
import { formatCurrency, formatDate, getInitials } from "@/lib/formatters";
import type { Order, OrderStatus } from "@/types";
import { fulfillmentFor, fulfillmentTone, orderStatusTone } from "./shared";

const STATUSES: OrderStatus[] = ["pending", "paid", "shipped", "refunded", "failed", "cancelled"];

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  order: Order | null;
  onStatusChange: (id: string, status: OrderStatus) => void;
  onDelete: (order: Order) => void;
}

export function OrderDetailsDrawer({ open, onOpenChange, order, onStatusChange, onDelete }: Props) {
  if (!order) return null;
  const fulfill = fulfillmentFor(order.status);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-display text-xl">Order details</SheetTitle>
          <SheetDescription className="font-mono text-xs">{order.reference}</SheetDescription>
        </SheetHeader>

        <div className="mt-6 flex items-center gap-4">
          <Avatar className="h-12 w-12 border border-border">
            <AvatarFallback className="bg-info-soft text-sm font-semibold text-info">
              {getInitials(order.customer)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate font-display text-lg font-semibold text-foreground">{order.customer}</p>
            <a href={`mailto:${order.customerEmail}`} className="inline-flex items-center gap-1 truncate text-xs text-muted-foreground hover:text-foreground">
              <Mail className="h-3 w-3" /> {order.customerEmail}
            </a>
          </div>
        </div>

        <div className="mt-5 surface-card-muted-compact p-4">
          <div className="flex items-baseline justify-between">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">Total</span>
            <span className="font-display text-2xl font-semibold text-foreground">
              {formatCurrency(order.amount, order.currency)}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <CreditCard className="h-3.5 w-3.5" /> {order.paymentMethod}
            </span>
            <span>{order.items} item{order.items === 1 ? "" : "s"}</span>
          </div>
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-4 surface-card-compact p-4 text-sm">
          <div>
            <dt className="text-xs uppercase tracking-wider text-muted-foreground">Payment</dt>
            <dd className="mt-1.5">
              <StatusBadge tone={orderStatusTone[order.status]} dot>{order.status}</StatusBadge>
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-muted-foreground">Fulfillment</dt>
            <dd className="mt-1.5">
              <StatusBadge tone={fulfillmentTone[fulfill]} dot>{fulfill}</StatusBadge>
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-muted-foreground">Created</dt>
            <dd className="mt-1 text-foreground">{formatDate(order.createdAt, "datetime")}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-muted-foreground">Updated</dt>
            <dd className="mt-1 text-foreground">{formatDate(order.updatedAt, "datetime")}</dd>
          </div>
        </dl>

        <div className="mt-6 flex items-center justify-between gap-3 border-t border-border pt-5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                Update status <ChevronDown className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44">
              <DropdownMenuLabel className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Set payment status
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {STATUSES.map((s) => (
                <DropdownMenuItem key={s} onClick={() => onStatusChange(order.id, s)} className="capitalize">
                  {s}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="ghost" size="sm" onClick={() => onDelete(order)} className="text-destructive hover:text-destructive">
            <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
          </Button>
        </div>

        <p className="mt-3 text-[11px] text-muted-foreground">
          Status updates are stored in localStorage only — no real fulfillment or payment changes.
        </p>
      </SheetContent>
    </Sheet>
  );
}