import type { Message } from "@/types";
import { ago } from "./_seedHelpers";
import { createLocalStore } from "@/lib/localStore";

export const mockMessages: Message[] = [
  { id: "m_01", threadId: "th_01", fromUserId: "u_03", toUserId: "u_01", preview: "Sent over the latest mockups for review.",   body: "Hey! I dropped the latest Atlas mockups into the project — let me know what you think.",        read: false, starred: true,  createdAt: ago(0, 0.07), updatedAt: ago(0, 0.07) },
  { id: "m_02", threadId: "th_02", fromUserId: "u_02", toUserId: "u_01", preview: "Quick question about the Atlas timeline.",   body: "Can we shift the brand guideline draft to next Tuesday? Atlas asked for one extra round.",      read: false, starred: false, createdAt: ago(0, 0.5),  updatedAt: ago(0, 0.5)  },
  { id: "m_03", threadId: "th_03", fromUserId: "u_05", toUserId: "u_01", preview: "Thanks! I'll deploy the patch tonight.",     body: "Got it — the analytics fix is queued for tonight's deploy. I'll send a status note tomorrow.", read: true,  starred: false, createdAt: ago(0, 2),    updatedAt: ago(0, 2)    },
  { id: "m_04", threadId: "th_04", fromUserId: "u_07", toUserId: "u_01", preview: "Can we sync about the Q3 roadmap?",          body: "Have time this week to walk through Q3? I want to align the editorial calendar with releases.", read: true,  starred: false, createdAt: ago(1),       updatedAt: ago(1)       },
  { id: "m_05", threadId: "th_05", fromUserId: "u_10", toUserId: "u_01", preview: "Invoice 0042 is going out today.",           body: "FYI — Harbor invoice 0042 goes out at noon. Northwind is still overdue, escalating tomorrow.", read: true,  starred: true,  createdAt: ago(2),       updatedAt: ago(2)       },
];

export const messagesStore = createLocalStore<Message>({
  key: "data:messages",
  seed: mockMessages,
  idPrefix: "m",
});
