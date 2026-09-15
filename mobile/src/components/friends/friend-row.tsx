import { ShieldCheck } from "lucide-react-native";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useTemaApp } from "@/theme/theme";
import type { SocialUser } from "@/types/api";

interface FriendRowProps {
  usuario: SocialUser;
  rotuloAcao?: string;
  aoAgir?: () => void;
  agindo?: boolean;
  acaoDesabilitada?: boolean;
  rotuloAcaoSecundaria?: string;
  aoAgirSecundariamente?: () => void;
  agindoSecundariamente?: boolean;
  acoesDesabilitadas?: boolean;
  rotuloOnline: string;
  rotuloSeguranca?: string;
  aoAbrirSeguranca?: () => void;
  acaoPrincipal?: boolean;
}

export function FriendRow({
  usuario,
  rotuloAcao,
  aoAgir,
  agindo,
  acaoDesabilitada,
  rotuloAcaoSecundaria,
  aoAgirSecundariamente,
  agindoSecundariamente,
  acoesDesabilitadas,
  rotuloOnline,
  rotuloSeguranca,
  aoAbrirSeguranca,
  acaoPrincipal = false,
}: FriendRowProps) {
  const tema = useTemaApp();
  const iniciais = usuario.displayName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte.charAt(0))
    .join("")
    .toLocaleUpperCase();

  return (
    <View
      style={[
        styles.linha,
        { backgroundColor: tema.cores.elevado, borderColor: tema.cores.borda },
      ]}
    >
      <View style={styles.cabecalho}>
        <View
          style={[
            styles.avatar,
            {
              backgroundColor: tema.cores.marcaSuave,
              borderColor: tema.cores.marcaContorno,
            },
          ]}
        >
          <Text style={[styles.avatarTexto, { color: tema.cores.marca }]}>
            {iniciais}
          </Text>
          {usuario.isOnline ? (
            <View
              accessibilityLabel={rotuloOnline}
              accessibilityRole="text"
              style={[
                styles.online,
                {
                  backgroundColor: tema.cores.sucesso,
                  borderColor: tema.cores.elevado,
                },
              ]}
            />
          ) : null}
        </View>
        <View style={styles.identidade}>
          <Text
            numberOfLines={1}
            style={[styles.nome, { color: tema.cores.texto }]}
          >
            {usuario.displayName}
          </Text>
          <Text
            numberOfLines={1}
            style={[styles.usuario, { color: tema.cores.textoSecundario }]}
          >
            @{usuario.username}
          </Text>
        </View>
      </View>

      {rotuloAcao || rotuloAcaoSecundaria || rotuloSeguranca ? (
        <View style={styles.acoes}>
          {rotuloAcao ? (
            acaoDesabilitada ? (
              <View
                accessibilityRole="text"
                style={[styles.estado, { backgroundColor: tema.cores.sobreposicao }]}
              >
                <Text style={[styles.estadoTexto, { color: tema.cores.textoSecundario }]}>
                  {rotuloAcao}
                </Text>
              </View>
            ) : (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: acoesDesabilitadas, busy: agindo }}
                disabled={acoesDesabilitadas || agindo}
                onPress={aoAgir}
                style={({ pressed }) => [
                  styles.acao,
                  {
                    backgroundColor: acaoPrincipal
                      ? pressed
                        ? tema.cores.marcaPressionada
                        : tema.cores.marca
                      : pressed
                        ? tema.cores.borda
                        : tema.cores.sobreposicao,
                    borderColor: acaoPrincipal ? tema.cores.marca : tema.cores.bordaForte,
                  },
                ]}
              >
                {agindo ? (
                  <ActivityIndicator color={acaoPrincipal ? tema.cores.sobreMarca : tema.cores.marca} size="small" />
                ) : (
                  <Text style={[styles.acaoTexto, { color: acaoPrincipal ? tema.cores.sobreMarca : tema.cores.texto }]}>
                    {rotuloAcao}
                  </Text>
                )}
              </Pressable>
            )
          ) : null}
          {rotuloAcaoSecundaria ? (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: acoesDesabilitadas, busy: agindoSecundariamente }}
              disabled={acoesDesabilitadas || agindoSecundariamente}
              onPress={aoAgirSecundariamente}
              style={({ pressed }) => [
                styles.acao,
                {
                  backgroundColor: pressed ? tema.cores.borda : tema.cores.sobreposicao,
                  borderColor: tema.cores.bordaForte,
                },
              ]}
            >
              {agindoSecundariamente ? (
                <ActivityIndicator color={tema.cores.marca} size="small" />
              ) : (
                <Text style={[styles.acaoTexto, { color: tema.cores.texto }]}>
                  {rotuloAcaoSecundaria}
                </Text>
              )}
            </Pressable>
          ) : null}
          {rotuloSeguranca ? (
            <Pressable
              accessibilityLabel={rotuloSeguranca}
              accessibilityRole="button"
              accessibilityState={{ disabled: acoesDesabilitadas }}
              disabled={acoesDesabilitadas}
              onPress={aoAbrirSeguranca}
              style={({ pressed }) => [
                styles.seguranca,
                { backgroundColor: pressed ? tema.cores.borda : tema.cores.sobreposicao },
              ]}
            >
              <ShieldCheck color={tema.cores.textoSecundario} size={18} />
              <Text style={[styles.segurancaTexto, { color: tema.cores.textoSecundario }]}>
                {rotuloSeguranca}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  linha: {
    borderRadius: 18,
    borderWidth: 1,
    gap: 13,
    minHeight: 86,
    padding: 14,
  },
  cabecalho: { alignItems: "center", flexDirection: "row", gap: 11 },
  avatar: {
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 22,
    height: 44,
    justifyContent: "center",
    position: "relative",
    width: 44,
  },
  avatarTexto: { fontSize: 14, fontWeight: "900", letterSpacing: 0.4 },
  identidade: { flex: 1, gap: 3 },
  nome: { flexShrink: 1, fontSize: 15, fontWeight: "700" },
  usuario: { fontSize: 13 },
  online: { borderRadius: 6, borderWidth: 2, bottom: -1, height: 12, position: "absolute", right: -1, width: 12 },
  acoes: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  acao: { alignItems: "center", borderRadius: 12, borderWidth: 1, flexGrow: 1, justifyContent: "center", minHeight: 44, paddingHorizontal: 14 },
  acaoTexto: { fontSize: 14, fontWeight: "700" },
  estado: { borderRadius: 12, flexGrow: 1, justifyContent: "center", minHeight: 44, paddingHorizontal: 14 },
  estadoTexto: { fontSize: 14, fontWeight: "700", textAlign: "center" },
  seguranca: { alignItems: "center", borderRadius: 12, flexDirection: "row", gap: 7, justifyContent: "center", minHeight: 44, paddingHorizontal: 12 },
  segurancaTexto: { fontSize: 13, fontWeight: "700" },
});
