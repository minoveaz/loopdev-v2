import { useState } from "react";
import {
  Activity,
  CheckCircle2,
  CircleDashed,
  GitBranch,
  Search,
  Terminal,
  Webhook,
  XCircle,
} from "lucide-react";
import { CodeBlock, DataCard, InlineCode, Kbd, MonoCell, PageContainer, PageHeader, Samp, StatCard, StatusBadge } from "@/components/common";
import { Showcase } from "@/template/rivera/features/ui-kit/Showcase";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const apiSnippet = `import { rivera } from "@rivera/sdk";

const client = rivera({ apiKey: process.env.RIVERA_API_KEY });

export async function listOrders() {
  const { data, error } = await client.orders.list({ limit: 25 });
  if (error) throw error;
  return data;
}`;

const webhookPayload = `{
  "id": "evt_01HZ8K6X4M",
  "type": "order.paid",
  "created": 1735822010,
  "data": {
    "object": "order",
    "id": "ORD-30418",
    "amount": 1240,
    "currency": "usd",
    "customer": "cus_NeQ4mF"
  }
}`;

const curlSnippet = `curl https://api.rivera.dev/v1/orders \\
  -H "Authorization: Bearer $RIVERA_API_KEY" \\
  -H "X-Trace-Id: $(uuidgen)" \\
  -G --data-urlencode "limit=25"`;

const deploys = [
  { id: "dpl_8x21f", branch: "main",        sha: "9c1f4ae", status: "success", duration: "1m 42s" },
  { id: "dpl_8x217", branch: "feat/auth",   sha: "b03d12c", status: "running", duration: "—" },
  { id: "dpl_8x205", branch: "fix/billing", sha: "47ee0a8", status: "failed",  duration: "0m 51s" },
  { id: "dpl_8x1zk", branch: "main",        sha: "1ad99c2", status: "success", duration: "1m 39s" },
];

const statusIcon = {
  success: <CheckCircle2 className="h-3.5 w-3.5 text-success" />,
  running: <CircleDashed className="h-3.5 w-3.5 animate-spin text-info" />,
  failed:  <XCircle className="h-3.5 w-3.5 text-destructive" />,
};

const statusTone = {
  success: "success" as const,
  running: "info" as const,
  failed: "destructive" as const,
};

