import { CreditCard, LogOut, Settings, ShieldCheck, UserRound } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { MobileBottomSheet } from "./MobileBottomSheet";

type MobileAccountSheetProps = {
  visible: boolean;
  onClose: () => void;
};

const items = [
  { label: "Profile", icon: UserRound },
  { label: "Account settings", icon: Settings },
  { label: "Security", icon: ShieldCheck },
  { label: "Billing", icon: CreditCard },
];

export function MobileAccountSheet({ visible, onClose }: MobileAccountSheetProps) {
  return (
    <MobileBottomSheet onClose={onClose} title="Account" visible={visible}>
      <Text style={styles.name}>Admin</Text>
      <Text style={styles.email}>admin@rivera.app</Text>
      <View style={styles.separator} />
      <View style={styles.items}>
        {items.map(({ label, icon: Icon }) => (
          <Pressable key={label} onPress={onClose} style={styles.item}>
            <Icon color="#1f2937" size={22} strokeWidth={2} />
            <Text style={styles.itemLabel}>{label}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.separator} />
      <Pressable onPress={onClose} style={styles.item}>
        <LogOut color="#ef334e" size={22} strokeWidth={2} />
        <Text style={styles.signOut}>Sign out</Text>
      </Pressable>
    </MobileBottomSheet>
  );
}

const styles = StyleSheet.create({
  name: { color: "#111827", fontSize: 22, fontWeight: "800" },
  email: { color: "#64748b", fontSize: 14, marginTop: 4 },
  separator: { backgroundColor: "#e5e7eb", height: 1, marginVertical: 16 },
  items: { gap: 2 },
  item: {
    alignItems: "center",
    flexDirection: "row",
    minHeight: 52,
    paddingVertical: 6,
  },
  itemLabel: { color: "#1f2937", fontSize: 17, marginLeft: 16 },
  signOut: { color: "#ef334e", fontSize: 17, marginLeft: 16 },
});
