import React from "react";
import {
  Alert,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { Mail, MessageCircle, Phone, MessageSquare } from "lucide-react-native";
import { mobileTheme } from "../../theme/tokens";

export interface MobileSpeedDialBarProps {
  phone?: string | null;
  email?: string | null;
  whatsApp?: string | null;
  whatsapp?: string | null;
  sms?: string | null;
  contactName?: string;
  variant?: "compact" | "full";
  onCall?: () => void;
  onWhatsApp?: () => void;
  onEmail?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function MobileSpeedDialBar({
  phone,
  email,
  whatsApp,
  whatsapp,
  sms,
  contactName,
  variant = "compact",
  style,
}: MobileSpeedDialBarProps) {
  const targetWhatsApp = whatsApp || whatsapp || phone;
  const targetSms = sms || phone;

  const handleCall = () => {
    if (!phone) {
      Alert.alert("Teléfono no disponible", `No hay un número registrado para ${contactName || "este contacto"}.`);
      return;
    }
    const cleanNumber = phone.replace(/[^0-9+]/g, "");
    Linking.openURL(`tel:${cleanNumber}`).catch(() => {
      Alert.alert("Error", "No se pudo iniciar la llamada telefónica.");
    });
  };

  const handleWhatsApp = () => {
    if (!targetWhatsApp) {
      Alert.alert("WhatsApp no disponible", `No hay un número móvil registrado para ${contactName || "este contacto"}.`);
      return;
    }
    let cleanNumber = targetWhatsApp.replace(/[^0-9]/g, "");
    if (cleanNumber.length === 9 && !cleanNumber.startsWith("34")) {
      cleanNumber = `34${cleanNumber}`;
    }
    Linking.openURL(`https://wa.me/${cleanNumber}`).catch(() => {
      Alert.alert("Error", "No se pudo abrir WhatsApp en este dispositivo.");
    });
  };

  const handleEmail = () => {
    if (!email) {
      Alert.alert("Email no disponible", `No hay una dirección de correo para ${contactName || "este contacto"}.`);
      return;
    }
    Linking.openURL(`mailto:${email.trim()}`).catch(() => {
      Alert.alert("Error", "No se pudo abrir la aplicación de correo.");
    });
  };

  const handleSms = () => {
    if (!targetSms) {
      Alert.alert("SMS no disponible", `No hay un número registrado para enviar SMS.`);
      return;
    }
    const cleanNumber = targetSms.replace(/[^0-9+]/g, "");
    Linking.openURL(`sms:${cleanNumber}`).catch(() => {
      Alert.alert("Error", "No se pudo abrir la mensajería SMS.");
    });
  };

  if (variant === "full") {
    return (
      <View style={[styles.fullContainer, style]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Llamar"
          onPress={handleCall}
          style={[styles.fullBtn, styles.callBtnFull]}
        >
          <Phone size={15} color="#15803d" />
          <Text style={[styles.fullBtnText, { color: "#15803d" }]}>Llamar</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="WhatsApp"
          onPress={handleWhatsApp}
          style={[styles.fullBtn, styles.waBtnFull]}
        >
          <MessageCircle size={15} color="#047857" />
          <Text style={[styles.fullBtnText, { color: "#047857" }]}>WhatsApp</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Email"
          onPress={handleEmail}
          style={[styles.fullBtn, styles.emailBtnFull]}
        >
          <Mail size={15} color="#1d4ed8" />
          <Text style={[styles.fullBtnText, { color: "#1d4ed8" }]}>Email</Text>
        </Pressable>
      </View>
    );
  }

  // Compact variant for cards
  return (
    <View style={[styles.compactContainer, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Llamar"
        onPress={handleCall}
        style={[styles.compactBtn, styles.callBtnCompact]}
        hitSlop={6}
      >
        <Phone size={13} color="#15803d" />
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="WhatsApp"
        onPress={handleWhatsApp}
        style={[styles.compactBtn, styles.waBtnCompact]}
        hitSlop={6}
      >
        <MessageCircle size={13} color="#047857" />
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Email"
        onPress={handleEmail}
        style={[styles.compactBtn, styles.emailBtnCompact]}
        hitSlop={6}
      >
        <Text style={styles.emailAtText}>@</Text>
      </Pressable>

      {sms ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="SMS"
          onPress={handleSms}
          style={[styles.compactBtn, styles.smsBtnCompact]}
          hitSlop={6}
        >
          <MessageSquare size={13} color="#475569" />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fullContainer: {
    flexDirection: "row",
    gap: 8,
    marginVertical: 6,
  },
  fullBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: mobileTheme.radii.md,
    borderWidth: 1,
    minHeight: 44,
  },
  callBtnFull: {
    backgroundColor: "#f0fdf4",
    borderColor: "#bbf7d0",
  },
  waBtnFull: {
    backgroundColor: "#ecfdf5",
    borderColor: "#a7f3d0",
  },
  emailBtnFull: {
    backgroundColor: "#eff6ff",
    borderColor: "#bfdbfe",
  },
  fullBtnText: {
    fontSize: 12,
    fontWeight: "700",
  },

  // Compact styles
  compactContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  compactBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  callBtnCompact: {
    backgroundColor: "#f0fdf4",
    borderColor: "#bbf7d0",
  },
  waBtnCompact: {
    backgroundColor: "#ecfdf5",
    borderColor: "#a7f3d0",
  },
  emailBtnCompact: {
    backgroundColor: "#eff6ff",
    borderColor: "#bfdbfe",
  },
  emailAtText: {
    color: "#1d4ed8",
    fontWeight: "800",
    fontSize: 13,
  },
  smsBtnCompact: {
    backgroundColor: "#f8fafc",
    borderColor: "#e2e8f0",
  },
});
