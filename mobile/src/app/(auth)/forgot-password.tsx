import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { Mail, ShieldCheck } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AuthShell } from "@/components/auth/auth-shell";
import { AppButton } from "@/components/ui/app-button";
import { FormField } from "@/components/ui/form-field";
import { criarEsquemaRecuperacaoSenha, type FormularioRecuperacaoSenha } from "@/features/auth/schemas";
import { useIdioma } from "@/i18n/idioma";
import { classificarFalhaApi } from "@/lib/api/errors";
import { apiAutenticacaoMobile } from "@/lib/api/resources";
import { useTemaApp } from "@/theme/theme";

export default function TelaRecuperarSenha() {
  const tema = useTemaApp();
  const { traduzir } = useIdioma();
  const esquema = useMemo(() => criarEsquemaRecuperacaoSenha(traduzir), [traduzir]);
  const [enviado, definirEnviado] = useState(false);
  const { control, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<FormularioRecuperacaoSenha>({
    resolver: zodResolver(esquema), defaultValues: { email: "" },
  });

  async function enviar(valores: FormularioRecuperacaoSenha) {
    try {
      await apiAutenticacaoMobile.solicitarRedefinicao(valores);
      definirEnviado(true);
    } catch (erro) {
      const motivo = classificarFalhaApi(erro);
      setError("root", { message: motivo === "semConexao" ? traduzir("login.erroConexao")
        : motivo === "timeout" ? traduzir("login.erroTimeout")
          : motivo === "indisponivel" ? traduzir("login.erroIndisponivel") : traduzir("recuperacao.erro") });
    }
  }

  return (
    <AuthShell destaque={traduzir("recuperacao.destaque")} titulo={traduzir("recuperacao.titulo")} descricao={traduzir("recuperacao.descricao")}>
      {enviado ? (
        <View style={styles.grupo}>
          <ShieldCheck color={tema.cores.sucesso} size={32} accessibilityElementsHidden />
          <Text accessibilityRole="header" style={[styles.titulo, { color: tema.cores.texto }]}>{traduzir("recuperacao.sucesso")}</Text>
          <Text style={[styles.descricao, { color: tema.cores.textoSecundario }]}>{traduzir("recuperacao.sucessoDescricao")}</Text>
          <AppButton rotulo={traduzir("recuperacao.voltar")} onPress={() => router.replace("/login")} />
        </View>
      ) : (
        <View style={styles.grupo}>
          <Controller control={control} name="email" render={({ field }) => (
            <FormField rotulo={traduzir("autenticacao.email")} erro={errors.email?.message} inicio={<Mail color={tema.cores.textoSutil} size={18} />} autoCapitalize="none" autoComplete="email" keyboardType="email-address" textContentType="emailAddress" value={field.value} onBlur={field.onBlur} onChangeText={field.onChange} onSubmitEditing={handleSubmit(enviar)} />
          )} />
          {errors.root?.message ? <Text accessibilityLiveRegion="assertive" style={[styles.erro, { color: tema.cores.perigo }]}>{errors.root.message}</Text> : null}
          <AppButton rotulo={traduzir("recuperacao.acao")} carregando={isSubmitting} onPress={handleSubmit(enviar)} />
          <Pressable accessibilityRole="link" onPress={() => router.back()} style={styles.link}><Text style={{ color: tema.cores.marca, fontWeight: "700" }}>{traduzir("recuperacao.voltar")}</Text></Pressable>
        </View>
      )}
    </AuthShell>
  );
}

const styles = StyleSheet.create({ grupo: { gap: 18 }, titulo: { fontSize: 20, fontWeight: "700" }, descricao: { fontSize: 15, lineHeight: 22 }, erro: { fontSize: 13, lineHeight: 19 }, link: { alignItems: "center", justifyContent: "center", minHeight: 44 } });
