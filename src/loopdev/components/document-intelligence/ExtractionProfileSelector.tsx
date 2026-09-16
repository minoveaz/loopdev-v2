import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  EXPORT_PROFILES,
  type ExportProfileId,
} from "@/loopdev/domains/document-intelligence";

interface ExtractionProfileSelectorProps {
  value: ExportProfileId;
  onChange: (id: ExportProfileId) => void;
  compact?: boolean;
}

export function ExtractionProfileSelector({
  value,
  onChange,
  compact = false,
}: ExtractionProfileSelectorProps) {
  const currentProfile = EXPORT_PROFILES.find((p) => p.id === value) ?? EXPORT_PROFILES[0];

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label
          htmlFor="profile-selector"
          className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
        >
          Formato de datos
        </label>
        {!compact && (
          <span className="text-[11px] text-muted-foreground">
            3 opciones de organización
          </span>
        )}
      </div>

      <Select value={value} onValueChange={(val) => onChange(val as ExportProfileId)}>
        <SelectTrigger id="profile-selector" className="w-full bg-background">
          <SelectValue placeholder="Selecciona formato" />
        </SelectTrigger>
        <SelectContent>
          {EXPORT_PROFILES.map((profile) => (
            <SelectItem key={profile.id} value={profile.id}>
              <span className="font-medium text-foreground">{profile.label}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
