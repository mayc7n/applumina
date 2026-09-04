import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import {
  CircleAlert,
  CircleCheck,
  Languages,
  Monitor,
  ShieldCheck,
  Smartphone,
  X,
  type LucideIcon,
} from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppButton } from "@/components/ui/app-button";
import { FeedbackState } from "@/components/ui/feedback-state";
import { ScreenHeader } from "@/components/ui/screen-header";
import {
  chaveConsultaSessoes,
  ordenarSessoes,
} from "@/features/auth/sessions";
import { useIdioma } from "@/i18n/idioma";
import { obterMensagemErroApi } from "@/lib/api/errors";
import { apiSessoes } from "@/lib/api/resources";
import { useArmazenamentoAutenticacao } from "@/store/auth-store";
import { useTemaApp } from "@/theme/theme";
import type { UserSession } from "@/types/api";

export default function TelaConta() {
  const tema = useTemaApp();
  const { idioma, traduzir } = useIdioma();
  const clienteConsulta = useQueryClient();
  const [avisoSessao, definirAvisoSessao] = useState<{
    texto: string;
    erro: boolean;
  } | null>(null);
  const usuario = useArmazenamentoAutenticacao(
    (armazenamento) => armazenamento.usuario,
  );
  const sair = useArmazenamentoAutenticacao(
    (armazenamento) => armazenamento.sair,
  );
  const autenticado = useArmazenamentoAutenticacao(
    (armazenamento) => armazenamento.estado === "autenticado",
  );
  const chaveSessoes = chaveConsultaSessoes(usuario?.id);
  const consultaSessoes = useQuery({
    queryKey: chaveSessoes,
    queryFn: apiSessoes.listar,
    enabled: autenticado,
  });
  const encerrarUmaSessao = useMutation({
    mutationFn: apiSessoes.encerrar,
    onMutate: () => definirAvisoSessao(null),
    onSuccess: async () => {
      definirAvisoSessao({
        texto: traduzir("conta.sessaoEncerrada"),
        erro: false,
      });
      await clienteConsulta.invalidateQueries({ queryKey: chaveSessoes });
    },
    onError: (erro) =>
      definirAvisoSessao({
        texto: obterMensagemErroApi(
          erro,
          traduzir("conta.sessoesErroAcao"),
          false,
        ),
        erro: true,
      }),
  });
  const encerrarOutrasSessoes = useMutation({
    mutationFn: apiSessoes.encerrarOutras,
    onMutate: () => definirAvisoSessao(null),
    onSuccess: async () => {
      definirAvisoSessao({
        texto: traduzir("conta.sessoesEncerradas"),
        erro: false,
      });
      await clienteConsulta.invalidateQueries({ queryKey: chaveSessoes });
    },
    onError: (erro) =>
      definirAvisoSessao({
        texto: obterMensagemErroApi(
          erro,
          traduzir("conta.sessoesErroAcao"),
          false,
        ),
        erro: true,
      }),
  });

  if (!autenticado) {
    return (
      <SafeAreaView
        edges={["top", "left", "right"]}
        style={[styles.tela, { backgroundColor: tema.cores.fundo }]}
      >
        <ScrollView contentContainerStyle={styles.conteudo}>
          <ScreenHeader titulo={traduzir("conta.titulo")} />
          <View
            style={[
              styles.visitante,
              {
                backgroundColor: tema.cores.marcaSuave,
                borderColor: tema.cores.marcaContorno,
              },
            ]}
          >
            <Text style={[styles.nome, { color: tema.cores.texto }]}>
              {traduzir("conta.visitanteTitulo")}
            </Text>
            <Text
              style={[styles.descricaoCartao, { color: tema.cores.textoSecundario }]}
            >
              {traduzir("conta.visitanteDescricao")}
            </Text>
          </View>
          <AppButton
            onPress={() => router.push("/login")}
            rotulo={traduzir("comum.entrar")}
          />
          <AppButton
            onPress={() => router.push("/register")}
            rotulo={traduzir("comum.criarConta")}
            variante="secondary"
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  function confirmarSaida(): void {
    Alert.alert(
      traduzir("conta.confirmarTitulo"),
      traduzir("conta.confirmarDescricao"),
      [
        { text: traduzir("conta.cancelar"), style: "cancel" },
        {
          text: traduzir("conta.confirmar"),
          style: "destructive",
          onPress: () => {
            void sair().finally(() => {
              clienteConsulta.clear();
              router.replace("/login");
            });
          },
        },
      ],
    );
  }

  function confirmarEncerramento(sessao: UserSession): void {
    const aparelho = sessao.deviceName ?? traduzir("conta.aparelhosTitulo");
    Alert.alert(
      traduzir("conta.encerrarUmaTitulo"),
      traduzir("conta.encerrarUmaDescricao", { aparelho }),
      [
        { text: traduzir("conta.cancelar"), style: "cancel" },
        {
          text: traduzir("conta.confirmar"),
          style: "destructive",
          onPress: () => encerrarUmaSessao.mutate(sessao.id),
        },
      ],
    );
  }

  function confirmarEncerramentoDasOutras(): void {
    Alert.alert(
      traduzir("conta.encerrarOutrasTitulo"),
      traduzir("conta.encerrarOutrasDescricao"),
      [
        { text: traduzir("conta.cancelar"), style: "cancel" },
        {
          text: traduzir("conta.confirmar"),
          style: "destructive",
          onPress: () => encerrarOutrasSessoes.mutate(),
        },
      ],
    );
  }

  const sessoes = ordenarSessoes(consultaSessoes.data ?? []);
  const possuiOutraSessao = sessoes.some((sessao) => !sessao.current);
  const alterandoSessoes =
    encerrarUmaSessao.isPending || encerrarOutrasSessoes.isPending;

  return (
    <SafeAreaView
      style={[styles.tela, { backgroundColor: tema.cores.fundo }]}
      edges={["top", "left", "right"]}
    >
      <ScrollView contentContainerStyle={styles.conteudo}>
        <ScreenHeader titulo={traduzir("conta.titulo")} />
        <View
          style={[
            styles.perfil,
            {
              backgroundColor: tema.cores.elevado,
              borderColor: tema.cores.borda,
            },
          ]}
        >
          <View
            style={[styles.avatar, { backgroundColor: tema.cores.marcaSuave }]}
          >
            <Text style={[styles.inicial, { color: tema.cores.marca }]}>
              {usuario?.displayName?.trim().charAt(0).toUpperCase() ?? "L"}
            </Text>
          </View>
          <View style={styles.dadosPerfil}>
            <Text style={[styles.nome, { color: tema.cores.texto }]}>
              {usuario?.displayName}
            </Text>
            <Text style={[styles.email, { color: tema.cores.textoSecundario }]}>
              {usuario?.email}
            </Text>
            <Text style={[styles.plano, { color: tema.cores.marca }]}>
              {traduzir("conta.plano", { plano: usuario?.plan ?? "FREE" })}
            </Text>
          </View>
        </View>

        <View style={styles.secaoSessoes}>
          <View style={styles.cabecalhoSecao}>
            <View style={[styles.icone, { backgroundColor: tema.cores.marcaSuave }]}>
              <ShieldCheck color={tema.cores.marca} size={21} />
            </View>
            <View style={styles.textoCartao}>
              <Text style={[styles.tituloSecao, { color: tema.cores.texto }]}>
                {traduzir("conta.aparelhosTitulo")}
              </Text>
              <Text style={[styles.descricaoCartao, { color: tema.cores.textoSecundario }]}>
                {traduzir("conta.aparelhosDescricao")}
              </Text>
            </View>
          </View>

          {consultaSessoes.isPending ? (
            <View
              accessibilityLabel={traduzir("comum.preparando")}
              accessibilityRole="progressbar"
              style={styles.carregandoSessoes}
            >
              <ActivityIndicator color={tema.cores.marca} />
            </View>
          ) : consultaSessoes.isError ? (
            <FeedbackState
              tipo="erro"
              titulo={traduzir("conta.sessoesErroTitulo")}
              descricao={traduzir("conta.sessoesErroDescricao")}
              rotuloAcao={traduzir("comum.tentarNovamente")}
              aoAgir={() => void consultaSessoes.refetch()}
            />
          ) : (
            <View
              style={[styles.listaSessoes, { borderColor: tema.cores.borda }]}
            >
              {sessoes.map((sessao, indice) => (
                <SessaoConectada
                  key={sessao.id}
                  sessao={sessao}
                  separador={indice > 0}
                  desabilitada={alterandoSessoes}
                  formatarData={(data) =>
                    new Intl.DateTimeFormat(idioma, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(data))
                  }
                  aoEncerrar={() => confirmarEncerramento(sessao)}
                />
              ))}
              {!possuiOutraSessao ? (
                <Text style={[styles.semOutras, { color: tema.cores.textoSecundario }]}>
                  {traduzir("conta.nenhumaOutraSessao")}
                </Text>
              ) : null}
            </View>
          )}

          {avisoSessao ? (
            <View
              accessibilityLiveRegion="polite"
              style={styles.avisoSessao}
            >
              {avisoSessao.erro ? (
                <CircleAlert color={tema.cores.perigo} size={18} />
              ) : (
                <CircleCheck color={tema.cores.sucesso} size={18} />
              )}
              <Text
                style={[
                  styles.mensagemSessao,
                  {
                    color: avisoSessao.erro
                      ? tema.cores.perigo
                      : tema.cores.textoSecundario,
                  },
                ]}
              >
                {avisoSessao.texto}
              </Text>
            </View>
          ) : null}
          {possuiOutraSessao ? (
            <AppButton
              rotulo={traduzir("conta.encerrarOutras")}
              variante="secondary"
              carregando={encerrarOutrasSessoes.isPending}
              disabled={alterandoSessoes}
              onPress={confirmarEncerramentoDasOutras}
            />
          ) : null}
        </View>
        <CartaoInformativo
          Icone={Languages}
          titulo={traduzir("conta.idiomaTitulo")}
          descricao={traduzir("conta.idiomaSistema")}
        />
        <View style={styles.zonaPrivacidade}>
          <Text style={[styles.tituloSecao, { color: tema.cores.texto }]}>
            {traduzir("conta.privacidadeTitulo")}
          </Text>
          <AppButton
            rotulo={traduzir("conta.excluirConta")}
            variante="danger"
            onPress={() => router.push("/delete-account")}
          />
        </View>
        <AppButton
          rotulo={traduzir("conta.sair")}
          variante="secondary"
          onPress={confirmarSaida}
          accessibilityHint={traduzir("conta.confirmarDescricao")}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function SessaoConectada({
  sessao,
  separador,
  desabilitada,
  formatarData,
  aoEncerrar,
}: {
  sessao: UserSession;
  separador: boolean;
  desabilitada: boolean;
  formatarData: (data: string) => string;
  aoEncerrar: () => void;
}) {
  const tema = useTemaApp();
  const { traduzir } = useIdioma();
  const Icone = sessao.deviceType === "WEB" ? Monitor : Smartphone;
  const aparelho = sessao.deviceName ?? traduzir("conta.aparelhosTitulo");

  return (
    <View
      style={[
        styles.linhaSessao,
        separador && { borderColor: tema.cores.borda, borderTopWidth: 1 },
      ]}
    >
      <Icone color={tema.cores.textoSecundario} size={21} />
      <View style={styles.dadosSessao}>
        <Text style={[styles.nomeAparelho, { color: tema.cores.texto }]}>
          {aparelho}
        </Text>
        {sessao.current ? (
          <Text style={[styles.atual, { color: tema.cores.sucesso }]}>
            {traduzir("conta.aparelhoAtual")}
          </Text>
        ) : null}
        <Text style={[styles.atividadeSessao, { color: tema.cores.textoSecundario }]}>
          {traduzir("conta.ultimaAtividade", {
            data: formatarData(sessao.lastUsedAt),
          })}
        </Text>
      </View>
      {!sessao.current ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={traduzir("conta.encerrarAparelho", { aparelho })}
          accessibilityState={{ disabled: desabilitada }}
          disabled={desabilitada}
          hitSlop={8}
          onPress={aoEncerrar}
          style={({ pressed }) => [
            styles.encerrarSessao,
            {
              backgroundColor: pressed
                ? tema.cores.perigoSuave
                : "transparent",
              opacity: desabilitada ? 0.45 : 1,
            },
          ]}
        >
          <X color={tema.cores.perigo} size={20} />
        </Pressable>
      ) : null}
    </View>
  );
}

function CartaoInformativo({
  Icone,
  titulo,
  descricao,
}: {
  Icone: LucideIcon;
  titulo: string;
  descricao: string;
}) {
  const tema = useTemaApp();
  return (
    <View
      style={[
        styles.cartao,
        { backgroundColor: tema.cores.elevado, borderColor: tema.cores.borda },
      ]}
    >
      <View style={[styles.icone, { backgroundColor: tema.cores.marcaSuave }]}>
        <Icone color={tema.cores.marca} size={21} />
      </View>
      <View style={styles.textoCartao}>
        <Text style={[styles.tituloCartao, { color: tema.cores.texto }]}>
          {titulo}
        </Text>
        <Text
          style={[
            styles.descricaoCartao,
            { color: tema.cores.textoSecundario },
          ]}
        >
          {descricao}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1 },
  conteudo: {
    gap: 14,
    paddingBottom: 32,
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  perfil: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: 14,
    marginBottom: 8,
    padding: 18,
  },
  visitante: {
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
    padding: 20,
  },
  avatar: {
    alignItems: "center",
    borderRadius: 28,
    height: 56,
    justifyContent: "center",
    width: 56,
  },
  inicial: { fontSize: 23, fontWeight: "800" },
  dadosPerfil: { flex: 1, gap: 3 },
  nome: { fontSize: 17, fontWeight: "700" },
  email: { fontSize: 13 },
  plano: { fontSize: 11, fontWeight: "800", marginTop: 3 },
  cartao: {
    alignItems: "flex-start",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: 13,
    padding: 16,
  },
  icone: {
    alignItems: "center",
    borderRadius: 11,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  textoCartao: { flex: 1, gap: 4 },
  tituloCartao: { fontSize: 15, fontWeight: "700" },
  descricaoCartao: { fontSize: 13, lineHeight: 19 },
  secaoSessoes: { gap: 13, marginVertical: 4 },
  cabecalhoSecao: { alignItems: "flex-start", flexDirection: "row", gap: 13 },
  tituloSecao: { fontSize: 18, fontWeight: "700" },
  carregandoSessoes: { alignItems: "center", minHeight: 72, justifyContent: "center" },
  listaSessoes: { borderBottomWidth: 1, borderTopWidth: 1 },
  linhaSessao: { alignItems: "center", flexDirection: "row", gap: 12, minHeight: 72, paddingVertical: 12 },
  dadosSessao: { flex: 1, gap: 2 },
  nomeAparelho: { fontSize: 15, fontWeight: "700" },
  atual: { fontSize: 13, fontWeight: "700" },
  atividadeSessao: { fontSize: 13, lineHeight: 18 },
  encerrarSessao: { alignItems: "center", borderRadius: 12, height: 44, justifyContent: "center", width: 44 },
  semOutras: { fontSize: 13, lineHeight: 19, paddingVertical: 13 },
  avisoSessao: { alignItems: "center", flexDirection: "row", gap: 8 },
  mensagemSessao: { flex: 1, fontSize: 13, lineHeight: 19 },
  zonaPrivacidade: { gap: 12, marginTop: 8 },
});
