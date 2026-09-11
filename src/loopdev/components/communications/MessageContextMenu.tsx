import { Copy, ExternalLink, Reply } from "lucide-react";
import type { ReactElement } from "react";
import { AdaptiveContextMenu, type ContextMenuAction } from "@/components/common";
import type { CommunicationMessage } from "@/loopdev/domains/communications";

interface MessageContextMenuProps {
  message: CommunicationMessage;
  children: ReactElement;
  onCopy: (message: CommunicationMessage) => void | Promise<void>;
  onReply: (message: CommunicationMessage) => void | Promise<void>;
  onOpenOperations: () => void;
}

export function MessageContextMenu({
  message,
  children,
  onCopy,
  onReply,
  onOpenOperations,
}: MessageContextMenuProps) {
  const actions: ContextMenuAction[] = [
    {
      id: "copy",
      label: "Copy message",
      icon: <Copy className="me-2 h-4 w-4" />,
      onSelect: () => onCopy(message),
    },
    ...(message.direction === "inbound"
      ? [{
        id: "reply",
        label: "Reply to message",
        icon: <Reply className="me-2 h-4 w-4" />,
        onSelect: () => onReply(message),
      }]
      : []),
    {
      id: "operations",
      label: "Open conversation operations",
      icon: <ExternalLink className="me-2 h-4 w-4" />,
      onSelect: onOpenOperations,
    },
  ];

  return (
    <AdaptiveContextMenu
      trigger={children}
      label="Message actions"
      description="Choose an action for this message."
      actions={actions}
    />
  );
}
