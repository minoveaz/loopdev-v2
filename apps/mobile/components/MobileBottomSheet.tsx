import type { ReactNode } from "react";
import { MobileModalSheet } from "./MobileModal";

type MobileBottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
};

export function MobileBottomSheet({
  visible,
  onClose,
  title,
  children,
}: MobileBottomSheetProps) {
  return <MobileModalSheet visible={visible} onClose={onClose} title={title}>{children}</MobileModalSheet>;
}
