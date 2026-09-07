import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { ShieldCheck, UsersRound } from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { FriendRow } from "@/components/friends/friend-row";
import { FriendSection } from "@/components/friends/friend-section";
import { FriendsSearch } from "@/components/friends/friends-search";
import { FeedbackState } from "@/components/ui/feedback-state";
import { ScreenHeader } from "@/components/ui/screen-header";
import {
  useAceitarAmizade,
  useListaAmigos,
  useSolicitacoesAmizade,
} from "@/features/friends/hooks";
import { useIdioma } from "@/i18n/idioma";
import { useArmazenamentoAutenticacao } from "@/store/auth-store";
import { useTemaApp } from "@/theme/theme";

export default function TelaAmigos() {
  const tema = useTemaApp();
  const { traduzir } = useIdioma();
  const autenticado = useArmazenamentoAutenticacao(
    (armazenamento) => armazenamento.estado === "autenticado",
  );
  const userId = useArmazenamentoAutenticacao(
    (armazenamento) => armazenamento.usuario?.id,
  );
  const [erroAceite, setErroAceite] = useState<string>();
  const amigos = useListaAmigos(userId);
  const solicitacoes = useSolicitacoesAmizade(userId);
  const aceitar = useAceitarAmizade(userId);

  async function aceitarAmizade(requestId: string): Promise<void> {
    setErroAceite(undefined);
    try {
      await aceitar.mutateAsync(requestId);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      setErroAceite(traduzir("amigos.erroAceitar"));
    }
  }

  const carregando = amigos.isLoading || solicitacoes.isLoading;
  const erroInicial = amigos.isError || solicitacoes.isError;
  const atualizando = amigos.isRefetching || solicitacoes.isRefetching;

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[styles.tela, { backgroundColor: tema.cores.fundo }]}
    >
      <ScrollView
        contentContainerStyle={styles.conteudo}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          autenticado ? (
            <RefreshControl
              onRefresh={() => {
                void amigos.refetch();
                void solicitacoes.refetch();
              }}
              refreshing={atualizando}
              tintColor={tema.cores.marca}
            />
          ) : undefined
        }
      >
        <ScreenHeader
          subtitulo={autenticado ? traduzir("amigos.subtitulo") : undefined}
          titulo={traduzir("amigos.titulo")}
        />

        {!autenticado ? (
          <View style={styles.visitante}>
            <UsersRound color={tema.cores.marca} size={42} />
            <FeedbackState
              aoAgir={() => router.push("/login")}
              descricao={traduzir("amigos.visitanteDescricao")}
              rotuloAcao={traduzir("comum.entrar")}
              titulo={traduzir("amigos.vazioTitulo")}
            />
          </View>
        ) : carregando ? (
          <ActivityIndicator
            color={tema.cores.marca}
            size="large"
            style={styles.carregando}
          />
        ) : erroInicial ? (
          <FeedbackState
            aoAgir={() => {
              void amigos.refetch();
              void solicitacoes.refetch();
            }}
            descricao={traduzir("amigos.erroDescricao")}
            rotuloAcao={traduzir("comum.tentarNovamente")}
            tipo="erro"
            titulo={traduzir("amigos.erroTitulo")}
          />
        ) : (
          <>
            <FriendsSearch userId={userId} />

            {erroAceite ? (
              <Text
                accessibilityLiveRegion="polite"
                style={[styles.erro, { color: tema.cores.perigo }]}
              >
                {erroAceite}
              </Text>
            ) : null}

            {solicitacoes.data?.length ? (
              <FriendSection titulo={traduzir("amigos.solicitacoes")}>
                {solicitacoes.data.map((solicitacao) => (
                  <FriendRow
                    agindo={
                      aceitar.isPending && aceitar.variables === solicitacao.id
                    }
                    aoAgir={() => void aceitarAmizade(solicitacao.id)}
                    key={solicitacao.id}
                    rotuloAcao={traduzir("amigos.aceitar")}
                    rotuloOnline={traduzir("amigos.online")}
                    usuario={solicitacao.user}
                  />
                ))}
              </FriendSection>
            ) : null}

            <FriendSection titulo={traduzir("amigos.seusAmigos")}>
              {amigos.data?.length ? (
                amigos.data.map((amigo) => (
                  <FriendRow
                    key={amigo.id}
                    rotuloOnline={traduzir("amigos.online")}
                    usuario={amigo}
                  />
                ))
              ) : (
                <FeedbackState
                  descricao={traduzir("amigos.vazioDescricao")}
                  titulo={traduzir("amigos.vazioTitulo")}
                />
              )}
            </FriendSection>

            <View style={[styles.privacidade, { borderColor: tema.cores.borda }]}>
              <ShieldCheck color={tema.cores.sucesso} size={21} />
              <Text
                style={[styles.privacidadeTexto, { color: tema.cores.texto }]}
              >
                {traduzir("amigos.privacidade")}
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1 },
  conteudo: { gap: 24, padding: 20, paddingBottom: 36 },
  visitante: { gap: 20 },
  carregando: { marginTop: 42 },
  erro: { fontSize: 13, lineHeight: 18 },
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
