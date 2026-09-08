import { PageContainer, PageHeader } from "@/components/common";
import { Showcase, ShowcaseRow } from "@/features/ui-kit/Showcase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const people = [
  { name: "Ava Reyes", url: "https://i.pravatar.cc/100?img=1" },
  { name: "Ben Tan", url: "https://i.pravatar.cc/100?img=2" },
  { name: "Cleo Lin", url: "https://i.pravatar.cc/100?img=3" },
  { name: "Dax Mira", url: "https://i.pravatar.cc/100?img=4" },
];

export default function AvatarsPage() {
  return (
    <PageContainer width="default">
      <PageHeader eyebrow="Components" title="Avatars" description="Profile imagery with initials fallback." />
      <div className="grid gap-6 md:grid-cols-2">
        <Showcase title="Sizes" hint="className">
          <ShowcaseRow label="Sizes">
            {["h-8 w-8", "h-10 w-10", "h-12 w-12", "h-14 w-14", "h-16 w-16"].map((c) => (
              <Avatar key={c} className={c}>
                <AvatarImage src={people[0].url} />
                <AvatarFallback>AR</AvatarFallback>
              </Avatar>
            ))}
          </ShowcaseRow>
        </Showcase>
        <Showcase title="Group" hint="stack">
          <div className="flex -space-x-2">
            {people.map((p) => (
              <Avatar key={p.name} className="ring-2 ring-background">
                <AvatarImage src={p.url} />
                <AvatarFallback>{p.name.split(" ").map((n) => n[0]).join("")}</AvatarFallback>
              </Avatar>
            ))}
          </div>
        </Showcase>
      </div>
    </PageContainer>
  );
}