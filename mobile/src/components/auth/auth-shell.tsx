import type { PropsWithChildren } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { LuminaMark } from "@/components/brand/lumina-mark";
import { useTemaApp } from "@/theme/theme";

interface AuthShellProps extends PropsWithChildren {
  destaque: string;
  titulo: string;
  descricao: string;
}

export function AuthShell({
  destaque,
  titulo,
  descricao,
  children: filhos,
}: AuthShellProps) {
  const tema = useTemaApp();

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: tema.cores.fundo }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.brandRow}>
            <LuminaMark tamanho={42} />
            <Text style={[styles.brand, { color: tema.cores.texto }]}>
              Lumina
            </Text>
          </View>
          <View style={styles.heading}>
            <Text style={[styles.eyebrow, { color: tema.cores.marca }]}>
              {destaque}
            </Text>
            <Text
              accessibilityRole="header"
              style={[styles.title, { color: tema.cores.texto }]}
            >
              {titulo}
            </Text>
            <Text
              style={[
                styles.description,
                { color: tema.cores.textoSecundario },
              ]}
            >
              {descricao}
            </Text>
          </View>
          {filhos}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1 },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 36,
  },
  brandRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    marginBottom: 44,
  },
  brand: { fontSize: 21, fontWeight: "800", letterSpacing: -0.4 },
  heading: { gap: 8, marginBottom: 28 },
  eyebrow: { fontSize: 14, fontWeight: "700" },
  title: {
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: -0.8,
    lineHeight: 36,
  },
  description: { fontSize: 15, lineHeight: 22 },
});
