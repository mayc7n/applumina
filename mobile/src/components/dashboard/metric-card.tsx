import type { LucideIcon } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";

import { useTemaApp } from "@/theme/theme";

interface MetricCardProps {
  rotulo: string;
  valor: string;
  Icone: LucideIcon;
  cor: string;
}

export function MetricCard({ rotulo, valor, Icone, cor }: MetricCardProps) {
  const tema = useTemaApp();
  return (
    <View
      style={[
        styles.cartao,
        { backgroundColor: tema.cores.elevado, borderColor: tema.cores.borda },
      ]}
    >
      <View style={[styles.icone, { backgroundColor: `${cor}18` }]}>
        <Icone color={cor} size={18} />
      </View>
      <Text style={[styles.valor, { color: tema.cores.texto }]}>{valor}</Text>
      <Text style={[styles.rotulo, { color: tema.cores.textoSecundario }]}>
        {rotulo}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  cartao: {
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    gap: 5,
    minWidth: 145,
    padding: 16,
  },
  icone: {
    alignItems: "center",
    borderRadius: 10,
    height: 36,
    justifyContent: "center",
    marginBottom: 8,
    width: 36,
  },
  valor: { fontSize: 23, fontVariant: ["tabular-nums"], fontWeight: "800" },
  rotulo: { fontSize: 12 },
});
