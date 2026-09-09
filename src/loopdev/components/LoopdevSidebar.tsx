import { Sidebar } from "@/components/layout/Sidebar";
import { loopdevNavigation } from "@/loopdev/navigation";

interface LoopdevSidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function LoopdevSidebar({
  collapsed,
  mobileOpen,
  onMobileClose,
}: LoopdevSidebarProps) {
  return (
    <Sidebar
      collapsed={collapsed}
      mobileOpen={mobileOpen}
      onMobileClose={onMobileClose}
      navigationOverride={loopdevNavigation}
    />
  );
}
