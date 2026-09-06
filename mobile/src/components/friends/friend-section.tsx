import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useTemaApp } from "@/theme/theme";

interface FriendSectionProps {
  titulo: string;
  children: ReactNode;
}

export function FriendSection({ titulo, children }: FriendSectionProps) {
  const tema = useTemaApp();

  return (
    <View style={styles.secao}>
      <Text style={[styles.titulo, { color: tema.cores.texto }]}>{titulo}</Text>
      <View>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  secao: { gap: 7 },
  titulo: { fontSize: 18, fontWeight: "800", lineHeight: 24 },
});
