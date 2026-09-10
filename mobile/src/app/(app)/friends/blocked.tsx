import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { ChevronLeft } from "lucide-react-native";
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { FriendRow } from "@/components/friends/friend-row";
import { FeedbackState } from "@/components/ui/feedback-state";
import { ScreenHeader } from "@/components/ui/screen-header";
import { useDesbloquearUsuario, useListaBloqueados } from "@/features/friends/hooks";
import { useIdioma } from "@/i18n/idioma";
import { useArmazenamentoAutenticacao } from "@/store/auth-store";
import { useTemaApp } from "@/theme/theme";

export default function TelaUsuariosBloqueados() {
  const tema = useTemaApp();
  const { traduzir } = useIdioma();
  const userId = useArmazenamentoAutenticacao(
    (armazenamento) => armazenamento.usuario?.id,
  );
  const bloqueados = useListaBloqueados(userId);
  const desbloquear = useDesbloquearUsuario(userId);
  const [erroAcao, setErroAcao] = useState<string>();

  async function desbloquearUsuario(id: string): Promise<void> {
    setErroAcao(undefined);
    try {
      await desbloquear.mutateAsync(id);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      setErroAcao(traduzir("amigos.erroDesbloquear"));
    }
  }

  return (
    <SafeAreaView style={[styles.tela, { backgroundColor: tema.cores.fundo }]}>
      <ScrollView contentContainerStyle={styles.conteudo}>
        <ScreenHeader
          inicio={
            <Pressable
              accessibilityLabel={traduzir("amigos.voltarAmigos")}
              accessibilityRole="button"
              onPress={() => router.back()}
              style={({ pressed }) => [
                styles.voltar,
                { backgroundColor: pressed ? tema.cores.borda : tema.cores.sobreposicao },
              ]}
            >
              <ChevronLeft color={tema.cores.texto} size={24} />
            </Pressable>
          }
          subtitulo={traduzir("amigos.bloqueadosDescricao")}
          titulo={traduzir("amigos.bloqueadosTitulo")}
        />
        {erroAcao ? (
          <Text accessibilityLiveRegion="polite" style={{ color: tema.cores.perigo }}>
            {erroAcao}
          </Text>
        ) : null}
        {bloqueados.isLoading ? (
          <ActivityIndicator color={tema.cores.marca} size="large" />
        ) : bloqueados.isError ? (
          <FeedbackState
            aoAgir={() => void bloqueados.refetch()}
            descricao={traduzir("amigos.erroBloqueadosDescricao")}
            rotuloAcao={traduzir("comum.tentarNovamente")}
            tipo="erro"
            titulo={traduzir("amigos.erroBloqueadosTitulo")}
          />
        ) : bloqueados.data?.length ? (
          <View>
            {bloqueados.data.map((usuario) => (
              <FriendRow
                agindo={desbloquear.isPending && desbloquear.variables === usuario.id}
                aoAgir={() => void desbloquearUsuario(usuario.id)}
                key={usuario.id}
                rotuloAcao={traduzir("amigos.desbloquear")}
                rotuloOnline={traduzir("amigos.online")}
                usuario={usuario}
              />
            ))}
          </View>
        ) : (
          <Text style={{ color: tema.cores.textoSecundario }}>
            {traduzir("amigos.semBloqueados")}
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1 },
  conteudo: { gap: 24, padding: 20, paddingBottom: 40 },
  voltar: {
    alignItems: "center",
    borderRadius: 22,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
});
