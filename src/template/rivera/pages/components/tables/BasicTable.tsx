import { PageContainer, PageHeader } from "@/components/common";
import { Showcase } from "@/template/rivera/features/ui-kit/Showcase";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const rows = [
  { id: "INV-001", name: "Ava Reyes", status: "Paid", amount: "$1,200" },
  { id: "INV-002", name: "Ben Tan", status: "Pending", amount: "$840" },
  { id: "INV-003", name: "Cleo Lin", status: "Overdue", amount: "$540" },
  { id: "INV-004", name: "Dax Mira", status: "Paid", amount: "$2,300" },
];

export default function BasicTablePage() {
  return (
    <PageContainer width="default">
      <PageHeader eyebrow="Components" title="Basic Table" description="Simple tabular data using shadcn Table primitives." />
      <Showcase title="Invoices" hint="table">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice</TableHead><TableHead>Customer</TableHead>
              <TableHead>Status</TableHead><TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-mono text-xs">{r.id}</TableCell>
                <TableCell>{r.name}</TableCell>
                <TableCell>
                  <Badge variant={r.status === "Paid" ? "secondary" : r.status === "Overdue" ? "destructive" : "outline"}>{r.status}</Badge>
                </TableCell>
                <TableCell className="text-right">{r.amount}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Showcase>
    </PageContainer>
  );
}