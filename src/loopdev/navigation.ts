import { Boxes, FileSearch, LayoutDashboard, Settings, Users } from "lucide-react";
import type { NavSection } from "@/app/nav-types";
import { loopdevNavigationContract } from "../../packages/contracts/src/navigation";

export const loopdevNavigation: NavSection[] = [
  {
    label: "Launchpad",
    items: [
      {
        label: loopdevNavigationContract.launchpad.label,
        to: loopdevNavigationContract.launchpad.path,
        icon: LayoutDashboard,
      },
    ],
  },
  {
    label: "Suites",
    items: [
      {
        label: loopdevNavigationContract.groups[0].label,
        icon: Users,
        children: loopdevNavigationContract.groups[0].items.map((item) => ({
          label: item.label,
          to: item.path,
        })),
      },
      {
        label: loopdevNavigationContract.groups[1].label,
        icon: Boxes,
        children: loopdevNavigationContract.groups[1].items.map((item) => ({
          label: item.label,
          to: item.path,
        })),
      },
    ],
  },
  {
    label: "Tools",
    items: [
      {
        label: "Document Intelligence",
        to: "/app/tools/document-intelligence",
        icon: FileSearch,
      },
    ],
  },
  {
    label: "Workspace",
    items: [
      {
        label: loopdevNavigationContract.groups[3].label,
        to: loopdevNavigationContract.groups[3].items[0].path,
        icon: Settings,
      },
    ],
  },
];
