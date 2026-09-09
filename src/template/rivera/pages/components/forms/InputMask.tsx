import { useState } from "react";
import { PageContainer, PageHeader } from "@/components/common";
import { Showcase } from "@/template/rivera/features/ui-kit/Showcase";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function mask(value: string, pattern: string) {
  const v = value.replace(/\D/g, "");
  let out = "", vi = 0;
  for (const ch of pattern) {
    if (vi >= v.length) break;
    if (ch === "#") { out += v[vi++]; } else { out += ch; }
  }
  return out;
}

export default function InputMaskPage() {
  const [phone, setPhone] = useState("");
  const [card, setCard] = useState("");
  const [date, setDate] = useState("");
  return (
    <PageContainer width="narrow">
      <PageHeader eyebrow="Components" title="Input Mask" description="Lightweight masked inputs (mock implementation)." />
      <Showcase title="Examples" hint="mask">
        <div className="space-y-4">
          <div className="space-y-1.5"><Label>Phone (US)</Label><Input value={phone} onChange={(e) => setPhone(mask(e.target.value, "(###) ###-####"))} placeholder="(555) 123-4567" /></div>
          <div className="space-y-1.5"><Label>Credit card</Label><Input value={card} onChange={(e) => setCard(mask(e.target.value, "#### #### #### ####"))} placeholder="1234 5678 9012 3456" /></div>
          <div className="space-y-1.5"><Label>Date</Label><Input value={date} onChange={(e) => setDate(mask(e.target.value, "##/##/####"))} placeholder="MM/DD/YYYY" /></div>
        </div>
      </Showcase>
    </PageContainer>
  );
}