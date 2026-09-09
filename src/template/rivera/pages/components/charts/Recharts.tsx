import { PageContainer, PageHeader } from "@/components/common";
import { Showcase } from "@/template/rivera/features/ui-kit/Showcase";
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

const data = Array.from({ length: 8 }, (_, i) => ({ name: `W${i + 1}`, a: 30 + Math.round(Math.random() * 60), b: 20 + Math.round(Math.random() * 40) }));
const pie = [{ name: "Direct", v: 40 }, { name: "Search", v: 30 }, { name: "Social", v: 20 }, { name: "Email", v: 10 }];
const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--muted-foreground))", "hsl(var(--secondary))"];

export default function RechartsPage() {
  return (
    <PageContainer width="default">
      <PageHeader eyebrow="Components" title="Recharts" description="Composable charts using the Recharts library." />
      <div className="grid gap-6 md:grid-cols-2">
        <Showcase title="Area" hint="AreaChart">
          <div className="h-64"><ResponsiveContainer><AreaChart data={data}><CartesianGrid strokeDasharray="4 4" opacity={0.2} /><XAxis dataKey="name" fontSize={11} /><YAxis fontSize={11} /><Tooltip /><Area dataKey="a" stroke="hsl(var(--primary))" fill="hsl(var(--primary)/0.3)" /></AreaChart></ResponsiveContainer></div>
        </Showcase>
        <Showcase title="Bar" hint="BarChart">
          <div className="h-64"><ResponsiveContainer><BarChart data={data}><CartesianGrid strokeDasharray="4 4" opacity={0.2} /><XAxis dataKey="name" fontSize={11} /><YAxis fontSize={11} /><Tooltip /><Bar dataKey="b" fill="hsl(var(--accent))" radius={4} /></BarChart></ResponsiveContainer></div>
        </Showcase>
        <Showcase title="Line" hint="LineChart">
          <div className="h-64"><ResponsiveContainer><LineChart data={data}><CartesianGrid strokeDasharray="4 4" opacity={0.2} /><XAxis dataKey="name" fontSize={11} /><YAxis fontSize={11} /><Tooltip /><Line dataKey="a" stroke="hsl(var(--primary))" /><Line dataKey="b" stroke="hsl(var(--accent))" /></LineChart></ResponsiveContainer></div>
        </Showcase>
        <Showcase title="Pie" hint="PieChart">
          <div className="h-64"><ResponsiveContainer><PieChart><Pie data={pie} dataKey="v" innerRadius={50} outerRadius={80}>{pie.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div>
        </Showcase>
      </div>
    </PageContainer>
  );
}