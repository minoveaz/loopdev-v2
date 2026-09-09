import { ArrowUpRight, BarChart3, FolderKanban, Users } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DataCard, PageContainer, PageHeader, StatCard, StatusBadge } from "@/components/common";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { Showcase } from "@/template/rivera/features/ui-kit/Showcase";
import { formatCurrency } from "@/lib/formatters";

export default function CardsPage() {
  const { trail } = useBreadcrumbs();

  return (
    <PageContainer width="default">
      <PageHeader
        eyebrow="UI Kit"
        title="Cards"
        description="Container surfaces — KPI tiles, data cards, and content cards."
        breadcrumbs={trail.length ? trail : [{ label: "UI Kit" }, { label: "Cards" }]}
      />

      <div className="space-y-6">
        <Showcase title="Stat cards" description="Compact KPI tiles with trend indicators" hint="StatCard">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Revenue" value={formatCurrency(284500, "USD", { compact: true })} delta={8.2} hint="vs. last month" icon={BarChart3} accent="primary" />
            <StatCard label="Active users" value="12,480" delta={3.1} hint="this week" icon={Users} accent="info" />
            <StatCard label="Projects" value="38" delta={-1.4} invertTrend hint="active" icon={FolderKanban} accent="gold" />
            <StatCard label="Conversion" value="3.4%" delta={0.6} hint="all channels" icon={ArrowUpRight} accent="success" />
          </div>
        </Showcase>

        <Showcase title="Data cards" description="Header + body surface used across dashboards" hint="DataCard">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <DataCard title="Recent orders" description="Last 24 hours" action={<Button variant="ghost" size="sm">View all</Button>}>
              <ul className="space-y-3 text-sm">
                {[
                  { name: "Aurora Studio", amount: 1240, status: "paid" as const },
                  { name: "Northwind Co.", amount: 890, status: "pending" as const },
                  { name: "Atlas Rebrand", amount: 3120, status: "paid" as const },
                ].map((o) => (
                  <li key={o.name} className="flex items-center justify-between">
                    <span className="text-foreground">{o.name}</span>
                    <span className="flex items-center gap-3">
                      <span className="font-mono tabular-nums text-muted-foreground">{formatCurrency(o.amount)}</span>
                      <StatusBadge tone={o.status === "paid" ? "success" : "warning"} dot>{o.status}</StatusBadge>
                    </span>
                  </li>
                ))}
              </ul>
            </DataCard>

            <DataCard title="Project progress" description="Atlas Rebrand">
              <div className="space-y-4">
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Discovery</span>
                    <span className="font-mono text-foreground">100%</span>
                  </div>
                  <Progress value={100} />
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Design</span>
                    <span className="font-mono text-foreground">68%</span>
                  </div>
                  <Progress value={68} />
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Build</span>
                    <span className="font-mono text-foreground">22%</span>
                  </div>
                  <Progress value={22} />
                </div>
              </div>
            </DataCard>
          </div>
        </Showcase>

        <Showcase title="Content cards" description="Marketing-style surfaces using shadcn Card primitives" hint="Card">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Starter</CardTitle>
                <CardDescription>For small teams getting started.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="font-display text-3xl font-semibold tracking-tight">$19<span className="text-base font-normal text-muted-foreground">/mo</span></p>
                <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <li>5 projects</li>
                  <li>Basic analytics</li>
                  <li>Email support</li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">Choose plan</Button>
              </CardFooter>
            </Card>

            <Card className="border-primary/50 shadow-elegant">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Studio</CardTitle>
                  <StatusBadge tone="primary">Popular</StatusBadge>
                </div>
                <CardDescription>For growing product teams.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="font-display text-3xl font-semibold tracking-tight">$49<span className="text-base font-normal text-muted-foreground">/mo</span></p>
                <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <li>Unlimited projects</li>
                  <li>Advanced analytics</li>
                  <li>Priority support</li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full">Choose plan</Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Enterprise</CardTitle>
                <CardDescription>Tailored for scale & compliance.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="font-display text-3xl font-semibold tracking-tight">Custom</p>
                <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <li>Dedicated workspace</li>
                  <li>SAML SSO</li>
                  <li>SLA + onboarding</li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">Talk to sales</Button>
              </CardFooter>
            </Card>
          </div>
        </Showcase>

        <Showcase title="Profile card" description="Avatar + meta surface" hint="composition">
          <div className="flex flex-col items-start gap-4 surface-card-muted p-5 sm:flex-row sm:items-center">
            <Avatar className="h-14 w-14 border border-border">
              <AvatarFallback className="bg-primary-soft text-primary">AH</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="font-display text-lg font-semibold text-foreground">Amelia Hart</h4>
                <StatusBadge tone="success" dot>Active</StatusBadge>
              </div>
              <p className="text-sm text-muted-foreground">Founder · amelia@rivera.app</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">Message</Button>
              <Button size="sm">View profile</Button>
            </div>
          </div>
        </Showcase>
      </div>
    </PageContainer>
  );
}