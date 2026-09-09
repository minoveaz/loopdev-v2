import { LoopdevSidebar } from "@/loopdev/components/LoopdevSidebar";

interface LoopdevShellProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function LoopdevShell({ collapsed, mobileOpen, onMobileClose }: LoopdevShellProps) {
  return <LoopdevSidebar collapsed={collapsed} mobileOpen={mobileOpen} onMobileClose={onMobileClose} />;
}
