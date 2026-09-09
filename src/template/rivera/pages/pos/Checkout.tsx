import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Minus, Plus, ScanBarcode, Search, ShoppingCart, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { EmptyState, PageContainer, PageHeader } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { useLocalStore } from "@/lib/localStore";
import { posStore, productsStore, customersStore } from "@/template/rivera/data";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import type { PosLineItem, PosPaymentMethod, Product, Customer } from "@/types";
import { getPosSettings } from "@/template/rivera/features/pos/shared";

interface CartLine extends PosLineItem {}

export default function PosCheckout() {
  const { trail } = useBreadcrumbs();
  const navigate = useNavigate();
  const products = useLocalStore(productsStore) as readonly Product[];
  const customers = useLocalStore(customersStore) as readonly Customer[];
  const settings = getPosSettings();

  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [discountPct, setDiscountPct] = useState(0);
  const [payment, setPayment] = useState<PosPaymentMethod>("card");
  const [customerId, setCustomerId] = useState<string>("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = products.filter((p) => p.status !== "archived");
    if (!q) return list.slice(0, 24);
    return list.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)).slice(0, 24);
  }, [products, search]);

  const addToCart = (p: Product) => {
    if (p.stock === 0) return toast.error(`${p.name} is out of stock`);
    setCart((c) => {
      const found = c.find((l) => l.productId === p.id);
      if (found) return c.map((l) => (l.productId === p.id ? { ...l, quantity: l.quantity + 1 } : l));
      return [...c, { productId: p.id, sku: p.sku, name: p.name, price: p.price, quantity: 1 }];
    });
  };

  const updateQty = (productId: string, delta: number) => {
    setCart((c) =>
      c
        .map((l) => (l.productId === productId ? { ...l, quantity: Math.max(0, l.quantity + delta) } : l))
        .filter((l) => l.quantity > 0),
    );
  };

  const removeLine = (productId: string) => setCart((c) => c.filter((l) => l.productId !== productId));
  const clearCart = () => setCart([]);

  const totals = useMemo(() => {
    const subtotal = cart.reduce((s, l) => s + l.price * l.quantity, 0);
    const discount = +(subtotal * (discountPct / 100)).toFixed(2);
    const taxable = subtotal - discount;
    const tax = +(taxable * (settings.taxRate / 100)).toFixed(2);
    const total = +(taxable + tax).toFixed(2);
    const items = cart.reduce((s, l) => s + l.quantity, 0);
    return { subtotal, discount, tax, total, items };
  }, [cart, discountPct, settings.taxRate]);

  const completeSale = () => {
    if (cart.length === 0) return toast.error("Cart is empty");
    const customer = customers.find((c) => c.id === customerId);
    const txn = posStore.create({
      reference: `POS-${Math.floor(2500 + Math.random() * 7500)}`,
      cashier: settings.cashier,
      registerId: settings.registerId,
      items: totals.items,
      subtotal: +totals.subtotal.toFixed(2),
      tax: totals.tax,
      total: totals.total,
      currency: settings.currency,
      payment,
      status: "completed",
      lineItems: cart,
      discount: totals.discount,
      customerId: customer?.id,
      customerName: customer?.name,
    });
    toast.success("Sale complete", { description: `${txn.reference} · ${formatCurrency(txn.total, settings.currency)}` });
    setCart([]);
    setDiscountPct(0);
    navigate(`/pos/orders/receipt?id=${txn.id}`);
  };

  return (
    <PageContainer width="wide">
      <PageHeader
        eyebrow="POS System"
        title="Checkout"
        description="Scan items, build a cart, take payment."
        breadcrumbs={trail.length ? trail : [{ label: "POS System" }, { label: "Checkout" }]}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_380px]">
        {/* Product picker */}
        <section className="surface-card p-5">
          <div className="mb-4 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products by name or SKU…" className="pl-9" />
            </div>
            <Button variant="outline" className="gap-2"><ScanBarcode className="h-4 w-4" /> Scan</Button>
          </div>
          {filtered.length === 0 ? (
            <EmptyState icon={Search} title="No matching products" />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {filtered.map((p) => (
                <button
                  key={p.id}
                  onClick={() => addToCart(p)}
                  className="group flex flex-col items-start gap-1 surface-card-muted-compact p-3 text-left transition hover:border-primary hover:shadow-soft"
                >
                  <div className="flex h-16 w-full items-center justify-center rounded-lg bg-primary-soft text-primary">
                    <ShoppingCart className="h-6 w-6" />
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm font-medium text-foreground">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.sku}</p>
                  <div className="mt-auto flex w-full items-center justify-between pt-1">
                    <span className="font-mono text-sm font-semibold text-foreground">{formatCurrency(p.price, p.currency)}</span>
                    {p.stock === 0 ? <Badge variant="destructive">Out</Badge> : <span className="text-xs text-muted-foreground">{p.stock}</span>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Cart */}
        <aside className="flex flex-col surface-card">
          <header className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="font-display text-lg font-semibold">Cart ({totals.items})</h2>
            {cart.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearCart} className="gap-1 text-muted-foreground"><X className="h-4 w-4" /> Clear</Button>
            )}
          </header>

          <ScrollArea className="max-h-[360px] flex-1">
            <div className="px-5 py-3">
              {cart.length === 0 ? (
                <EmptyState icon={ShoppingCart} title="Cart is empty" description="Tap a product to add it." size="sm" />
              ) : (
                <ul className="space-y-2">
                  {cart.map((l) => (
                    <li key={l.productId} className="rounded-lg border border-border bg-card-muted p-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{l.name}</p>
                          <p className="font-mono text-xs text-muted-foreground">{formatCurrency(l.price)} ea.</p>
                        </div>
                        <button onClick={() => removeLine(l.productId)} className="text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="inline-flex items-center rounded-md border border-border">
                          <button onClick={() => updateQty(l.productId, -1)} className="px-2 py-1 hover:bg-muted"><Minus className="h-3 w-3" /></button>
                          <span className="min-w-[28px] px-2 text-center text-sm font-mono">{l.quantity}</span>
                          <button onClick={() => updateQty(l.productId, 1)} className="px-2 py-1 hover:bg-muted"><Plus className="h-3 w-3" /></button>
                        </div>
                        <span className="font-mono text-sm font-semibold">{formatCurrency(l.price * l.quantity)}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </ScrollArea>

          <div className="space-y-3 border-t border-border px-5 py-4 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-muted-foreground">Discount %</Label>
                <Input type="number" min={0} max={100} value={discountPct} onChange={(e) => setDiscountPct(Math.max(0, Math.min(100, Number(e.target.value) || 0)))} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Payment</Label>
                <Select value={payment} onValueChange={(v) => setPayment(v as PosPaymentMethod)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="wallet">Wallet</SelectItem>
                    <SelectItem value="voucher">Voucher</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Customer (optional)</Label>
              <Select value={customerId || "guest"} onValueChange={(v) => setCustomerId(v === "guest" ? "" : v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="guest">Guest</SelectItem>
                  {customers.slice(0, 12).map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 border-t border-border pt-3 text-sm">
              <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span className="font-mono">{formatCurrency(totals.subtotal)}</span></div>
              {totals.discount > 0 && (
                <div className="flex justify-between text-success"><span>Discount ({formatPercent(discountPct, { decimals: 0, alreadyPercent: true })})</span><span className="font-mono">−{formatCurrency(totals.discount)}</span></div>
              )}
              <div className="flex justify-between text-muted-foreground"><span>Tax ({settings.taxRate}%)</span><span className="font-mono">{formatCurrency(totals.tax)}</span></div>
              <div className="flex justify-between border-t border-border pt-2 text-base font-semibold text-foreground"><span>Total</span><span className="font-mono">{formatCurrency(totals.total, settings.currency)}</span></div>
            </div>

            <Button onClick={completeSale} className="w-full" size="lg" disabled={cart.length === 0}>
              Complete sale
            </Button>
          </div>
        </aside>
      </div>
    </PageContainer>
  );
}