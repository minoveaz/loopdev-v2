export const contactActions = [
  { id: "view", label: "View Customer 360", availability: "available" },
  { id: "edit", label: "Edit contact", availability: "available" },
  { id: "add-note", label: "Add note", availability: "unavailable" },
  { id: "create-task", label: "Create task", availability: "unavailable" },
  { id: "archive", label: "Archive contact", availability: "available", destructive: true },
] as const;

export type ContactActionId = (typeof contactActions)[number]["id"];
