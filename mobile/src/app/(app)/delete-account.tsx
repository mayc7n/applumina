import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { ArrowLeft, Eye, EyeOff, LockKeyhole, Mail, ShieldAlert } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppButton } from "@/components/ui/app-button";
import { FormField } from "@/components/ui/form-field";
import { ScreenHeader } from "@/components/ui/screen-header";
import {
  criarEsquemaExclusaoConta,
  type FormularioExclusaoConta,
} from "@/features/auth/schemas";
import { useIdioma } from "@/i18n/idioma";
import { classificarFalhaApi } from "@/lib/api/errors";
import { useArmazenamentoAutenticacao } from "@/store/auth-store";
import { useTemaApp } from "@/theme/theme";

export default function TelaExcluirConta() {
  const tema = useTemaApp();
  const { traduzir } = useIdioma();
  const clienteConsultas = useQueryClient();
  const esquema = useMemo(
    () => criarEsquemaExclusaoConta(traduzir),
    [traduzir],
  );
  const excluirConta = useArmazenamentoAutenticacao(
    (armazenamento) => armazenamento.excluirConta,
  );
  const autenticado = useArmazenamentoAutenticacao(
    (armazenamento) => armazenamento.estado === "autenticado",
  );
  const [mostrarSenha, definirMostrarSenha] = useState(false);
  const [excluindo, definirExcluindo] = useState(false);
  const {
    control: controle,
    handleSubmit: tratarEnvio,
    setError: definirErro,
    formState: { errors: erros },
  } = useForm<FormularioExclusaoConta>({
    resolver: zodResolver(esquema),
    defaultValues: { confirmation: "", password: "" },
  });

  async function excluir(valores: FormularioExclusaoConta): Promise<void> {
    definirExcluindo(true);
    try {
      await excluirConta(valores);
      clienteConsultas.clear();
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/home");
    } catch (erro) {
      const mensagens = {
        credenciais: traduzir("exclusao.erroCredenciais"),
        semConexao: traduzir("exclusao.erroConexao"),
        timeout: traduzir("exclusao.erroTimeout"),
        indisponivel: traduzir("exclusao.erroIndisponivel"),
        configuracao: traduzir("exclusao.erro"),
        desconhecido: traduzir("exclusao.erro"),
      } as const;
      definirErro("root", {
        message: mensagens[classificarFalhaApi(erro)],
      });
    } finally {
      definirExcluindo(false);
    }
  }

  function confirmar(valores: FormularioExclusaoConta): void {
    Alert.alert(
      traduzir("exclusao.confirmarTitulo"),
      traduzir("exclusao.confirmarDescricao"),
      [
        { text: traduzir("conta.cancelar"), style: "cancel" },
        {
          text: traduzir("exclusao.confirmar"),
          style: "destructive",
          onPress: () => void excluir(valores),
        },
      ],
    );
  }

  return (
    <SafeAreaView
      edges={["top", "left", "right", "bottom"]}
      style={[styles.tela, { backgroundColor: tema.cores.fundo }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.tela}
      >
        <ScrollView
          contentContainerStyle={styles.conteudo}
          keyboardShouldPersistTaps="handled"
        >
          <ScreenHeader
            inicio={
              <Pressable
                accessibilityLabel={traduzir("autenticacao.voltar")}
                accessibilityRole="button"
                onPress={() => router.back()}
                style={({ pressed }) => [
                  styles.voltar,
                  {
                    backgroundColor: pressed
                      ? tema.cores.sobreposicao
                      : "transparent",
                  },
                ]}
              >
                <ArrowLeft color={tema.cores.texto} size={24} />
              </Pressable>
            }
            titulo={traduzir("exclusao.titulo")}
            subtitulo={traduzir("exclusao.subtitulo")}
          />

          <View
            style={[
              styles.alerta,
              {
                backgroundColor: tema.cores.perigoSuave,
                borderColor: tema.cores.perigo,
              },
            ]}
          >
            <ShieldAlert color={tema.cores.perigo} size={24} />
            <View style={styles.textoAlerta}>
              <Text style={[styles.tituloAlerta, { color: tema.cores.texto }]}>
                {traduzir("exclusao.alertaTitulo")}
              </Text>
              <Text
                style={[styles.descricao, { color: tema.cores.textoSecundario }]}
              >
                {traduzir("exclusao.alertaDescricao")}
              </Text>
            </View>
          </View>

          {autenticado ? (
            <View style={styles.formulario}>
              <Text style={[styles.descricao, { color: tema.cores.textoSecundario }]}>
                {traduzir("exclusao.confirmacaoInstrucao")}
              </Text>
              <Controller
                control={controle}
                name="confirmation"
                render={({ field: campo }) => (
                  <FormField
                    rotulo={traduzir("exclusao.emailConfirmacao")}
                    erro={erros.confirmation?.message}
                    inicio={<Mail color={tema.cores.textoSutil} size={18} />}
                    autoCapitalize="none"
                    autoComplete="email"
                    inputMode="email"
                    keyboardType="email-address"
                    onBlur={campo.onBlur}
                    onChangeText={campo.onChange}
                    textContentType="emailAddress"
                    value={campo.value}
                  />
                )}
              />
              <Controller
                control={controle}
                name="password"
                render={({ field: campo }) => (
                  <FormField
                    rotulo={traduzir("autenticacao.senha")}
                    erro={erros.password?.message}
                    inicio={<LockKeyhole color={tema.cores.textoSutil} size={18} />}
                    fim={
                      <Pressable
                        accessibilityLabel={traduzir(
                          mostrarSenha
                            ? "autenticacao.ocultarSenha"
                            : "autenticacao.mostrarSenha",
                        )}
                        accessibilityRole="button"
                        onPress={() => definirMostrarSenha((valor) => !valor)}
                        style={styles.olho}
                      >
                        {mostrarSenha ? (
                          <EyeOff color={tema.cores.textoSecundario} size={19} />
                        ) : (
                          <Eye color={tema.cores.textoSecundario} size={19} />
                        )}
                      </Pressable>
                    }
                    autoCapitalize="none"
                    autoComplete="current-password"
                    onBlur={campo.onBlur}
                    onChangeText={campo.onChange}
                    secureTextEntry={!mostrarSenha}
                    textContentType="password"
                    value={campo.value}
                  />
                )}
              />
              {erros.root?.message ? (
                <Text
                  accessibilityLiveRegion="assertive"
                  style={[styles.erro, { color: tema.cores.perigo }]}
                >
                  {erros.root.message}
                </Text>
              ) : null}
              <AppButton
                rotulo={traduzir("exclusao.acao")}
                variante="danger"
                carregando={excluindo}
                onPress={tratarEnvio(confirmar)}
              />
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1 },
  conteudo: { gap: 24, paddingBottom: 40, paddingHorizontal: 20, paddingTop: 16 },
  voltar: { alignItems: "center", borderRadius: 22, height: 44, justifyContent: "center", width: 44 },
  alerta: { alignItems: "flex-start", borderRadius: 16, borderWidth: 1, flexDirection: "row", gap: 12, padding: 16 },
  textoAlerta: { flex: 1, gap: 5 },
  tituloAlerta: { fontSize: 16, fontWeight: "700" },
  descricao: { fontSize: 14, lineHeight: 20 },
  formulario: { gap: 18 },
  olho: { alignItems: "center", height: 44, justifyContent: "center", width: 44 },
  erro: { fontSize: 13, lineHeight: 19 },
});
