import { Briefcase, Mail, MapPin, Phone, Calendar } from "lucide-react";
import { DataCard } from "@/components/common";
import { UserProfileLayout } from "./_layout";

export default function UserProfileOverview() {
  return (
    <UserProfileLayout title="Overview" description="Personal details, bio, and recent stats.">
      <div className="grid gap-6 md:grid-cols-3">
        <DataCard title="About" className="md:col-span-2">
          <p className="text-sm text-muted-foreground">Designing thoughtful admin experiences at Rivera. Lead the design system, theming, and component library.</p>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2 text-sm">
            <div className="flex items-center gap-2"><Briefcase className="h-4 w-4 text-muted-foreground" /><span>Founder · Leadership</span></div>
            <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" /><span>Lisbon, Portugal</span></div>
            <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /><span>aria@rivera.app</span></div>
            <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /><span>+351 910 000 000</span></div>
            <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" /><span>Joined Mar 2024</span></div>
          </dl>
        </DataCard>
        <div className="space-y-4">
          {[
            { label: "Followers", value: 1248 },
            { label: "Following", value: 318 },
            { label: "Projects", value: 27 },
          ].map((s) => (
            <DataCard key={s.label} title={s.label}>
              <p className="font-display text-3xl font-semibold">{s.value.toLocaleString()}</p>
            </DataCard>
          ))}
        </div>
      </div>
    </UserProfileLayout>
  );
}