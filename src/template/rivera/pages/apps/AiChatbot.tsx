import { useEffect, useRef, useState } from "react";
import { Bot, RefreshCcw, Send, Sparkles, User } from "lucide-react";
import { DataCard, PageContainer, PageHeader } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { storage } from "@/lib/storage";
import { cn } from "@/lib/utils";

interface Msg { role: "user" | "bot"; content: string; ts: number }

const SUGGESTIONS = [
  "What can you do?",
  "Summarize my open projects",
  "Draft a follow-up email",
  "Generate three KPI ideas for Q2",
];

const RULES: { match: RegExp; reply: string }[] = [
  { match: /^(hi|hello|hey|yo|sup)\b/i,                        reply: "Hi there! 👋 I'm Rivera Assistant. Ask me about projects, tasks, invoices, or general productivity tips." },
  { match: /(what can you do|help|capabilit)/i,                reply: "I can:\n• Summarize project status\n• Draft emails and meeting agendas\n• Suggest KPIs and OKRs\n• Explain features in this dashboard\n\nThis is a frontend-only mock — no external AI is called." },
  { match: /summari[sz]e.*(project|portfolio)/i,               reply: "Across 6 projects you have 4 in flight, 1 on hold, and 1 completed. Atlas Rebrand is at 78% with milestone 2 awaiting sign-off, and Harbor App v2 is your largest engagement at $120k budget." },
  { match: /(email|follow[-\s]?up|reply)/i,                    reply: "Here's a draft you can adapt:\n\n\"Hi {{name}},\nThanks for the notes on the latest milestone. We've actioned the contrast and spacing tweaks and will share v2 by Thursday. Happy to jump on a quick call if helpful.\nBest,\n{{you}}\"" },
  { match: /(kpi|okr|metric|goal)/i,                           reply: "Three KPI ideas for Q2:\n1. On-time delivery rate ≥ 90%\n2. Billable utilization ≥ 75%\n3. NPS uplift +10 across active clients" },
  { match: /(invoice|billing|payment)/i,                       reply: "You have 1 overdue invoice (Northwind, $19,440) and 2 unpaid sent invoices totalling $38,880. Want me to draft a friendly reminder?" },
  { match: /(task|todo|kanban)/i,                              reply: "Open tasks: 8. The most urgent items: 'Harbor v2: shipment tracking API' (due in 8 days, urgent) and 'Atlas: production print proofs' (high priority)." },
  { match: /(meeting|calendar|schedule)/i,                     reply: "Your next scheduled meeting is the Atlas Rebrand sign-off. Try the Meetings page to add a new one — links are mocked." },
  { match: /(thank|thanks|cheers)/i,                           reply: "Anytime! Let me know if you'd like me to draft something else." },
  { match: /(joke|fun)/i,                                      reply: "Why did the project manager bring a ladder to the kickoff? Because the goals were aspirational. 🎯" },
];

function reply(prompt: string): string {
  for (const r of RULES) if (r.match.test(prompt)) return r.reply;
  return `I'm a mock assistant in this demo, so I can't reach a live model. But here are a few angles on "${prompt.slice(0, 80)}":\n\n• Break it down into the top three sub-questions.\n• Compare against last quarter's baseline.\n• Decide on a single owner before Friday.`;
}

const STORAGE_KEY = "apps:ai-chat";
const WELCOME: Msg = { role: "bot", content: "Hi! I'm Rivera Assistant, a frontend-only mock chatbot. Ask me anything about your workspace.", ts: Date.now() };

export default function AiChatbot() {
  const { trail } = useBreadcrumbs();
  const [messages, setMessages] = useState<Msg[]>(() => storage.get<Msg[]>(STORAGE_KEY, [WELCOME]));
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { storage.set(STORAGE_KEY, messages); }, [messages]);
  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages, typing]);

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const userMsg: Msg = { role: "user", content: trimmed, ts: Date.now() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      setMessages((m) => [...m, { role: "bot", content: reply(trimmed), ts: Date.now() }]);
      setTyping(false);
    }, 600 + Math.random() * 500);
  };

  const clear = () => setMessages([WELCOME]);

  return (
    <PageContainer width="narrow">
      <PageHeader
        eyebrow="Applications"
        title="AI Chatbot"
        description="A mock assistant — no external AI is contacted."
        breadcrumbs={trail}
        actions={
          <Button variant="outline" onClick={clear} className="gap-1.5">
            <RefreshCcw className="h-3.5 w-3.5" /> New chat
          </Button>
        }
      />

      <DataCard flush bodyClassName="flex flex-col">
        <div ref={scrollRef} className="max-h-[60vh] flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={cn("flex items-start gap-3", m.role === "user" && "flex-row-reverse")}>
              <div className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                m.role === "bot" ? "bg-primary-soft text-primary" : "bg-accent-soft text-accent",
              )}>
                {m.role === "bot" ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
              </div>
              <div className={cn(
                "max-w-[80%] rounded-xl px-4 py-2.5 text-sm whitespace-pre-wrap leading-relaxed",
                m.role === "bot" ? "bg-muted text-foreground rounded-tl-sm" : "bg-primary text-primary-foreground rounded-tr-sm",
              )}>
                {m.content}
              </div>
            </div>
          ))}
          {typing && (
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-soft text-primary"><Bot className="h-4 w-4" /></div>
              <div className="rounded-xl rounded-tl-sm bg-muted px-4 py-3">
                <div className="flex gap-1">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "0ms" }} />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "150ms" }} />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {messages.length <= 1 && (
          <div className="flex flex-wrap gap-2 border-t border-border px-5 py-3">
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => send(s)}
                className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs transition hover:border-primary hover:text-primary">
                <Sparkles className="h-3 w-3" /> {s}
              </button>
            ))}
          </div>
        )}

        <div className="border-t border-border p-3">
          <div className="flex items-end gap-2">
            <Textarea
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
              placeholder="Ask anything…"
              className="max-h-32 min-h-[40px] resize-none"
            />
            <Button onClick={() => send(input)} disabled={!input.trim() || typing} className="gap-1.5">
              <Send className="h-3.5 w-3.5" /> Send
            </Button>
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground">Mock responses only — no external AI APIs are called.</p>
        </div>
      </DataCard>
    </PageContainer>
  );
}