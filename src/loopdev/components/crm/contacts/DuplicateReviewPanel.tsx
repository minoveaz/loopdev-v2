import { useState } from "react";
import { Button } from "@/components/ui/button";
import { contactPort, type CRMContact, type CRMPotentialDuplicate } from "@/loopdev/domains/crm/adapter";

export function DuplicateReviewPanel({ contact, onClose }: { contact: CRMContact; onClose: () => void }) {
  const [candidates, setCandidates] = useState<CRMPotentialDuplicate[] | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const load = () => void contactPort.findPotentialDuplicates(contact.id).then(setCandidates);
  if (!candidates) return <div className="rounded-lg border bg-card p-4"><p className="font-semibold">Duplicate review</p><p className="text-sm text-muted-foreground">Candidates are read from the shared contact port.</p><div className="mt-3 flex gap-2"><Button onClick={load}>Find candidates</Button><Button variant="outline" onClick={onClose}>Close</Button></div></div>;
  return <div className="rounded-lg border bg-card p-4"><p className="font-semibold">Duplicate review for {contact.firstName} {contact.lastName}</p>{message && <p role="status" className="mt-2 text-sm">{message}</p>}{candidates.length ? candidates.map(({ contact: candidate, score, reasons }) => <div key={candidate.id} className="mt-3 flex items-center justify-between rounded border p-3"><div><p className="font-medium">{candidate.firstName} {candidate.lastName}</p><p className="text-sm text-muted-foreground">Score {score} · {reasons.join(", ")}</p><p className="text-xs text-amber-700">Merge not allowed</p></div><Button variant="outline" onClick={() => { if (!window.confirm("Confirm dismissal? This will be recorded in the duplicate-review audit trail.")) return; void contactPort.dismissDuplicateReview(contact.id, candidate.id, "DISMISS_DUPLICATE_REVIEW").then((result) => { setMessage(result.status === "success" ? "Dismissed and recorded." : result.message); return contactPort.findPotentialDuplicates(contact.id); }).then(setCandidates); }}>Dismiss review</Button></div>) : <p className="mt-3 text-sm text-muted-foreground">No potential duplicates found.</p>}<Button className="mt-3" variant="outline" onClick={onClose}>Close</Button></div>;
}
