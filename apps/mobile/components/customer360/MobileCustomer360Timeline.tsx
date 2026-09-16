import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Activity, Calendar, CheckSquare, Clock3, FileText, Mail, MessageSquare, PhoneCall, StickyNote, Users } from "lucide-react-native";
import type { CRMActivity } from "../../adapters/crm";

interface Props {
  timeline: CRMActivity[];
  contactId: string;
}

export function MobileCustomer360Timeline({ timeline, contactId }: Props) {
  const orderedTimeline = [...timeline].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
  const firstActivity = [...timeline].sort((a, b) => a.occurredAt.localeCompare(b.occurredAt))[0];
  const lastActivity = orderedTimeline[0];

  const getActivityIcon = (type: string, sourceType: string) => {
    switch (type) {
      case "call_logged":
      case "call":
        return <PhoneCall size={16} color="#2563eb" />;
      case "meeting_scheduled":
      case "meeting":
        return <Users size={16} color="#7c3aed" />;
      case "email_sent":
      case "email_received":
      case "email":
        return <Mail size={16} color="#059669" />;
      case "note_added":
      case "note":
        return <StickyNote size={16} color="#d97706" />;
      case "task_completed":
      case "task":
        return <CheckSquare size={16} color="#16a34a" />;
      case "document_uploaded":
      case "document":
        return <FileText size={16} color="#dc2626" />;
      default:
        return <Activity size={16} color="#64748b" />;
    }
  };

  const getActivityLabel = (type: string) => {
    switch (type) {
      case "call_logged":
        return "Llamada registrada";
      case "meeting_scheduled":
        return "Reunión programada";
      case "email_sent":
        return "Correo electrónico enviado";
      case "note_added":
        return "Nota añadida";
      case "task_completed":
        return "Tarea completada";
      case "document_uploaded":
        return "Documento cargado";
      default:
        return type.replace(/_/g, " ");
    }
  };

  return (
    <View style={styles.container}>
      {/* Metrics Summary Strip */}
      <View style={styles.metricsCard}>
        <View style={styles.metricItem}>
          <Text style={styles.metricVal}>{timeline.length}</Text>
          <Text style={styles.metricLabel}>Total eventos</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricItem}>
          <Text style={styles.metricVal}>
            {firstActivity ? new Date(firstActivity.occurredAt).toLocaleDateString() : "—"}
          </Text>
          <Text style={styles.metricLabel}>Primer contacto</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricItem}>
          <Text style={styles.metricVal}>
            {lastActivity ? new Date(lastActivity.occurredAt).toLocaleDateString() : "—"}
          </Text>
          <Text style={styles.metricLabel}>Último contacto</Text>
        </View>
      </View>

      {/* Feed List */}
      <View style={styles.feedCard}>
        <View style={styles.feedHeader}>
          <Text style={styles.feedTitle}>Activity timeline</Text>
          <Text style={styles.feedSubtitle}>Eventos y actividades recientes de la relación</Text>
        </View>

        {orderedTimeline.length === 0 ? (
          <View style={styles.emptyBox}>
            <Clock3 size={28} color="#94a3b8" />
            <Text style={styles.emptyTitle}>Sin actividad registrada</Text>
            <Text style={styles.emptySubtitle}>
              Las llamadas, reuniones, correos y notas aparecerán aquí.
            </Text>
          </View>
        ) : (
          <View style={styles.timelineList}>
            {orderedTimeline.map((item, index) => {
              const isLast = index === orderedTimeline.length - 1;
              return (
                <View key={item.id || `${item.sourceType}-${index}`} style={styles.itemRow}>
                  {/* Left Icon and Line */}
                  <View style={styles.leftCol}>
                    <View style={styles.iconCircle}>
                      {getActivityIcon(item.type, item.sourceType)}
                    </View>
                    {!isLast && <View style={styles.verticalLine} />}
                  </View>

                  {/* Right Content */}
                  <View style={styles.itemContent}>
                    <View style={styles.itemTopRow}>
                      <Text style={styles.itemTypeLabel}>
                        {getActivityLabel(item.type)}
                      </Text>
                      <Text style={styles.itemDate}>
                        {new Date(item.occurredAt).toLocaleDateString()}
                      </Text>
                    </View>
                    <Text style={styles.itemSummary}>{item.summary}</Text>
                    {item.status && (
                      <View style={styles.statusTag}>
                        <Text style={styles.statusTagText}>{item.status}</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  metricsCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: "#ffffff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingVertical: 12,
    marginBottom: 12,
  },
  metricItem: {
    alignItems: "center",
    flex: 1,
  },
  metricVal: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0f172a",
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748b",
    marginTop: 2,
    textTransform: "uppercase",
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: "#e2e8f0",
  },
  feedCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 16,
  },
  feedHeader: {
    marginBottom: 16,
  },
  feedTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0f172a",
  },
  feedSubtitle: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  emptyBox: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 6,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
  },
  emptySubtitle: {
    fontSize: 12,
    color: "#64748b",
    textAlign: "center",
  },
  timelineList: {
    gap: 0,
  },
  itemRow: {
    flexDirection: "row",
    gap: 12,
    minHeight: 64,
  },
  leftCol: {
    alignItems: "center",
    width: 32,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f8fafc",
    borderColor: "#e2e8f0",
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  verticalLine: {
    width: 2,
    flex: 1,
    backgroundColor: "#e2e8f0",
    marginVertical: 4,
  },
  itemContent: {
    flex: 1,
    paddingBottom: 16,
  },
  itemTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemTypeLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0f172a",
  },
  itemDate: {
    fontSize: 11,
    color: "#64748b",
  },
  itemSummary: {
    fontSize: 13,
    color: "#334155",
    marginTop: 3,
    lineHeight: 18,
  },
  statusTag: {
    alignSelf: "flex-start",
    backgroundColor: "#f1f5f9",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 4,
  },
  statusTagText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#475569",
  },
});
