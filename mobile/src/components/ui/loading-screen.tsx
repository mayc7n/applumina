import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { useIdioma } from "@/i18n/idioma";
import { useTemaApp } from "@/theme/theme";

export function LoadingScreen() {
  const tema = useTemaApp();
  const { traduzir } = useIdioma();
  return (
    <View style={[styles.container, { backgroundColor: tema.cores.fundo }]}>
      <ActivityIndicator color={tema.cores.marca} size="large" />
      <Text style={[styles.text, { color: tema.cores.textoSecundario }]}>
        {traduzir("comum.preparando")}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flex: 1,
    gap: 14,
    justifyContent: "center",
  },
  text: { fontSize: 14 },
});
