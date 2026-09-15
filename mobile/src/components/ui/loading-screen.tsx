import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { LuminaMark } from "@/components/brand/lumina-mark";
import { useIdioma } from "@/i18n/idioma";
import { useTemaApp } from "@/theme/theme";

export function LoadingScreen() {
  const tema = useTemaApp();
  const { traduzir } = useIdioma();
  return (
    <View style={[styles.container, { backgroundColor: tema.cores.fundo }]}>
      <View style={[styles.marca, { backgroundColor: tema.cores.marcaSuave, borderColor: tema.cores.marcaContorno }]}>
        <LuminaMark decorativo tamanho={54} />
      </View>
      <ActivityIndicator color={tema.cores.marca} size="small" />
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
  marca: { alignItems: "center", borderRadius: 34, borderWidth: 1, height: 68, justifyContent: "center", shadowColor: "#000000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 18, width: 68 },
  text: { fontSize: 14 },
});
