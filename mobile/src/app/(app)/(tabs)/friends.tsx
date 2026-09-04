import { router } from "expo-router";
import { ShieldCheck, UsersRound } from "lucide-react-native";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppButton } from "@/components/ui/app-button";
import { ScreenHeader } from "@/components/ui/screen-header";
import { useIdioma } from "@/i18n/idioma";
import { useArmazenamentoAutenticacao } from "@/store/auth-store";
import { useTemaApp } from "@/theme/theme";

export default function TelaAmigos() {
  const tema = useTemaApp();
  const { traduzir } = useIdioma();
  const autenticado = useArmazenamentoAutenticacao(
    (armazenamento) => armazenamento.estado === "autenticado",
  );

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[styles.tela, { backgroundColor: tema.cores.fundo }]}
    >
      <ScrollView contentContainerStyle={styles.conteudo}>
        <ScreenHeader titulo={traduzir("amigos.titulo")} />
        <UsersRound color={tema.cores.marca} size={42} />
        <View style={styles.textos}>
          <Text style={[styles.titulo, { color: tema.cores.texto }]}>
            {traduzir("amigos.vazioTitulo")}
          </Text>
          <Text style={[styles.descricao, { color: tema.cores.textoSecundario }]}>
            {autenticado
              ? traduzir("amigos.vazioDescricao")
              : traduzir("amigos.visitanteDescricao")}
          </Text>
        </View>
        <View style={[styles.privacidade, { borderColor: tema.cores.borda }]}>
          <ShieldCheck color={tema.cores.sucesso} size={21} />
          <Text style={[styles.privacidadeTexto, { color: tema.cores.texto }]}>
            {traduzir("amigos.privacidade")}
          </Text>
        </View>
        {!autenticado ? (
          <AppButton
            onPress={() => router.push("/login")}
            rotulo={traduzir("comum.entrar")}
          />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1 },
  conteudo: { gap: 24, padding: 20, paddingBottom: 36 },
  textos: { gap: 9 },
  titulo: { fontSize: 22, fontWeight: "800", lineHeight: 28 },
  descricao: { fontSize: 15, lineHeight: 22 },
  privacidade: {
    alignItems: "flex-start",
    borderBottomWidth: 1,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 12,
    paddingVertical: 16,
  },
  privacidadeTexto: { flex: 1, fontSize: 14, lineHeight: 20 },
});
