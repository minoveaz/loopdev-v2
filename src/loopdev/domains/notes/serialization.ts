import type { JSONContent } from "@tiptap/core";
import type { NoteMention } from "./types";

export function notePlainText(content: JSONContent): string {
  const walk = (node: JSONContent): string => {
    const own = node.type === "hardBreak" ? "\n" : node.text ?? (node.type === "mention" && typeof node.attrs?.label === "string" ? node.attrs.label : "");
    const children = (node.content ?? []).map(walk).join("");
    return `${own}${children}${node.type === "paragraph" || node.type === "listItem" ? "\n" : ""}`;
  };
  return walk(content).trim();
}

export function noteMentions(content: JSONContent): NoteMention[] {
  const result: NoteMention[] = [];
  const walk = (node: JSONContent) => {
    if (node.type === "mention" && typeof node.attrs?.id === "string" && typeof node.attrs.label === "string") {
      result.push({ userId: node.attrs.id, displayName: node.attrs.label });
    }
    node.content?.forEach(walk);
  };
  walk(content);
  return result.filter((mention, index) => result.findIndex((item) => item.userId === mention.userId) === index);
}
