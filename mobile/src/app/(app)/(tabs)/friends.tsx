import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { Ban, ShieldCheck } from "lucide-react-native";
import { useState } from "react";
import {
  Alert,
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { FriendRow } from "@/components/friends/friend-row";
import { FriendSection } from "@/components/friends/friend-section";
import { FriendsSearch } from "@/components/friends/friends-search";
import { SocialFeedCard } from "@/components/friends/social-feed-card";
import { FeedbackState } from "@/components/ui/feedback-state";
import { AnimatedEntry } from "@/components/ui/animated-entry";
import { ScreenHeader } from "@/components/ui/screen-header";
import {
  useAceitarAmizade,
  useCurtirPost,
  useFeedSocial,
  useListaAmigos,
  useRejeitarSolicitacaoAmizade,
  useRemoverAmizade,
  useSolicitacoesAmizade,
} from "@/features/friends/hooks";
import { useIdioma } from "@/i18n/idioma";
import { useArmazenamentoAutenticacao } from "@/store/auth-store";
import { useTemaApp } from "@/theme/theme";
import type { SocialFeedItem } from "@/types/api";

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
  const feed = useFeedSocial(userId);
  const solicitacoes = useSolicitacoesAmizade(userId);
  const aceitar = useAceitarAmizade(userId);
  const rejeitar = useRejeitarSolicitacaoAmizade(userId);
  const remover = useRemoverAmizade(userId);
  const curtirPost = useCurtirPost(userId);

  async function aceitarAmizade(requestId: string): Promise<void> {
    setErroAceite(undefined);
    try {
      await aceitar.mutateAsync(requestId);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      setErroAceite(traduzir("amigos.erroAceitar"));
    }
  }

  async function desfazerVinculo(
    acao: "REJEITAR" | "REMOVER",
    id: string,
  ): Promise<void> {
    setErroAceite(undefined);
    try {
      await (acao === "REJEITAR" ? rejeitar : remover).mutateAsync(id);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      setErroAceite(
        traduzir(
          acao === "REJEITAR" ? "amigos.erroRejeitar" : "amigos.erroRemover",
        ),
      );
    }
  }

  function confirmarDesfazer(
    acao: "REJEITAR" | "REMOVER",
    id: string,
  ): void {
    Alert.alert(
      traduzir(
        acao === "REJEITAR"
          ? "amigos.confirmarRejeicaoTitulo"
          : "amigos.confirmarRemocaoTitulo",
      ),
      traduzir(
        acao === "REJEITAR"
          ? "amigos.confirmarRejeicaoDescricao"
          : "amigos.confirmarRemocaoDescricao",
      ),
      [
        { text: traduzir("amigos.voltar"), style: "cancel" },
        {
          text: traduzir(
            acao === "REJEITAR" ? "amigos.rejeitar" : "amigos.remover",
          ),
          style: "destructive",
          onPress: () => void desfazerVinculo(acao, id),
        },
      ],
    );
  }

  const carregando = amigos.isLoading || solicitacoes.isLoading;
  const erroInicial = amigos.isError || solicitacoes.isError;
  const atualizando = amigos.isRefetching || solicitacoes.isRefetching || feed.isRefetching;
  const feedItems = feed.data ?? [];

  function alternarCurtida(item: SocialFeedItem): void {
    curtirPost.mutate({ postId: item.id, liked: !item.liked });
  }

  const cabecalho = !autenticado ? (
    <>
      <ScreenHeader titulo={traduzir("amigos.titulo")} />
      <AnimatedEntry>
        <FeedbackState
          aoAgir={() => router.push("/login")}
          descricao={traduzir("amigos.visitanteDescricao")}
          rotuloAcao={traduzir("comum.entrar")}
          titulo={traduzir("amigos.vazioTitulo")}
        />
      </AnimatedEntry>
    </>
  ) : carregando ? (
    <>
      <ScreenHeader
        acao={acaoBloqueados(tema, traduzir)}
        subtitulo={traduzir("amigos.subtitulo")}
        titulo={traduzir("amigos.titulo")}
      />
      <ActivityIndicator
        color={tema.cores.marca}
        size="large"
        style={styles.carregando}
      />
    </>
  ) : erroInicial ? (
    <>
      <ScreenHeader
        acao={acaoBloqueados(tema, traduzir)}
        subtitulo={traduzir("amigos.subtitulo")}
        titulo={traduzir("amigos.titulo")}
      />
      <FeedbackState
        aoAgir={() => {
          void amigos.refetch();
          void solicitacoes.refetch();
          void feed.refetch();
        }}
        descricao={traduzir("amigos.erroDescricao")}
        rotuloAcao={traduzir("comum.tentarNovamente")}
        tipo="erro"
        titulo={traduzir("amigos.erroTitulo")}
      />
    </>
  ) : (
    <>
      <ScreenHeader
        acao={acaoBloqueados(tema, traduzir)}
        subtitulo={traduzir("amigos.subtitulo")}
        titulo={traduzir("amigos.titulo")}
      />
      <FriendsSearch userId={userId} />
      {curtirPost.isError ? (
        <Text
          accessibilityLiveRegion="polite"
          style={[styles.erro, { color: tema.cores.perigo }]}
        >
          {traduzir("amigos.feedErroCurtida")}
        </Text>
      ) : null}
      <FriendSection titulo={traduzir("amigos.feedTitulo")}>
        {feed.isLoading ? (
          <ActivityIndicator color={tema.cores.marca} />
        ) : feed.isError ? (
          <FeedbackState
            aoAgir={() => void feed.refetch()}
            descricao={traduzir("amigos.feedErroDescricao")}
            rotuloAcao={traduzir("comum.tentarNovamente")}
            tipo="erro"
            titulo={traduzir("amigos.feedErroTitulo")}
          />
        ) : feedItems.length === 0 ? (
          <FeedbackState
            descricao={traduzir("amigos.feedVazioDescricao")}
            titulo={traduzir("amigos.feedVazioTitulo")}
          />
        ) : null}
      </FriendSection>
    </>
  );

  const rodape = !autenticado || carregando || erroInicial ? null : (
    <>
      {erroAceite ? (
        <Text
          accessibilityLiveRegion="polite"
          style={[styles.erro, { color: tema.cores.perigo }]}
        >
          {erroAceite}
        </Text>
      ) : null}

      {solicitacoes.data?.length ? (
        <AnimatedEntry>
          <View
            style={[
              styles.solicitacoes,
              { backgroundColor: tema.cores.marcaSuave, borderColor: tema.cores.marcaContorno },
            ]}
          >
            <FriendSection titulo={traduzir("amigos.solicitacoes")}>
              {solicitacoes.data.map((solicitacao, indice) => (
                <AnimatedEntry atraso={Math.min(indice, 6) * 35} key={solicitacao.id}>
                  <FriendRow
                    acaoPrincipal
                    acoesDesabilitadas={
                      (aceitar.isPending && aceitar.variables === solicitacao.id) ||
                      (rejeitar.isPending && rejeitar.variables === solicitacao.id)
                    }
                    agindo={aceitar.isPending && aceitar.variables === solicitacao.id}
                    agindoSecundariamente={
                      rejeitar.isPending && rejeitar.variables === solicitacao.id
                    }
                    aoAgir={() => void aceitarAmizade(solicitacao.id)}
                    aoAgirSecundariamente={() =>
                      confirmarDesfazer("REJEITAR", solicitacao.id)
                    }
                    rotuloAcao={traduzir("amigos.aceitar")}
                    rotuloAcaoSecundaria={traduzir("amigos.rejeitar")}
                    rotuloOnline={traduzir("amigos.online")}
                    usuario={solicitacao.user}
                  />
                </AnimatedEntry>
              ))}
            </FriendSection>
          </View>
        </AnimatedEntry>
      ) : null}

      <FriendSection titulo={traduzir("amigos.seusAmigos")}>
        {amigos.data?.length ? (
          amigos.data.map((amigo, indice) => (
            <AnimatedEntry atraso={Math.min(indice, 6) * 35} key={amigo.id}>
              <FriendRow
                acoesDesabilitadas={remover.isPending && remover.variables === amigo.id}
                agindo={remover.isPending && remover.variables === amigo.id}
                aoAbrirSeguranca={() =>
                  router.push({
                    pathname: "/friends/safety/[id]",
                    params: {
                      id: amigo.id,
                      displayName: amigo.displayName,
                      username: amigo.username,
                    },
                  })
                }
                aoAgir={() => confirmarDesfazer("REMOVER", amigo.id)}
                rotuloAcao={traduzir("amigos.remover")}
                rotuloOnline={traduzir("amigos.online")}
                rotuloSeguranca={traduzir("amigos.seguranca")}
                usuario={amigo}
              />
            </AnimatedEntry>
          ))
        ) : (
          <FeedbackState
            descricao={traduzir("amigos.vazioDescricao")}
            titulo={traduzir("amigos.vazioTitulo")}
          />
        )}
      </FriendSection>

      <View
        style={[
          styles.privacidade,
          { backgroundColor: tema.cores.sucessoSuave, borderColor: tema.cores.sucesso },
        ]}
      >
        <ShieldCheck color={tema.cores.sucesso} size={21} />
        <Text style={[styles.privacidadeTexto, { color: tema.cores.texto }]}>
          {traduzir("amigos.privacidade")}
        </Text>
      </View>
    </>
  );

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[styles.tela, { backgroundColor: tema.cores.fundo }]}
    >
      <FlatList<SocialFeedItem>
        data={!autenticado || carregando || erroInicial ? [] : feedItems}
        initialNumToRender={8}
        ItemSeparatorComponent={() => <View style={styles.feedSeparador} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.conteudo}
        keyboardShouldPersistTaps="handled"
        ListFooterComponent={rodape}
        ListHeaderComponent={cabecalho}
        maxToRenderPerBatch={8}
        onEndReachedThreshold={0.5}
        removeClippedSubviews
        refreshControl={
          autenticado ? (
            <RefreshControl
              onRefresh={() => {
                void amigos.refetch();
                void solicitacoes.refetch();
                void feed.refetch();
              }}
              refreshing={atualizando}
              tintColor={tema.cores.marca}
            />
          ) : undefined
        }
        renderItem={({ item, index }) => (
          <AnimatedEntry atraso={Math.min(index, 6) * 35}>
            <SocialFeedCard
              aoAlternarCurtida={() => alternarCurtida(item)}
              curtidaDesabilitada={
                curtirPost.isPending && curtirPost.variables?.postId === item.id
              }
              item={item}
              rotuloAcaoCurtida={traduzir(
                item.liked ? "amigos.feedDescurtir" : "amigos.feedCurtir",
              )}
              rotuloCurtidas={traduzir("amigos.feedCurtidas", { quantidade: item.likeCount })}
              rotuloOnline={traduzir("amigos.online")}
              rotuloTipo={item.type === "WORKOUT" ? traduzir("amigos.feedTreino") : traduzir("amigos.feedAtualizacao")}
            />
          </AnimatedEntry>
        )}
        windowSize={7}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1 },
  conteudo: { gap: 24, padding: 20, paddingBottom: 36 },
  feedSeparador: { height: 10 },
  bloqueados: { alignItems: "center", borderRadius: 22, height: 44, justifyContent: "center", width: 44 },
  carregando: { marginTop: 42 },
  erro: { fontSize: 13, lineHeight: 18 },
  solicitacoes: { borderRadius: 22, borderWidth: 1, padding: 14 },
  privacidade: {
    alignItems: "flex-start",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: 16,
  },
  privacidadeTexto: { flex: 1, fontSize: 14, lineHeight: 20 },
});

function acaoBloqueados(
  tema: ReturnType<typeof useTemaApp>,
  traduzir: (chave: "amigos.bloqueados") => string,
) {
  return (
    <Pressable
      accessibilityLabel={traduzir("amigos.bloqueados")}
      accessibilityRole="button"
      onPress={() => router.push("/friends/blocked")}
      style={({ pressed }) => [
        styles.bloqueados,
        { backgroundColor: pressed ? tema.cores.borda : tema.cores.sobreposicao },
      ]}
    >
      <Ban color={tema.cores.textoSecundario} size={20} />
    </Pressable>
  );
}
