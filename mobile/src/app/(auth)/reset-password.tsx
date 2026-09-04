import { zodResolver } from "@hookform/resolvers/zod";
import { isAxiosError } from "axios";
import { router, useLocalSearchParams } from "expo-router";
import { Eye, EyeOff, LockKeyhole } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AuthShell } from "@/components/auth/auth-shell";
import { AppButton } from "@/components/ui/app-button";
import { FormField } from "@/components/ui/form-field";
import { criarEsquemaRedefinicaoSenha, type FormularioRedefinicaoSenha } from "@/features/auth/schemas";
import { useIdioma } from "@/i18n/idioma";
import { classificarFalhaApi } from "@/lib/api/errors";
import { apiAutenticacaoMobile } from "@/lib/api/resources";
import type { ApiEnvelope } from "@/types/api";
import { useTemaApp } from "@/theme/theme";

export default function TelaRedefinirSenha() {
  const tema = useTemaApp(); const { traduzir } = useIdioma();
  const params = useLocalSearchParams<{ token?: string }>();
  const token = typeof params.token === "string" ? params.token : "";
  const esquema = useMemo(() => criarEsquemaRedefinicaoSenha(traduzir), [traduzir]);
  const [mostrar, definirMostrar] = useState(false); const [concluido, definirConcluido] = useState(false);
  const { control, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<FormularioRedefinicaoSenha>({ resolver: zodResolver(esquema), defaultValues: { newPassword: "", confirmPassword: "" } });
  async function enviar(valores: FormularioRedefinicaoSenha) {
    if (!token) { setError("root", { message: traduzir("redefinicao.linkInvalido") }); return; }
    try { await apiAutenticacaoMobile.redefinirSenha({ token, newPassword: valores.newPassword }); definirConcluido(true); }
    catch (erro) {
      const invalido = isAxiosError<ApiEnvelope<unknown>>(erro) && erro.response?.data?.error?.code === "INVALID_PASSWORD_RESET_TOKEN";
      const motivo = classificarFalhaApi(erro);
      setError("root", { message: invalido ? traduzir("redefinicao.linkInvalido") : motivo === "semConexao" ? traduzir("login.erroConexao") : motivo === "timeout" ? traduzir("login.erroTimeout") : traduzir("redefinicao.erro") });
    }
  }
  const olho = <Pressable accessibilityRole="button" accessibilityLabel={traduzir(mostrar ? "autenticacao.ocultarSenha" : "autenticacao.mostrarSenha")} onPress={() => definirMostrar(v => !v)} style={styles.olho}>{mostrar ? <EyeOff color={tema.cores.textoSecundario} size={19} /> : <Eye color={tema.cores.textoSecundario} size={19} />}</Pressable>;
  return <AuthShell destaque={traduzir("redefinicao.destaque")} titulo={traduzir("redefinicao.titulo")} descricao={traduzir("redefinicao.descricao")}>
    {concluido ? <View style={styles.grupo}><Text accessibilityRole="header" style={[styles.titulo, { color: tema.cores.texto }]}>{traduzir("redefinicao.sucesso")}</Text><Text style={[styles.descricao, { color: tema.cores.textoSecundario }]}>{traduzir("redefinicao.sucessoDescricao")}</Text><AppButton rotulo={traduzir("login.acao")} onPress={() => router.replace("/login")} /></View>
      : <View style={styles.grupo}>{(["newPassword", "confirmPassword"] as const).map((nome, indice) => <Controller key={nome} control={control} name={nome} render={({ field }) => <FormField rotulo={traduzir(indice === 0 ? "redefinicao.nova" : "redefinicao.confirmar")} erro={errors[nome]?.message} inicio={<LockKeyhole color={tema.cores.textoSutil} size={18} />} fim={indice === 0 ? olho : undefined} autoCapitalize="none" autoComplete="new-password" textContentType="newPassword" secureTextEntry={!mostrar} value={field.value} onBlur={field.onBlur} onChangeText={field.onChange} />} />)}{errors.root?.message ? <Text accessibilityLiveRegion="assertive" style={[styles.erro, { color: tema.cores.perigo }]}>{errors.root.message}</Text> : null}<AppButton rotulo={traduzir("redefinicao.acao")} carregando={isSubmitting} onPress={handleSubmit(enviar)} /></View>}
  </AuthShell>;
}
const styles = StyleSheet.create({ grupo: { gap: 18 }, titulo: { fontSize: 20, fontWeight: "700" }, descricao: { fontSize: 15, lineHeight: 22 }, erro: { fontSize: 13, lineHeight: 19 }, olho: { alignItems: "center", height: 44, justifyContent: "center", width: 44 } });
