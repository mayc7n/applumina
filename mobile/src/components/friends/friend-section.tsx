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
      <View style={styles.cabecalho}>
        <View style={[styles.marca, { backgroundColor: tema.cores.marca }]} />
        <Text style={[styles.titulo, { color: tema.cores.texto }]}>{titulo}</Text>
      </View>
      <View style={styles.lista}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  secao: { gap: 10 },
  cabecalho: { alignItems: "center", flexDirection: "row", gap: 9 },
  marca: { borderRadius: 2, height: 18, width: 4 },
  titulo: { flex: 1, fontSize: 18, fontWeight: "800", lineHeight: 24 },
  lista: { gap: 10 },
});
