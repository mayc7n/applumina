import { CircleAlert, Inbox } from "lucide-react-native";
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
      <View style={[styles.icon, { backgroundColor: tema.cores.sobreposicao }]}>
        <Icone
          color={
            tipo === "erro" ? tema.cores.perigo : tema.cores.textoSecundario
          }
          size={22}
        />
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
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  title: { fontSize: 16, fontWeight: "700", marginTop: 4 },
  description: { fontSize: 14, lineHeight: 20, textAlign: "center" },
  action: { marginTop: 8, minWidth: 120 },
});
