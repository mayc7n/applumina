import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { ArrowLeft, Eye, EyeOff, LockKeyhole, ShieldCheck } from "lucide-react-native";
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
  criarEsquemaAlteracaoSenha,
  type FormularioAlteracaoSenha,
} from "@/features/auth/schemas";
import { useIdioma } from "@/i18n/idioma";
import { classificarFalhaApi } from "@/lib/api/errors";
import { apiUsuarios } from "@/lib/api/resources";
import { useArmazenamentoAutenticacao } from "@/store/auth-store";
import { useTemaApp } from "@/theme/theme";

export default function TelaAlterarSenha() {
  const tema = useTemaApp();
  const { traduzir } = useIdioma();
  const clienteConsultas = useQueryClient();
  const esquema = useMemo(
    () => criarEsquemaAlteracaoSenha(traduzir),
    [traduzir],
  );
  const autenticado = useArmazenamentoAutenticacao(
    (armazenamento) => armazenamento.estado === "autenticado",
  );
  const [mostrarSenhas, definirMostrarSenhas] = useState(false);
  const {
    control: controle,
    handleSubmit: tratarEnvio,
    setError: definirErro,
    formState: { errors: erros, isSubmitting: enviando },
  } = useForm<FormularioAlteracaoSenha>({
    resolver: zodResolver(esquema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  async function salvar(valores: FormularioAlteracaoSenha): Promise<void> {
    try {
      await apiUsuarios.alterarSenha({
        currentPassword: valores.currentPassword,
        newPassword: valores.newPassword,
      });
      await clienteConsultas.invalidateQueries({ queryKey: ["sessoes"] });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        traduzir("senha.sucessoTitulo"),
        traduzir("senha.sucessoDescricao"),
        [{ text: "OK", onPress: () => router.back() }],
      );
    } catch (erro) {
      const mensagens = {
        credenciais: traduzir("senha.erroCredenciais"),
        semConexao: traduzir("senha.erroConexao"),
        timeout: traduzir("senha.erroTimeout"),
        indisponivel: traduzir("senha.erroIndisponivel"),
        configuracao: traduzir("senha.erro"),
        desconhecido: traduzir("senha.erro"),
      } as const;
      definirErro("root", {
        message: mensagens[classificarFalhaApi(erro)],
      });
    }
  }

  const botaoVisibilidade = (
    <Pressable
      accessibilityLabel={traduzir(
        mostrarSenhas
          ? "autenticacao.ocultarSenha"
          : "autenticacao.mostrarSenha",
      )}
      accessibilityRole="button"
      onPress={() => definirMostrarSenhas((valor) => !valor)}
      style={styles.olho}
    >
      {mostrarSenhas ? (
        <EyeOff color={tema.cores.textoSecundario} size={19} />
      ) : (
        <Eye color={tema.cores.textoSecundario} size={19} />
      )}
    </Pressable>
  );

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
            titulo={traduzir("senha.titulo")}
            subtitulo={traduzir("senha.subtitulo")}
          />

          <View
            style={[
              styles.aviso,
              {
                backgroundColor: tema.cores.informacaoSuave,
                borderColor: tema.cores.informacao,
              },
            ]}
          >
            <ShieldCheck color={tema.cores.informacao} size={23} />
            <View style={styles.textoAviso}>
              <Text style={[styles.tituloAviso, { color: tema.cores.texto }]}>
                {traduzir("senha.avisoTitulo")}
              </Text>
              <Text style={[styles.descricao, { color: tema.cores.textoSecundario }]}>
                {traduzir("senha.avisoDescricao")}
              </Text>
            </View>
          </View>

          {autenticado ? (
            <View style={styles.formulario}>
              <CampoSenha
                controle={controle}
                nome="currentPassword"
                rotulo={traduzir("senha.atual")}
                erro={erros.currentPassword?.message}
                mostrar={mostrarSenhas}
                fim={botaoVisibilidade}
              />
              <CampoSenha
                controle={controle}
                nome="newPassword"
                rotulo={traduzir("senha.nova")}
                erro={erros.newPassword?.message}
                mostrar={mostrarSenhas}
              />
              <CampoSenha
                controle={controle}
                nome="confirmPassword"
                rotulo={traduzir("senha.confirmarNova")}
                erro={erros.confirmPassword?.message}
                mostrar={mostrarSenhas}
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
                rotulo={traduzir("senha.acao")}
                carregando={enviando}
                onPress={tratarEnvio(salvar)}
              />
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function CampoSenha({
  controle,
  nome,
  rotulo,
  erro,
  mostrar,
  fim,
}: {
  controle: ReturnType<typeof useForm<FormularioAlteracaoSenha>>["control"];
  nome: "currentPassword" | "newPassword" | "confirmPassword";
  rotulo: string;
  erro?: string;
  mostrar: boolean;
  fim?: React.ReactNode;
}) {
  const tema = useTemaApp();
  return (
    <Controller
      control={controle}
      name={nome}
      render={({ field: campo }) => (
        <FormField
          rotulo={rotulo}
          erro={erro}
          inicio={<LockKeyhole color={tema.cores.textoSutil} size={18} />}
          fim={fim}
          autoCapitalize="none"
          autoComplete={
            nome === "currentPassword" ? "current-password" : "new-password"
          }
          onBlur={campo.onBlur}
          onChangeText={campo.onChange}
          secureTextEntry={!mostrar}
          textContentType={
            nome === "currentPassword" ? "password" : "newPassword"
          }
          value={campo.value}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1 },
  conteudo: { gap: 24, paddingBottom: 40, paddingHorizontal: 20, paddingTop: 16 },
  voltar: { alignItems: "center", borderRadius: 22, height: 44, justifyContent: "center", width: 44 },
  aviso: { alignItems: "flex-start", borderRadius: 16, borderWidth: 1, flexDirection: "row", gap: 12, padding: 16 },
  textoAviso: { flex: 1, gap: 5 },
  tituloAviso: { fontSize: 16, fontWeight: "700" },
  descricao: { fontSize: 14, lineHeight: 20 },
  formulario: { gap: 18 },
  olho: { alignItems: "center", height: 44, justifyContent: "center", width: 44 },
  erro: { fontSize: 13, lineHeight: 19 },
});
