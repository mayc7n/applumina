import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { Search } from "lucide-react-native";
import { useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, View } from "react-native";

import { FriendRow } from "@/components/friends/friend-row";
import { FriendSection } from "@/components/friends/friend-section";
import { AppButton } from "@/components/ui/app-button";
import { FeedbackState } from "@/components/ui/feedback-state";
import { FormField } from "@/components/ui/form-field";
import {
  useBuscarAmigos,
  useCancelarSolicitacaoAmizade,
  useRemoverAmizade,
  useSolicitarAmizade,
} from "@/features/friends/hooks";
import {
  acaoDisponivelAmigo,
  prepararBuscaAmigos,
} from "@/features/friends/friend-search";
import { ehConflitoSolicitacaoAmizade } from "@/features/friends/friend-conflict";
import { useIdioma } from "@/i18n/idioma";
import { useTemaApp } from "@/theme/theme";
import type { SocialUser } from "@/types/api";

interface FriendsSearchProps {
  userId?: string;
}

export function FriendsSearch({ userId }: FriendsSearchProps) {
  const tema = useTemaApp();
  const { traduzir } = useIdioma();
  const [buscaDigitada, setBuscaDigitada] = useState("");
  const [buscaAtiva, setBuscaAtiva] = useState("");
  const [erroBusca, setErroBusca] = useState<string>();
  const [erroAcao, setErroAcao] = useState<string>();
  const resultados = useBuscarAmigos(buscaAtiva, userId);
  const solicitar = useSolicitarAmizade(userId);
  const cancelar = useCancelarSolicitacaoAmizade(userId);
  const remover = useRemoverAmizade(userId);

  function buscar(): void {
    const busca = prepararBuscaAmigos(buscaDigitada);
    if (!busca) {
      setErroBusca(traduzir("amigos.buscaMinima"));
      return;
    }
    setErroBusca(undefined);
    if (busca === buscaAtiva) void resultados.refetch();
    else setBuscaAtiva(busca);
  }

  async function desfazerVinculo(
    acao: "CANCELAR" | "REMOVER",
    friendId: string,
  ): Promise<void> {
    setErroAcao(undefined);
    try {
      await (acao === "CANCELAR" ? cancelar : remover).mutateAsync(friendId);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      setErroAcao(
        traduzir(
          acao === "CANCELAR"
            ? "amigos.erroCancelar"
            : "amigos.erroRemover",
        ),
      );
    }
  }

  function confirmarDesfazer(
    acao: "CANCELAR" | "REMOVER",
    friendId: string,
  ): void {
    Alert.alert(
      traduzir(
        acao === "CANCELAR"
          ? "amigos.confirmarCancelamentoTitulo"
          : "amigos.confirmarRemocaoTitulo",
      ),
      traduzir(
        acao === "CANCELAR"
          ? "amigos.confirmarCancelamentoDescricao"
          : "amigos.confirmarRemocaoDescricao",
      ),
      [
        { text: traduzir("amigos.voltar"), style: "cancel" },
        {
          text: traduzir(
            acao === "CANCELAR" ? "amigos.cancelar" : "amigos.remover",
          ),
          style: "destructive",
          onPress: () => void desfazerVinculo(acao, friendId),
        },
      ],
    );
  }

  async function solicitarAmizade(userId: string): Promise<void> {
    setErroAcao(undefined);
    try {
      await solicitar.mutateAsync(userId);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (erro) {
      setErroAcao(
        traduzir(
          ehConflitoSolicitacaoAmizade(erro)
            ? "amigos.solicitacaoExistente"
            : "amigos.erroSolicitar",
        ),
      );
    }
  }

  function resultadoBusca(usuario: SocialUser) {
    const acao = acaoDisponivelAmigo(usuario.friendshipStatus);
    const rotulos = {
      ADICIONAR: traduzir("amigos.adicionar"),
      CANCELAR: traduzir("amigos.cancelar"),
      RESPONDER: traduzir("amigos.recebida"),
      REMOVER: traduzir("amigos.remover"),
    };
    return (
      <FriendRow
        acoesDesabilitadas={
          (solicitar.isPending && solicitar.variables === usuario.id) ||
          (cancelar.isPending && cancelar.variables === usuario.id) ||
          (remover.isPending && remover.variables === usuario.id)
        }
        acaoDesabilitada={acao === "RESPONDER"}
        agindo={
          (solicitar.isPending && solicitar.variables === usuario.id) ||
          (cancelar.isPending && cancelar.variables === usuario.id) ||
          (remover.isPending && remover.variables === usuario.id)
        }
        aoAgir={
          acao === "ADICIONAR"
            ? () => void solicitarAmizade(usuario.id)
            : acao === "CANCELAR" || acao === "REMOVER"
              ? () => confirmarDesfazer(acao, usuario.id)
            : undefined
        }
        key={usuario.id}
        aoAbrirSeguranca={() =>
          router.push({
            pathname: "/friends/safety/[id]",
            params: {
              id: usuario.id,
              displayName: usuario.displayName,
              username: usuario.username,
            },
          })
        }
        rotuloAcao={rotulos[acao]}
        rotuloOnline={traduzir("amigos.online")}
        rotuloSeguranca={traduzir("amigos.seguranca")}
        usuario={usuario}
      />
    );
  }

  return (
    <View style={styles.conteudo}>
      <View style={styles.busca}>
        <FormField
          autoCapitalize="none"
          autoCorrect={false}
          erro={erroBusca}
          inicio={<Search color={tema.cores.textoSutil} size={19} />}
          onChangeText={setBuscaDigitada}
          onSubmitEditing={buscar}
          placeholder={traduzir("amigos.buscaPlaceholder")}
          returnKeyType="search"
          rotulo={traduzir("amigos.buscarPessoas")}
          value={buscaDigitada}
        />
        <AppButton
          onPress={buscar}
          rotulo={traduzir("amigos.buscar")}
          variante="secondary"
        />
      </View>

      {erroAcao ? (
        <Text
          accessibilityLiveRegion="polite"
          style={[styles.erro, { color: tema.cores.perigo }]}
        >
          {erroAcao}
        </Text>
      ) : null}

      {buscaAtiva ? (
        <FriendSection titulo={traduzir("amigos.resultados")}>
          {resultados.isLoading ? (
            <ActivityIndicator color={tema.cores.marca} />
          ) : resultados.isError ? (
            <FeedbackState
              aoAgir={() => void resultados.refetch()}
              descricao={traduzir("amigos.erroBuscaDescricao")}
              rotuloAcao={traduzir("comum.tentarNovamente")}
              tipo="erro"
              titulo={traduzir("amigos.erroBuscaTitulo")}
            />
          ) : resultados.data?.length ? (
            resultados.data.map(resultadoBusca)
          ) : (
            <Text style={{ color: tema.cores.textoSecundario }}>
              {traduzir("amigos.semResultados")}
            </Text>
          )}
        </FriendSection>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  conteudo: { gap: 24 },
  busca: { gap: 10 },
  erro: { fontSize: 13, lineHeight: 18 },
});
