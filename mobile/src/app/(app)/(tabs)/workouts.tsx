import { router } from "expo-router";
import { Activity, Bike, Footprints, Waves } from "lucide-react-native";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppButton } from "@/components/ui/app-button";
import { ScreenHeader } from "@/components/ui/screen-header";
import { useIdioma } from "@/i18n/idioma";
import { useArmazenamentoAutenticacao } from "@/store/auth-store";
import { useTemaApp } from "@/theme/theme";

export default function TelaTreinos() {
  const tema = useTemaApp();
  const { traduzir } = useIdioma();
  const autenticado = useArmazenamentoAutenticacao(
    (armazenamento) => armazenamento.estado === "autenticado",
  );
  const modalidades = [
    { Icone: Footprints, texto: traduzir("treinos.modalidadePassos") },
    { Icone: Activity, texto: traduzir("treinos.modalidadeForca") },
    { Icone: Bike, texto: traduzir("treinos.modalidadeEsportes") },
    { Icone: Waves, texto: traduzir("treinos.modalidadeOutras") },
  ];

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[styles.tela, { backgroundColor: tema.cores.fundo }]}
    >
      <ScrollView contentContainerStyle={styles.conteudo}>
        <ScreenHeader titulo={traduzir("treinos.titulo")} />
        <View style={styles.introducao}>
          <Text style={[styles.titulo, { color: tema.cores.texto }]}>
            {traduzir("treinos.vazioTitulo")}
          </Text>
          <Text style={[styles.descricao, { color: tema.cores.textoSecundario }]}>
            {autenticado
              ? traduzir("treinos.vazioDescricao")
              : traduzir("treinos.visitanteDescricao")}
          </Text>
        </View>
        <View style={[styles.lista, { borderColor: tema.cores.borda }]}>
          {modalidades.map(({ Icone, texto }) => (
            <View
              key={texto}
              style={[styles.item, { borderBottomColor: tema.cores.borda }]}
            >
              <Icone color={tema.cores.marca} size={20} />
              <Text style={[styles.itemTexto, { color: tema.cores.texto }]}>
                {texto}
              </Text>
            </View>
          ))}
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
  conteudo: { gap: 26, padding: 20, paddingBottom: 36 },
  introducao: { gap: 9, maxWidth: 560 },
  titulo: { fontSize: 22, fontWeight: "800", lineHeight: 28 },
  descricao: { fontSize: 15, lineHeight: 22 },
  lista: { borderBottomWidth: 1, borderTopWidth: 1 },
  item: {
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: 13,
    minHeight: 56,
    paddingHorizontal: 4,
  },
  itemTexto: { flex: 1, fontSize: 15, lineHeight: 21 },
});
