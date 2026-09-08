import type { User } from "@/types";
import { ago } from "./_seedHelpers";
import { createLocalStore } from "@/lib/localStore";

export const mockUsers: User[] = [
  { id: "u_01", name: "Amelia Hart",  email: "amelia@rivera.app",  roleId: "r_admin",   status: "active",    title: "Founder",            department: "Leadership", createdAt: ago(232), updatedAt: ago(2),  lastActiveAt: ago(0, 1) },
  { id: "u_02", name: "Marcus Bell",  email: "marcus@rivera.app",  roleId: "r_manager", status: "active",    title: "Head of Delivery",   department: "Operations", createdAt: ago(210), updatedAt: ago(5),  lastActiveAt: ago(1)    },
  { id: "u_03", name: "Sofia Lin",    email: "sofia@rivera.app",   roleId: "r_member",  status: "active",    title: "Senior Designer",    department: "Design",     createdAt: ago(160), updatedAt: ago(12), lastActiveAt: ago(0, 4) },
  { id: "u_04", name: "Henrik Voss",  email: "henrik@rivera.app",  roleId: "r_member",  status: "pending",   title: "Engineer",           department: "Engineering", createdAt: ago(118), updatedAt: ago(118), lastActiveAt: ago(7)    },
  { id: "u_05", name: "Priya Anand",  email: "priya@rivera.app",   roleId: "r_viewer",  status: "active",    title: "Data Analyst",       department: "Analytics",  createdAt: ago(80),  updatedAt: ago(2),  lastActiveAt: ago(2)    },
  { id: "u_06", name: "Jonah Reyes",  email: "jonah@rivera.app",   roleId: "r_manager", status: "suspended", title: "Account Manager",    department: "Sales",      createdAt: ago(244), updatedAt: ago(40), lastActiveAt: ago(46)   },
  { id: "u_07", name: "Clara Okafor", email: "clara@rivera.app",   roleId: "r_member",  status: "active",    title: "Editor",             department: "Content",    createdAt: ago(60),  updatedAt: ago(1),  lastActiveAt: ago(0, 2) },
  { id: "u_08", name: "Theo Marin",   email: "theo@rivera.app",    roleId: "r_viewer",  status: "archived",  title: "Consultant",         department: "External",   createdAt: ago(280), updatedAt: ago(110), lastActiveAt: ago(112)  },
  { id: "u_09", name: "Linnea Vidal", email: "linnea@rivera.app",  roleId: "r_member",  status: "active",    title: "Engineer",           department: "Engineering", createdAt: ago(45),  updatedAt: ago(1),  lastActiveAt: ago(0)    },
  { id: "u_10", name: "Owen Patel",   email: "owen@rivera.app",    roleId: "r_billing", status: "active",    title: "Finance Lead",       department: "Finance",    createdAt: ago(140), updatedAt: ago(8),  lastActiveAt: ago(0, 6) },
];

export const usersStore = createLocalStore<User>({
  key: "data:users",
  seed: mockUsers,
  idPrefix: "u",
});
