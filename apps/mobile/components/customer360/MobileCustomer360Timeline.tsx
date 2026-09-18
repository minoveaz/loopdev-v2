import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Clock3 } from "lucide-react-native";
import type { CRMActivity } from "../../adapters/crm";
import { useT } from "../../i18n";
import {
  MobileCard,
  MobileMetricGrid,
  MobileActivityFeed,
  MobileEmptyState,
} from "../ui";
import { mobileTheme } from "../../theme/tokens";

interface Props {
  timeline: CRMActivity[];
  contactId: string;
}

export function MobileCustomer360Timeline({ timeline }: Props) {
  const t = useT();
  const orderedTimeline = [...timeline].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
  const firstActivity = [...timeline].sort((a, b) => a.occurredAt.localeCompare(b.occurredAt))[0];
  const lastActivity = orderedTimeline[0];

  const metrics = [
    {
      label: t("crm.customer360.timeline.totalEvents"),
      value: String(timeline.length),
    },
    {
      label: t("crm.customer360.timeline.firstContact"),
      value: firstActivity ? new Date(firstActivity.occurredAt).toLocaleDateString() : "—",
    },
    {
      label: t("crm.customer360.timeline.lastContact"),
      value: lastActivity ? new Date(lastActivity.occurredAt).toLocaleDateString() : "—",
    },
  ];

  return (
    <View style={styles.container}>
      {/* Metrics Summary Strip */}
      <MobileCard style={styles.metricsCard}>
        <MobileMetricGrid items={metrics} columns={3} />
      </MobileCard>

      {/* Feed Container */}
      <MobileCard style={styles.feedCard}>
        <View style={styles.feedHeader}>
          <Text style={styles.feedTitle}>{t("crm.customer360.timeline.title")}</Text>
          <Text style={styles.feedSubtitle}>{t("crm.customer360.timeline.subtitle")}</Text>
        </View>

        {orderedTimeline.length === 0 ? (
          <MobileEmptyState
            icon={<Clock3 size={28} color={mobileTheme.colors.textSubtle} />}
            title={t("crm.customer360.timeline.noActivity")}
            description={t("crm.customer360.timeline.noActivityDesc")}
          />
        ) : (
          <MobileActivityFeed
            items={orderedTimeline.map((item) => ({
              id: item.id,
              type: item.type,
              sourceType: item.sourceType,
              summary: item.summary,
              occurredAt: item.occurredAt,
              status: item.status,
            }))}
          />
        )}
      </MobileCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  metricsCard: {
    padding: 14,
  },
  feedCard: {
    padding: 16,
  },
  feedHeader: {
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: mobileTheme.colors.borderLight,
  },
  feedTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: mobileTheme.colors.textPrimary,
  },
  feedSubtitle: {
    fontSize: 12,
    color: mobileTheme.colors.textSecondary,
    marginTop: 2,
  },
});
