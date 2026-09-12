import type { EntityScope } from "@/loopdev/domains/platform";
import type { FileCategory, FileRelation, FileSource } from "./types";

export type FutureFileConsumer = "marketing-studio" | "content-studio" | "document-intelligence";
export type FutureFilePurpose =
  | "creative-asset"
  | "brand-asset"
  | "content-asset"
  | "content-variant"
  | "temporary-document"
  | "intelligence-input"
  | "intelligence-output";

export interface FutureConsumerFileContext {
  consumer: FutureFileConsumer;
  purpose: FutureFilePurpose;
  retentionDays?: number;
  temporary?: boolean;
}

export const FUTURE_CONSUMER_DEFAULTS: Record<FutureFileConsumer, Pick<FutureConsumerFileContext, "retentionDays" | "temporary">> = {
  "marketing-studio": { temporary: false },
  "content-studio": { temporary: false },
  "document-intelligence": { temporary: true, retentionDays: 7 },
};

export function createFutureConsumerRelation(
  consumer: FutureFileConsumer,
  entityId: string,
  scope: EntityScope,
  label?: string,
): FileRelation {
  return { entityType: consumer, entityId, scope, label };
}

export function fileDefaultsForFutureConsumer(context: FutureConsumerFileContext): {
  category: FileCategory;
  source: FileSource;
  temporary: boolean;
  retentionDays?: number;
} {
  const defaults = FUTURE_CONSUMER_DEFAULTS[context.consumer];
  const category: FileCategory = "other";
  return {
    category,
    source: context.temporary || defaults.temporary ? "temporary" : "generated",
    temporary: context.temporary ?? defaults.temporary,
    retentionDays: context.retentionDays ?? defaults.retentionDays,
  };
}
