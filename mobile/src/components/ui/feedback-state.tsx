import { CircleAlert, FileQuestion, Inbox, Sparkles } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/ui/app-button";
import { useTemaApp } from "@/theme/theme";

interface FeedbackStateProps {
  titulo: string;
  descricao: string;
  tipo?: "vazio" | "erro";
  rotuloAcao?: string;
  aoAgir?: () => void;
}

export function FeedbackState({
  titulo,
  descricao,
  tipo = "vazio",
  rotuloAcao,
  aoAgir,
}: FeedbackStateProps) {
  const tema = useTemaApp();
  const Icone = tipo === "erro" ? CircleAlert : Inbox;

  return (
    <View style={[styles.container, { borderColor: tema.cores.borda }]}>
      <View
        accessibilityElementsHidden
        importantForAccessibility="no"
        style={styles.iconCluster}
      >
        <View style={[styles.iconAuxiliar, styles.iconEsquerdo, { backgroundColor: tema.cores.sobreposicao }]}>
          <FileQuestion color={tema.cores.textoSutil} size={17} />
        </View>
        <View style={[styles.icon, { backgroundColor: tema.cores.marcaSuave }]}>
          <Icone
            color={tipo === "erro" ? tema.cores.perigo : tema.cores.marca}
            size={24}
          />
        </View>
        <View style={[styles.iconAuxiliar, styles.iconDireito, { backgroundColor: tema.cores.sobreposicao }]}>
          <Sparkles color={tema.cores.textoSutil} size={17} />
        </View>
      </View>
      <Text style={[styles.title, { color: tema.cores.texto }]}>{titulo}</Text>
      <Text style={[styles.description, { color: tema.cores.textoSecundario }]}>
        {descricao}
      </Text>
      {rotuloAcao && aoAgir ? (
        <AppButton
          rotulo={rotuloAcao}
          onPress={aoAgir}
          style={styles.action}
          variante="secondary"
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    borderRadius: 16,
    borderStyle: "dashed",
    borderWidth: 1,
    gap: 8,
    padding: 24,
  },
  icon: {
    alignItems: "center",
    borderRadius: 22,
    height: 50,
    justifyContent: "center",
    width: 50,
  },
  iconCluster: { alignItems: "center", flexDirection: "row", height: 58, justifyContent: "center", width: 132 },
  iconAuxiliar: { alignItems: "center", borderRadius: 17, height: 34, justifyContent: "center", width: 34 },
  iconEsquerdo: { marginRight: -5, transform: [{ rotate: "-10deg" }] },
  iconDireito: { marginLeft: -5, transform: [{ rotate: "10deg" }] },
  title: { fontSize: 16, fontWeight: "700", marginTop: 4 },
  description: { fontSize: 14, lineHeight: 20, textAlign: "center" },
  action: { marginTop: 8, minWidth: 120 },
});
