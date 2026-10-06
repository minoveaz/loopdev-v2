import React from "react";
import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import {
  Activity,
  Calendar,
  CheckSquare,
  Clock3,
  FileText,
  Mail,
  MessageSquare,
  PhoneCall,
  StickyNote,
  TrendingUp,
  Users,
} from "lucide-react-native";
import { mobileTheme } from "../../theme/tokens";

export interface MobileActivityItem {
  id: string;
  type: string;
  source?: string;
  sourceType?: string;
  summary: string;
  occurredAt: string;
  status?: string;
  authorName?: string;
}

export interface MobileActivityFeedProps {
  items: MobileActivityItem[];
  emptyMessage?: string;
  style?: StyleProp<ViewStyle>;
}

export function MobileActivityFeed({
  items,
  emptyMessage = "No hay actividades registradas.",
  style,
}: MobileActivityFeedProps) {
  if (items.length === 0) {
    return (
      <View style={[styles.emptyContainer, style]}>
        <Clock3 size={24} color={mobileTheme.colors.textSubtle} />
        <Text style={styles.emptyText}>{emptyMessage}</Text>
      </View>
    );
  }

  const sorted = [...items].sort((a, b) =>
    b.occurredAt.localeCompare(a.occurredAt)
  );

  return (
    <View style={[styles.container, style]}>
      {sorted.map((item, index) => {
        const isLast = index === sorted.length - 1;
        const iconConfig = getActivityIconConfig(item.type);

        return (
          <View key={item.id} style={styles.timelineRow}>
            {/* Timeline Line & Icon */}
            <View style={styles.axisCol}>
              <View
                style={[
                  styles.iconWrap,
                  { backgroundColor: iconConfig.bg, borderColor: iconConfig.border },
                ]}
              >
                {iconConfig.icon}
              </View>
              {!isLast ? <View style={styles.verticalLine} /> : null}
            </View>

            {/* Content Box */}
            <View style={styles.card}>
              <View style={styles.header}>
                <Text style={styles.actionTitle}>{iconConfig.label}</Text>
                <Text style={styles.timestamp}>
                  {formatDateShort(item.occurredAt)}
                </Text>
              </View>
              <Text style={styles.summary}>{item.summary}</Text>
              {item.source || item.authorName ? (
                <View style={styles.footer}>
                  <Text style={styles.actor}>
                    Por {item.authorName || item.source}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

function getActivityIconConfig(type: string) {
  const norm = type.toLowerCase();
  if (norm.includes("call")) {
    return {
      icon: <PhoneCall size={13} color="#15803d" />,
      bg: "#f0fdf4",
      border: "#bbf7d0",
      label: "Llamada registrada",
    };
  }
  if (norm.includes("meeting")) {
    return {
      icon: <Users size={13} color="#7c3aed" />,
      bg: "#faf5ff",
      border: "#e9d5ff",
      label: "Reunión",
    };
  }
  if (norm.includes("email") || norm.includes("mail")) {
    return {
      icon: <Mail size={13} color="#1d4ed8" />,
      bg: "#eff6ff",
      border: "#bfdbfe",
      label: "Correo",
    };
  }
  if (norm.includes("note")) {
    return {
      icon: <StickyNote size={13} color="#ca8a04" />,
      bg: "#fefce8",
      border: "#fde68a",
      label: "Nota",
    };
  }
  if (norm.includes("task")) {
    return {
      icon: <CheckSquare size={13} color="#059669" />,
      bg: "#ecfdf5",
      border: "#a7f3d0",
      label: "Tarea completada",
    };
  }
  if (norm.includes("document") || norm.includes("file")) {
    return {
      icon: <FileText size={13} color="#dc2626" />,
      bg: "#fef2f2",
      border: "#fecaca",
      label: "Documento",
    };
  }
  if (norm.includes("stage") || norm.includes("deal")) {
    return {
      icon: <TrendingUp size={13} color="#135bec" />,
      bg: "#eff6ff",
      border: "#bfdbfe",
      label: "Cambio de Fase",
    };
  }
  return {
    icon: <Activity size={13} color="#64748b" />,
    bg: "#f8fafc",
    border: "#e2e8f0",
    label: type.replace(/_/g, " "),
  };
}

function formatDateShort(isoString: string): string {
  try {
    const d = new Date(isoString);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - d.getTime()) / (1000 * 3600));
    if (diffHours < 1) return "Ahora";
    if (diffHours < 24) return `Hace ${diffHours}h`;
    return d.toLocaleDateString("es-ES", { month: "short", day: "numeric" });
  } catch {
    return isoString;
  }
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 36,
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    color: mobileTheme.colors.textMuted,
  },
  timelineRow: {
    flexDirection: "row",
    gap: 12,
  },
  axisCol: {
    alignItems: "center",
    width: 28,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  verticalLine: {
    flex: 1,
    width: 2,
    backgroundColor: mobileTheme.colors.border,
    marginVertical: 4,
  },
  card: {
    flex: 1,
    backgroundColor: mobileTheme.colors.surface,
    borderRadius: mobileTheme.radii.md,
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    padding: 12,
    marginBottom: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  actionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: mobileTheme.colors.textHeading,
    textTransform: "capitalize",
  },
  timestamp: {
    fontSize: 11,
    color: mobileTheme.colors.textSubtle,
  },
  summary: {
    fontSize: 13,
    color: mobileTheme.colors.textMain,
    lineHeight: 18,
  },
  footer: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: mobileTheme.colors.borderLight,
  },
  actor: {
    fontSize: 11,
    color: mobileTheme.colors.textMuted,
    fontWeight: "500",
  },
});
