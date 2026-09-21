export interface ActivityTimelineScope {
  organizationId: string;
  workspaceId?: string | null;
}

export interface ActivityRecord {
  id: string;
  scope: ActivityTimelineScope;
  relation: { entityType: string; entityId: string } | null;
  type: string;
  actorId: string | null;
  sourceType: string;
  sourceId: string;
  summary: string;
  metadata: Record<string, string>;
  occurredAt: string;
}

export interface ActivityTimelinePort {
  list(params: {
    scope: ActivityTimelineScope;
    relation?: { entityType: string; entityId: string };
    limit?: number;
  }): Promise<ActivityRecord[]>;
  append(input: {
    scope: ActivityTimelineScope;
    relation?: { entityType: string; entityId: string } | null;
    type: string;
    actorId?: string | null;
    sourceType: string;
    sourceId: string;
    dedupeKey?: string;
    summary: string;
    metadata?: Record<string, string>;
    occurredAt?: string;
  }): Promise<ActivityRecord>;
}
