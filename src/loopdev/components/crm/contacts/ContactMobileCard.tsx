import { Building2, Calendar, Mail, MapPin, MoreHorizontal, Pencil, Phone, Archive, Eye } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate, getInitials } from "@/lib/formatters";
import { contactName, type CRMContact } from "@/loopdev/domains/crm/adapter";

interface ContactMobileCardProps {
  contact: CRMContact;
  index: number;
  onOpen: () => void;
  onEdit: () => void;
  onArchive: () => void;
}

export function ContactMobileCard({
  contact,
  index,
  onOpen,
  onEdit,
  onArchive,
}: ContactMobileCardProps) {
  const name = contactName(contact);

  return (
    <article
      className="surface-card-interactive p-4"
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen();
        }
      }}
      role="link"
      tabIndex={0}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar className="h-11 w-11 shrink-0 border border-border">
            <AvatarFallback className="bg-primary-soft text-xs font-semibold text-primary">
              {getInitials(name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">{name}</p>
            <p className="text-xs text-muted-foreground">#{index}</p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 shrink-0"
              aria-label={`Actions for ${name}`}
              onClick={(event) => event.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={(event) => { event.stopPropagation(); onOpen(); }}>
              <Eye className="mr-2 h-3.5 w-3.5" />
              View Customer 360
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(event) => { event.stopPropagation(); onEdit(); }}>
              <Pencil className="mr-2 h-3.5 w-3.5" />
              Edit contact
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={(event) => { event.stopPropagation(); onArchive(); }}
            >
              <Archive className="mr-2 h-3.5 w-3.5" />
              Archive contact
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mt-4 grid gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
        <ContactDetail icon={Mail} value={contact.email} />
        <ContactDetail icon={Phone} value={contact.phone} />
        <ContactDetail
          icon={Building2}
          value={[contact.companyName, contact.jobTitle].filter(Boolean).join(" · ")}
        />
        <ContactDetail
          icon={MapPin}
          value={[contact.city, contact.stateProvince, contact.country].filter(Boolean).join(", ")}
        />
        <ContactDetail icon={Calendar} value={`Updated ${formatDate(contact.updatedAt)}`} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-3">
        <StatusBadge tone={contact.identityStatus === "verified" ? "success" : "warning"} dot>
          {contact.identityStatus === "verified" ? "Verified" : "Pending review"}
        </StatusBadge>
        {contact.preferredChannel && (
          <span className="rounded-full bg-card-muted px-2 py-1 text-[11px] capitalize text-muted-foreground">
            {contact.preferredChannel}
          </span>
        )}
      </div>
    </article>
  );
}

function ContactDetail({
  icon: Icon,
  value,
}: {
  icon: typeof Mail;
  value: string | null | undefined;
}) {
  return (
    <p className="flex min-w-0 items-center gap-2">
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">{value || "—"}</span>
    </p>
  );
}
