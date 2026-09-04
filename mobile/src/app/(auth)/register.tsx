import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import {
  AtSign,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  UserRound,
} from "lucide-react-native";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AuthShell } from "@/components/auth/auth-shell";
import { AppButton } from "@/components/ui/app-button";
import { FormField } from "@/components/ui/form-field";
import {
  criarEsquemaCadastro,
  type FormularioCadastro,
} from "@/features/auth/schemas";
import { useIdioma } from "@/i18n/idioma";
import { obterMensagemErroApi } from "@/lib/api/errors";
import { useArmazenamentoAutenticacao } from "@/store/auth-store";
import { useTemaApp } from "@/theme/theme";

export default function TelaCadastro() {
  const tema = useTemaApp();
  const { traduzir } = useIdioma();
  const esquemaCadastro = useMemo(
    () => criarEsquemaCadastro(traduzir),
    [traduzir],
  );
  const cadastrar = useArmazenamentoAutenticacao(
    (armazenamento) => armazenamento.cadastrar,
  );
  const [mostrarSenha, definirMostrarSenha] = useState(false);
  const {
    control: controle,
    handleSubmit: tratarEnvio,
    setError: definirErro,
    formState: { errors: erros, isSubmitting: enviando },
  } = useForm<FormularioCadastro>({
    resolver: zodResolver(esquemaCadastro),
    defaultValues: {
      displayName: "",
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function enviar({
    confirmPassword: _confirmacao,
    ...valores
  }: FormularioCadastro) {
    try {
      await cadastrar(valores);
      router.replace("/home");
    } catch (erro) {
      definirErro("root", {
        message: obterMensagemErroApi(erro, traduzir("cadastro.erro"), false),
      });
    }
  }

  return (
    <AuthShell
      destaque={traduzir("cadastro.destaque")}
      titulo={traduzir("cadastro.titulo")}
      descricao={traduzir("cadastro.descricao")}
    >
      <View style={styles.formulario}>
        <Controller
          control={controle}
          name="displayName"
          render={({ field: campo }) => (
            <FormField
              rotulo={traduzir("cadastro.nome")}
              erro={erros.displayName?.message}
              inicio={<UserRound color={tema.cores.textoSutil} size={18} />}
              autoCapitalize="words"
              autoComplete="name"
              onBlur={campo.onBlur}
              onChangeText={campo.onChange}
              placeholder={traduzir("cadastro.nomePlaceholder")}
              textContentType="name"
              value={campo.value}
            />
          )}
        />
        <Controller
          control={controle}
          name="username"
          render={({ field: campo }) => (
            <FormField
              rotulo={traduzir("cadastro.usuario")}
              erro={erros.username?.message}
              inicio={<AtSign color={tema.cores.textoSutil} size={18} />}
              autoCapitalize="none"
              autoCorrect={false}
              onBlur={campo.onBlur}
              onChangeText={(valor) => campo.onChange(valor.toLowerCase())}
              placeholder={traduzir("cadastro.usuarioPlaceholder")}
              value={campo.value}
            />
          )}
        />
        <Controller
          control={controle}
          name="email"
          render={({ field: campo }) => (
            <FormField
              rotulo={traduzir("autenticacao.email")}
              erro={erros.email?.message}
              inicio={<Mail color={tema.cores.textoSutil} size={18} />}
              autoCapitalize="none"
              autoComplete="email"
              inputMode="email"
              keyboardType="email-address"
              onBlur={campo.onBlur}
              onChangeText={campo.onChange}
              placeholder={traduzir("autenticacao.emailPlaceholder")}
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
                  hitSlop={12}
                  onPress={() => definirMostrarSenha((valor) => !valor)}
                >
                  {mostrarSenha ? (
                    <EyeOff color={tema.cores.textoSecundario} size={19} />
                  ) : (
                    <Eye color={tema.cores.textoSecundario} size={19} />
                  )}
                </Pressable>
              }
              autoCapitalize="none"
              autoComplete="new-password"
              onBlur={campo.onBlur}
              onChangeText={campo.onChange}
              secureTextEntry={!mostrarSenha}
              textContentType="newPassword"
              value={campo.value}
            />
          )}
        />
        <Controller
          control={controle}
          name="confirmPassword"
          render={({ field: campo }) => (
            <FormField
              rotulo={traduzir("cadastro.confirmarSenha")}
              erro={erros.confirmPassword?.message}
              inicio={<LockKeyhole color={tema.cores.textoSutil} size={18} />}
              autoCapitalize="none"
              autoComplete="new-password"
              onBlur={campo.onBlur}
              onChangeText={campo.onChange}
              onSubmitEditing={tratarEnvio(enviar)}
              returnKeyType="done"
              secureTextEntry={!mostrarSenha}
              textContentType="newPassword"
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
          rotulo={traduzir("cadastro.acao")}
          carregando={enviando}
          onPress={tratarEnvio(enviar)}
        />
        <View style={styles.rodape}>
          <Text style={{ color: tema.cores.textoSecundario }}>
            {traduzir("cadastro.comConta")}
          </Text>
          <Pressable
            accessibilityRole="link"
            onPress={() => router.replace("/login")}
          >
            <Text style={[styles.link, { color: tema.cores.marca }]}>
              {traduzir("cadastro.entrar")}
            </Text>
          </Pressable>
        </View>
      </View>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  formulario: { gap: 16 },
  erro: { fontSize: 13, lineHeight: 19 },
  rodape: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
    justifyContent: "center",
    marginTop: 6,
  },
  link: { fontWeight: "700" },
});
