import { Copy, ExternalLink, FileText, Reply, Save } from "lucide-react";
import type { ReactElement } from "react";
import { AdaptiveContextMenu, type ContextMenuAction } from "@/components/common";
import type { CommunicationMessage } from "@/loopdev/domains/communications";

interface MessageContextMenuProps {
  message: CommunicationMessage;
  children: ReactElement;
  onCopy: (message: CommunicationMessage) => void | Promise<void>;
  onReply: (message: CommunicationMessage) => void | Promise<void>;
  onOpenOperations: () => void;
  onSaveToCustomer?: (message: CommunicationMessage) => void | Promise<void>;
  onExtractDocument?: (message: CommunicationMessage) => void;
}

export function MessageContextMenu({
  message,
  children,
  onCopy,
  onReply,
  onOpenOperations,
  onSaveToCustomer,
  onExtractDocument,
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
    ...(onSaveToCustomer && message.contentType === "document"
      ? [{
        id: "save-to-customer",
        label: "Save to customer record",
        icon: <Save className="me-2 h-4 w-4" />,
        onSelect: () => onSaveToCustomer(message),
      }]
      : []),
    ...(onExtractDocument && (message.contentType === "document" || message.contentType === "image")
      ? [{
        id: "extract-document",
        label: "Extraer datos con Document Intelligence",
        icon: <FileText className="me-2 h-4 w-4 text-primary" />,
        onSelect: () => onExtractDocument(message),
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
