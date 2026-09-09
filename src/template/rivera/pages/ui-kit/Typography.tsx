import { CodeBlock, InlineCode, Kbd, PageContainer, PageHeader, Samp } from "@/components/common";
import { Showcase } from "@/template/rivera/features/ui-kit/Showcase";
import { ContrastStrip } from "@/template/rivera/features/ui-kit/ContrastStrip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";
import { Moon, Sun } from "lucide-react";

const sampleRows = [
  { id: "TXN-00481", method: "card_visa", amount: "$1,240.00", latency: "128ms", status: "ok" },
  { id: "TXN-00482", method: "card_amex", amount: "$3,902.45", latency: "212ms", status: "retry" },
  { id: "TXN-00483", method: "ach_debit", amount: "$540.00", latency: "94ms", status: "ok" },
  { id: "TXN-00484", method: "wallet_pay", amount: "$28.10", latency: "73ms", status: "ok" },
];

const codeBlock = `// fetchOrders.ts
export async function fetchOrders(limit = 25) {
  const res = await fetch(\`/api/orders?limit=\${limit}\`, {
    headers: { "X-Trace-Id": crypto.randomUUID() },
  });
  if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
  return res.json() as Promise<Order[]>;
}`;

function TypographyPanel() {
  return (
    <div className="space-y-6">
      <Showcase title="Inline code" description="<InlineCode> — flows with body, headings, and lists." hint="inline">
        <p className="text-sm text-muted-foreground">
          Run <InlineCode>npm install</InlineCode> then call <InlineCode>fetchOrders()</InlineCode> with an optional{" "}
          <InlineCode>limit</InlineCode> argument. Wrap async work in <InlineCode>try / catch</InlineCode> and log via{" "}
          <InlineCode>console.warn</InlineCode>.
        </p>
        <h3>Heading with <InlineCode>Geist Mono</InlineCode> token</h3>
        <ul className="list-inside list-disc text-sm text-muted-foreground">
          <li>Const <InlineCode>MAX_RETRIES = 3</InlineCode></li>
          <li>Env var <InlineCode>VITE_API_URL</InlineCode></li>
          <li>Header <InlineCode>X-Trace-Id</InlineCode></li>
        </ul>
        <p className="text-sm text-muted-foreground">
          Sample output: <Samp>200 OK · 128ms</Samp>
        </p>
      </Showcase>

      <Showcase title="Weight ramp" description="Geist weights 400 → 700 across body and display sizes." hint="weights">
        <div className="space-y-1.5">
          {[
            { w: "font-normal",    label: "Regular 400" },
            { w: "font-medium",    label: "Medium 500" },
            { w: "font-semibold",  label: "Semibold 600" },
            { w: "font-bold",      label: "Bold 700" },
          ].map((r) => (
            <div key={r.w} className="flex items-baseline justify-between gap-4 border-b border-border/60 pb-1.5 last:border-0">
              <span className={`${r.w} text-base text-foreground`}>The quick brown fox jumps 0123</span>
              <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{r.label}</span>
            </div>
          ))}
        </div>
        <div className="space-y-1 pt-2">
          <p className="font-display text-3xl font-bold text-foreground">Display · Bold</p>
          <p className="font-display text-2xl font-semibold text-foreground">Display · Semibold</p>
          <p className="text-lg font-medium text-foreground">Body large · Medium</p>
          <p className="text-base text-foreground">Body · Regular — quick brown fox jumps over the lazy dog.</p>
          <p className="text-sm text-muted-foreground">Small · Muted — supporting copy and helper text.</p>
          <p className="text-xs text-muted-foreground">Caption · 12px — metadata and footnotes.</p>
        </div>
      </Showcase>

      <Showcase title="Emphasis & inline elements" description="Bold, italic, underline, strike, mark, and small." hint="inline">
        <p className="text-sm text-foreground">
          A paragraph with <strong className="font-semibold">strong emphasis</strong>, <em>italic accent</em>,{" "}
          <u className="decoration-border-strong underline-offset-4">underlined</u> phrasing,{" "}
          <s className="text-muted-foreground">struck-through</s> changes, and a{" "}
          <mark className="rounded bg-warning-soft px-1 text-warning-foreground">highlighted span</mark>{" "}
          to verify Geist letterforms behave consistently.
        </p>
        <p className="text-sm text-muted-foreground">
          Followed by <small>small print at 0.8125rem</small> for legal copy or hints.
        </p>
      </Showcase>

      <Showcase title="Links" description="Default, hovered, visited, and inline within prose." hint="links">
        <p className="text-sm text-foreground">
          Read the{" "}
          <a href="#docs" className="font-medium text-primary underline decoration-primary/30 underline-offset-4 transition-fast hover:decoration-primary">
            full documentation
          </a>{" "}
          or jump to{" "}
          <a href="#api" className="text-primary hover:underline">API reference</a>. You can also{" "}
          <a href="#contact" className="text-foreground underline decoration-border-strong underline-offset-4 hover:text-primary hover:decoration-primary">
            contact support
          </a>{" "}
          for help.
        </p>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <a href="#a" className="text-primary hover:underline">Default link</a>
          <a href="#b" className="text-primary underline underline-offset-4">Underlined</a>
          <a href="#c" className="text-muted-foreground hover:text-foreground">Subtle link</a>
          <a href="#d" aria-disabled className="pointer-events-none text-muted-foreground/60 line-through">Disabled</a>
        </div>
      </Showcase>

      <Showcase title="Muted hierarchy" description="Foreground · muted-foreground · disabled — verify legibility." hint="muted">
        <div className="space-y-1.5">
          <p className="text-base text-foreground">Foreground — primary reading text.</p>
          <p className="text-base text-muted-foreground">Muted foreground — secondary copy and metadata.</p>
          <p className="text-base text-muted-foreground/70">Muted /70 — tertiary, low-emphasis labels.</p>
          <p className="text-base text-muted-foreground/50">Muted /50 — disabled or placeholder state.</p>
          <blockquote className="border-l-2 border-primary/40 pl-3 text-sm italic text-muted-foreground">
            "Typography is what language looks like." — quoted block uses muted foreground with a primary accent rule.
          </blockquote>
        </div>
      </Showcase>

      <Showcase title="Code block" description="<CodeBlock> — Geist Mono 13px / 1.6, syntax highlighting via Prism." hint="block">
        <div className="space-y-3">
          <CodeBlock language="ts">{codeBlock}</CodeBlock>
          <CodeBlock language="json">{`{
  "name": "rivera",
  "version": "1.0.0",
  "private": true,
  "scripts": { "dev": "vite", "build": "vite build" }
}`}</CodeBlock>
          <CodeBlock language="bash">{`# Install & run
bun install
bun run dev --host 0.0.0.0`}</CodeBlock>
        </div>
      </Showcase>

      <Showcase title="Keyboard hints" description="<Kbd> pill — Geist Mono, inset border for tactile feel." hint="kbd">
        <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          Open the command menu with <Kbd>⌘</Kbd> <Kbd>K</Kbd>, switch theme with <Kbd>⌘</Kbd> <Kbd>⇧</Kbd> <Kbd>L</Kbd>,
          and submit forms via <Kbd>Enter</Kbd>.
        </p>
      </Showcase>

      <Showcase title="Table — mono identifiers & figures" description="font-mono cells get tabular-nums automatically." hint="table">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Transaction</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Latency</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sampleRows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-mono text-xs">{r.id}</TableCell>
                <TableCell><InlineCode>{r.method}</InlineCode></TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{r.latency}</TableCell>
                <TableCell>
                  <Badge variant={r.status === "ok" ? "secondary" : "outline"}>{r.status}</Badge>
                </TableCell>
                <TableCell className="text-right font-mono">{r.amount}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Showcase>

      <Showcase title="Accessibility" description="Runtime WCAG 2.1 contrast for code, table, and badge swatches in this theme." hint="a11y">
        <ContrastStrip />
      </Showcase>
    </div>
  );
}

export default function TypographyPage() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <PageContainer width="default">
      <PageHeader
        eyebrow="UI Kit"
        title="Typography — Geist & Geist Mono"
        description="Verify monospace consistency across inline code, code blocks, kbd, and tables in both themes."
        actions={
          <Button variant="outline" size="sm" onClick={() => setTheme(isDark ? "light" : "dark")}>
            {isDark ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
            Toggle current theme
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Light preview — forced light regardless of app theme */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            <Sun className="h-3.5 w-3.5" /> Light mode preview
          </div>
          <div className="light rounded-xl border border-border bg-background p-4 text-foreground">
            <TypographyPanel />
          </div>
        </section>

        {/* Dark preview — forced dark regardless of app theme */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            <Moon className="h-3.5 w-3.5" /> Dark mode preview
          </div>
          <div className="dark rounded-xl border border-border bg-background p-4 text-foreground">
            <TypographyPanel />
          </div>
        </section>
      </div>
    </PageContainer>
  );
}