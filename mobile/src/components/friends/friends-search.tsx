import * as Haptics from "expo-haptics";
import { Search } from "lucide-react-native";
import { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { FriendRow } from "@/components/friends/friend-row";
import { FriendSection } from "@/components/friends/friend-section";
import { AppButton } from "@/components/ui/app-button";
import { FeedbackState } from "@/components/ui/feedback-state";
import { FormField } from "@/components/ui/form-field";
import {
  useBuscarAmigos,
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
      AGUARDAR: traduzir("amigos.pendente"),
      RESPONDER: traduzir("amigos.recebida"),
      NENHUMA: traduzir("amigos.jaAmigos"),
    };
    return (
      <FriendRow
        acaoDesabilitada={acao !== "ADICIONAR"}
        agindo={solicitar.isPending && solicitar.variables === usuario.id}
        aoAgir={
          acao === "ADICIONAR"
            ? () => void solicitarAmizade(usuario.id)
            : undefined
        }
        key={usuario.id}
        rotuloAcao={rotulos[acao]}
        rotuloOnline={traduzir("amigos.online")}
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
