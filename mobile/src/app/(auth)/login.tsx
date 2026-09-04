import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AuthShell } from "@/components/auth/auth-shell";
import { AppButton } from "@/components/ui/app-button";
import { FormField } from "@/components/ui/form-field";
import {
  criarEsquemaLogin,
  type FormularioLogin,
} from "@/features/auth/schemas";
import { useIdioma } from "@/i18n/idioma";
import { obterMensagemErroApi } from "@/lib/api/errors";
import { useArmazenamentoAutenticacao } from "@/store/auth-store";
import { useTemaApp } from "@/theme/theme";

export default function TelaLogin() {
  const tema = useTemaApp();
  const { traduzir } = useIdioma();
  const esquemaLogin = useMemo(() => criarEsquemaLogin(traduzir), [traduzir]);
  const entrar = useArmazenamentoAutenticacao(
    (armazenamento) => armazenamento.entrar,
  );
  const [mostrarSenha, definirMostrarSenha] = useState(false);
  const {
    control: controle,
    handleSubmit: tratarEnvio,
    setError: definirErro,
    formState: { errors: erros, isSubmitting: enviando },
  } = useForm<FormularioLogin>({
    resolver: zodResolver(esquemaLogin),
    defaultValues: { email: "", password: "" },
  });

  async function enviar(valores: FormularioLogin): Promise<void> {
    try {
      await entrar(valores);
      router.replace("/home");
    } catch (erro) {
      definirErro("root", {
        message: obterMensagemErroApi(erro, traduzir("login.erro"), false),
      });
    }
  }

  return (
    <AuthShell
      destaque={traduzir("login.destaque")}
      titulo={traduzir("login.titulo")}
      descricao={traduzir("login.descricao")}
    >
      <View style={styles.formulario}>
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
              returnKeyType="next"
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
              autoComplete="current-password"
              onBlur={campo.onBlur}
              onChangeText={campo.onChange}
              onSubmitEditing={tratarEnvio(enviar)}
              returnKeyType="done"
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
          rotulo={traduzir("login.acao")}
          carregando={enviando}
          onPress={tratarEnvio(enviar)}
        />
        <View style={styles.rodape}>
          <Text style={{ color: tema.cores.textoSecundario }}>
            {traduzir("login.semConta")}
          </Text>
          <Pressable
            accessibilityRole="link"
            onPress={() => router.push("/register")}
          >
            <Text style={[styles.link, { color: tema.cores.marca }]}>
              {traduzir("login.criarConta")}
            </Text>
          </Pressable>
        </View>
      </View>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  formulario: { gap: 18 },
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
