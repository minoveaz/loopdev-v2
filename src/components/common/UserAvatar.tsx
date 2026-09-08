import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/formatters";

interface UserAvatarProps {
  name: string;
  email?: string;
  image?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  /** Show name/email beside the avatar. */
  withMeta?: boolean;
  /** Online status indicator. */
  status?: "online" | "away" | "offline";
  className?: string;
  metaClassName?: string;
}

const sizeMap = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-9 w-9 text-sm",
  lg: "h-11 w-11 text-base",
  xl: "h-14 w-14 text-lg",
};

const statusColor = {
  online: "bg-success",
  away: "bg-warning",
  offline: "bg-muted-foreground",
};

/** Standard avatar block used in tables, drawers, and headers. */
export function UserAvatar({
  name,
  email,
  image,
  size = "md",
  withMeta = false,
  status,
  className,
  metaClassName,
}: UserAvatarProps) {
  const avatar = (
    <span className={cn("relative inline-flex shrink-0", className)}>
      <Avatar className={cn(sizeMap[size], "ring-1 ring-border")}>
        {image && <AvatarImage src={image} alt={name} />}
        <AvatarFallback className="bg-gradient-primary font-semibold text-primary-foreground">
          {getInitials(name)}
        </AvatarFallback>
      </Avatar>
      {status && (
        <span
          aria-label={status}
          className={cn(
            "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-card",
            statusColor[status],
          )}
        />
      )}
    </span>
  );

  if (!withMeta) return avatar;

  return (
    <div className={cn("flex min-w-0 items-center gap-2.5", metaClassName)}>
      {avatar}
      <div className="min-w-0 leading-tight">
        <p className="truncate text-sm font-medium text-foreground">{name}</p>
        {email && <p className="truncate text-xs text-muted-foreground">{email}</p>}
      </div>
    </div>
  );
}