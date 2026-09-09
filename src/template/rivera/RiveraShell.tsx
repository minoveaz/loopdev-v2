import { Sidebar } from "@/components/layout/Sidebar";

interface RiveraShellProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function RiveraShell({ collapsed, mobileOpen, onMobileClose }: RiveraShellProps) {
  return <Sidebar collapsed={collapsed} mobileOpen={mobileOpen} onMobileClose={onMobileClose} />;
}