export default function MonoExamplesPage() {
  const [query, setQuery] = useState("");

  return (
    <PageContainer width="default">
      <PageHeader
        eyebrow="UI Kit"
        title="Mono components in context"
        description="InlineCode, CodeBlock, Kbd, and Samp shown in realistic dashboard surfaces — API panels, deploy logs, search affordances, and status feeds."
      />

      {/* ───── Top stat row — IDs and shortcuts as mono ───── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Project"     value="rivera-prod" hint="proj_8x21f" />
        <StatCard label="Environment" value="production"  hint="RIVERA_ENV=prod" />
        <StatCard label="Region"      value="iad1"        hint="us-east-1" />
        <StatCard label="Last deploy" value="1m ago"      hint="9c1f4ae" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ───── API quickstart ───── */}
        <Showcase
          title="API quickstart"
          description="CodeBlock + language chip + copy action."
          hint="codeblock"
          className="lg:col-span-2"
        >
          <p className="text-sm text-muted-foreground">
            Install the SDK with <InlineCode>bun add @rivera/sdk</InlineCode> and configure{" "}
            <InlineCode>RIVERA_API_KEY</InlineCode> in your environment. Then call{" "}
            <InlineCode>listOrders()</InlineCode> from any server route.
          </p>
          <CodeBlock language="ts">{apiSnippet}</CodeBlock>
          <p className="text-xs text-muted-foreground">
            Expected response: <Samp>200 OK · 128ms</Samp>
          </p>
        </Showcase>

        {/* ───── Keyboard shortcuts ───── */}
        <Showcase title="Keyboard shortcuts" description="Kbd pills inside a list." hint="kbd">
          <ul className="divide-y divide-border text-sm">
            {[
              { label: "Open command menu", keys: ["⌘", "K"] },
              { label: "Toggle theme",      keys: ["⌘", "⇧", "L"] },
              { label: "New order",         keys: ["⌘", "N"] },
              { label: "Search docs",       keys: ["/"] },
              { label: "Submit",            keys: ["↵"] },
            ].map((s) => (
              <li key={s.label} className="flex items-center justify-between py-2">
                <span className="text-foreground">{s.label}</span>
                <span className="flex items-center gap-1">
                  {s.keys.map((k) => <Kbd key={k}>{k}</Kbd>)}
                </span>
              </li>
            ))}
          </ul>
        </Showcase>

        {/* ───── Search bar with kbd hint ───── */}
        <Showcase title="Search affordance" description="Inline Kbd inside an input field." hint="search" className="lg:col-span-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search orders, customers, invoices…"
              className="pl-9 pr-16"
            />
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
              <Kbd>⌘</Kbd> <Kbd>K</Kbd>
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Try filters like <InlineCode>status:paid</InlineCode>, <InlineCode>amount:&gt;1000</InlineCode>,
            or <InlineCode>created:7d</InlineCode>.
          </p>
        </Showcase>

        {/* ───── Webhook payload ───── */}
        <Showcase title="Webhook payload" description="JSON CodeBlock — copy & test endpoints." hint="json">
          <div className="flex items-center gap-2 text-sm">
            <Webhook className="h-4 w-4 text-muted-foreground" />
            <InlineCode>POST</InlineCode>
            <InlineCode>/webhooks/rivera</InlineCode>
          </div>
          <CodeBlock language="json">{webhookPayload}</CodeBlock>
        </Showcase>

        {/* ───── Deploys table ───── */}
        <Showcase title="Recent deploys" description="Mono identifiers + status badges in a table." hint="table" className="lg:col-span-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Deploy</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Commit</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Duration</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deploys.map((d) => (
                <TableRow key={d.id}>
                  <MonoCell kind="id" value={d.id} />
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5">
                      <GitBranch className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-mono text-xs text-foreground">{d.branch}</span>
                    </span>
                  </TableCell>
                  <MonoCell kind="code" value={d.sha} />
                  <MonoCell kind="status" value={d.status} tone={statusTone[d.status as keyof typeof statusTone]} />
                  <TableCell className="text-right font-mono text-xs text-muted-foreground">{d.duration}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Showcase>

        {/* ───── HTTP request log — uses MonoCell across the board ───── */}
        <Showcase title="HTTP request log" description="<MonoCell> for method, path, and status — auto-toned." hint="MonoCell" className="lg:col-span-3">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Path</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Trace</TableHead>
                <TableHead className="text-right">Latency</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                { t: "10:42:18", m: "GET",    p: "/v1/orders",         s: 200, id: "req_8x21fA", l: "128ms" },
                { t: "10:42:19", m: "POST",   p: "/v1/orders",         s: 201, id: "req_8x21fB", l: "212ms" },
                { t: "10:42:21", m: "PATCH",  p: "/v1/orders/30418",   s: 200, id: "req_8x21fC", l: "94ms"  },
                { t: "10:42:25", m: "DELETE", p: "/v1/customers/1029", s: 404, id: "req_8x21fD", l: "31ms"  },
                { t: "10:42:31", m: "POST",   p: "/v1/charges",        s: 502, id: "req_8x21fE", l: "1.2s"  },
              ].map((r, i) => (
                <TableRow key={i}>
                  <TableCell className="font-mono text-xs text-muted-foreground">{r.t}</TableCell>
                  <MonoCell kind="method" value={r.m} />
                  <MonoCell kind="code"   value={r.p} />
                  <MonoCell kind="status" value={r.s} />
                  <MonoCell kind="id"     value={r.id} />
                  <TableCell className="text-right font-mono text-xs">{r.l}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Showcase>

        {/* ───── Terminal log — Samp output ───── */}
        <Showcase title="Terminal output" description="Samp sample output paired with shell commands." hint="samp">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Terminal className="h-3.5 w-3.5" /> shell · zsh
          </div>
          <CodeBlock language="bash">{curlSnippet}</CodeBlock>
          <DataCard flush borderless className="border border-border bg-card-muted">
            <div className="space-y-1 p-3 text-xs">
              <div><Samp>HTTP/2 200</Samp></div>
              <div><Samp>content-type: application/json</Samp></div>
              <div><Samp>x-request-id: req_8x21fA</Samp></div>
              <div><Samp>x-ratelimit-remaining: 4998</Samp></div>
            </div>
          </DataCard>
        </Showcase>

        {/* ───── Activity feed ───── */}
        <Showcase title="Activity feed" description="Mono fragments inside human-readable copy." hint="feed" className="lg:col-span-2">
          <ul className="space-y-3 text-sm">
            {[
              <>Ada deployed <InlineCode>9c1f4ae</InlineCode> to <Badge variant="secondary">production</Badge> · <Samp>1m 42s</Samp></>,
              <>Ben opened PR <InlineCode>#482</InlineCode> on <InlineCode>feat/auth</InlineCode> — adds <InlineCode>useSession()</InlineCode> hook</>,
              <>Webhook <InlineCode>order.paid</InlineCode> failed for <InlineCode>ORD-30415</InlineCode> · retry in <Kbd>30s</Kbd></>,
              <>Cleo rotated <InlineCode>RIVERA_API_KEY</InlineCode> · <Samp>OK</Samp></>,
            ].map((row, i) => (
              <li key={i} className="flex items-start gap-3">
                <Activity className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <p className="text-muted-foreground [&>code]:mx-0.5">{row}</p>
              </li>
            ))}
          </ul>
          <Separator />
          <p className="text-xs text-muted-foreground">
            Filter with <Kbd>F</Kbd> · jump to next item with <Kbd>J</Kbd> / <Kbd>K</Kbd>.
          </p>
        </Showcase>
      </div>
    </PageContainer>
  );
}