import { DataCard } from "@/components/common";
import { UserProfileLayout } from "./_layout";

const GRADIENTS = [
  "from-violet-500 via-fuchsia-500 to-rose-500",
  "from-sky-500 via-cyan-500 to-emerald-500",
  "from-amber-500 via-orange-500 to-rose-500",
  "from-emerald-500 via-teal-500 to-cyan-500",
  "from-pink-500 via-purple-500 to-indigo-500",
  "from-yellow-500 via-orange-500 to-red-500",
  "from-blue-500 via-indigo-500 to-violet-500",
  "from-lime-500 via-emerald-500 to-teal-500",
  "from-rose-500 via-red-500 to-orange-500",
  "from-fuchsia-500 via-pink-500 to-rose-500",
  "from-cyan-500 via-blue-500 to-indigo-500",
  "from-teal-500 via-emerald-500 to-green-500",
];

export default function UserProfileGallery() {
  return (
    <UserProfileLayout title="Gallery" description="Visual work and recent uploads.">
      <DataCard>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {GRADIENTS.map((g, i) => (
            <div key={i} className={`aspect-square rounded-xl bg-gradient-to-br ${g} relative overflow-hidden ring-1 ring-inset ring-border`}>
              <div className="absolute inset-x-0 bottom-0 bg-black/30 p-2 text-[11px] font-medium text-white backdrop-blur-sm">Frame {i + 1}</div>
            </div>
          ))}
        </div>
      </DataCard>
    </UserProfileLayout>
  );
}