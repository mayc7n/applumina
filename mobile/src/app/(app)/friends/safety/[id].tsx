import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { ChevronLeft } from "lucide-react-native";
import { useState } from "react";
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
  useBloquearUsuario,
  useDenunciarUsuario,
} from "@/features/friends/hooks";
import {
  categoriasDenuncia,
  criarEsquemaDenuncia,
} from "@/features/friends/safety-schema";
import { useIdioma } from "@/i18n/idioma";
import { useArmazenamentoAutenticacao } from "@/store/auth-store";
import { useTemaApp } from "@/theme/theme";
import type { ReportCategory } from "@/types/api";

export default function TelaSegurancaAmigo() {
  const tema = useTemaApp();
  const { traduzir } = useIdioma();
  const parametros = useLocalSearchParams<{
    id: string;
    displayName?: string;
    username?: string;
  }>();
  const userId = useArmazenamentoAutenticacao(
    (armazenamento) => armazenamento.usuario?.id,
  );
  const [categoria, setCategoria] = useState<ReportCategory>();
  const [detalhes, setDetalhes] = useState("");
  const [erroCategoria, setErroCategoria] = useState<string>();
  const [erroDetalhes, setErroDetalhes] = useState<string>();
  const [mensagem, setMensagem] = useState<string>();
  const bloquear = useBloquearUsuario(userId);
  const denunciar = useDenunciarUsuario(userId);

  async function bloquearUsuario(): Promise<void> {
    setMensagem(undefined);
    try {
      await bloquear.mutateAsync(parametros.id);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch {
      setMensagem(traduzir("amigos.erroBloquear"));
    }
  }

  function confirmarBloqueio(): void {
    Alert.alert(
      traduzir("amigos.confirmarBloqueioTitulo"),
      traduzir("amigos.confirmarBloqueioDescricao"),
      [
        { text: traduzir("amigos.voltar"), style: "cancel" },
        {
          text: traduzir("amigos.bloquear"),
          style: "destructive",
          onPress: () => void bloquearUsuario(),
        },
      ],
    );
  }

  async function enviarDenuncia(): Promise<void> {
    setMensagem(undefined);
    setErroCategoria(undefined);
    setErroDetalhes(undefined);
    const resultado = criarEsquemaDenuncia(traduzir).safeParse({
      category: categoria,
      details: detalhes,
    });
    if (!resultado.success) {
      const campos = resultado.error.flatten().fieldErrors;
      setErroCategoria(campos.category?.[0]);
      setErroDetalhes(campos.details?.[0]);
      return;
    }
    try {
      await denunciar.mutateAsync({
        userId: parametros.id,
        category: resultado.data.category,
        details: resultado.data.details || undefined,
      });
      setCategoria(undefined);
      setDetalhes("");
      setMensagem(traduzir("amigos.denunciaSucesso"));
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      setMensagem(traduzir("amigos.erroDenunciar"));
    }
  }

  return (
    <SafeAreaView style={[styles.tela, { backgroundColor: tema.cores.fundo }]}>
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
                accessibilityLabel={traduzir("amigos.voltarAmigos")}
                accessibilityRole="button"
                onPress={() => router.back()}
                style={({ pressed }) => [
                  styles.voltar,
                  {
                    backgroundColor: pressed
                      ? tema.cores.borda
                      : tema.cores.sobreposicao,
                  },
                ]}
              >
                <ChevronLeft color={tema.cores.texto} size={24} />
              </Pressable>
            }
            subtitulo={
              parametros.displayName
                ? `${parametros.displayName}${
                    parametros.username ? ` · @${parametros.username}` : ""
                  }`
                : undefined
            }
            titulo={traduzir("amigos.segurancaTitulo")}
          />

          <View style={styles.secao}>
            <Text style={[styles.tituloSecao, { color: tema.cores.texto }]}>
              {traduzir("amigos.bloquearTitulo")}
            </Text>
            <Text style={[styles.descricao, { color: tema.cores.textoSecundario }]}>
              {traduzir("amigos.bloquearDescricao")}
            </Text>
            <AppButton
              carregando={bloquear.isPending}
              disabled={denunciar.isPending}
              onPress={confirmarBloqueio}
              rotulo={traduzir("amigos.bloquear")}
              variante="danger"
            />
          </View>

          <View style={[styles.secao, { borderTopColor: tema.cores.borda }]}>
            <Text style={[styles.tituloSecao, { color: tema.cores.texto }]}>
              {traduzir("amigos.denunciarTitulo")}
            </Text>
            <Text style={[styles.descricao, { color: tema.cores.textoSecundario }]}>
              {traduzir("amigos.denunciarDescricao")}
            </Text>
            <View accessibilityRole="radiogroup" style={styles.categorias}>
              {categoriasDenuncia.map((item) => (
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ selected: categoria === item }}
                  key={item}
                  onPress={() => {
                    setCategoria(item);
                    setErroCategoria(undefined);
                  }}
                  style={[
                    styles.categoria,
                    {
                      backgroundColor:
                        categoria === item
                          ? tema.cores.marcaSuave
                          : tema.cores.sobreposicao,
                      borderColor:
                        categoria === item ? tema.cores.marca : tema.cores.borda,
                    },
                  ]}
                >
                  <Text style={{ color: tema.cores.texto }}>
                    {traduzir(`amigos.denunciaCategoria.${item}`)}
                  </Text>
                </Pressable>
              ))}
            </View>
            {erroCategoria ? (
              <Text accessibilityLiveRegion="polite" style={{ color: tema.cores.perigo }}>
                {erroCategoria}
              </Text>
            ) : null}
            <FormField
              erro={erroDetalhes}
              maxLength={1001}
              multiline
              onChangeText={setDetalhes}
              placeholder={traduzir("amigos.denunciaDetalhesPlaceholder")}
              rotulo={traduzir("amigos.denunciaDetalhes")}
              style={styles.detalhes}
              textAlignVertical="top"
              value={detalhes}
            />
            <AppButton
              carregando={denunciar.isPending}
              disabled={bloquear.isPending}
              onPress={() => void enviarDenuncia()}
              rotulo={traduzir("amigos.enviarDenuncia")}
            />
          </View>

          {mensagem ? (
            <Text accessibilityLiveRegion="polite" style={{ color: tema.cores.texto }}>
              {mensagem}
            </Text>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1 },
  conteudo: { gap: 24, padding: 20, paddingBottom: 40 },
  voltar: {
    alignItems: "center",
    borderRadius: 22,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  secao: { gap: 14, borderTopWidth: 1, paddingTop: 20 },
  tituloSecao: { fontSize: 18, fontWeight: "800" },
  descricao: { fontSize: 14, lineHeight: 20 },
  categorias: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  categoria: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10 },
  detalhes: { minHeight: 100 },
});
