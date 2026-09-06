import { UserRound } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/ui/app-button";
import { useTemaApp } from "@/theme/theme";
import type { SocialUser } from "@/types/api";

interface FriendRowProps {
  usuario: SocialUser;
  rotuloAcao?: string;
  aoAgir?: () => void;
  agindo?: boolean;
  acaoDesabilitada?: boolean;
  rotuloOnline: string;
}

export function FriendRow({
  usuario,
  rotuloAcao,
  aoAgir,
  agindo,
  acaoDesabilitada,
  rotuloOnline,
}: FriendRowProps) {
  const tema = useTemaApp();

  return (
    <View style={[styles.linha, { borderColor: tema.cores.borda }]}>
      <View
        style={[styles.avatar, { backgroundColor: tema.cores.marcaSuave }]}
      >
        <UserRound color={tema.cores.marca} size={21} />
      </View>
      <View style={styles.identidade}>
        <View style={styles.nomeOnline}>
          <Text
            numberOfLines={1}
            style={[styles.nome, { color: tema.cores.texto }]}
          >
            {usuario.displayName}
          </Text>
          {usuario.isOnline ? (
            <View
              accessibilityLabel={rotuloOnline}
              accessibilityRole="text"
              style={[styles.online, { backgroundColor: tema.cores.sucesso }]}
            />
          ) : null}
        </View>
        <Text
          numberOfLines={1}
          style={[styles.usuario, { color: tema.cores.textoSecundario }]}
        >
          @{usuario.username}
        </Text>
      </View>
      {rotuloAcao ? (
        <AppButton
          carregando={agindo}
          disabled={acaoDesabilitada}
          onPress={aoAgir}
          rotulo={rotuloAcao}
          style={styles.acao}
          variante="secondary"
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  linha: {
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: 11,
    minHeight: 70,
    paddingVertical: 10,
  },
  avatar: {
    alignItems: "center",
    borderRadius: 22,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  identidade: { flex: 1, gap: 3 },
  nomeOnline: { alignItems: "center", flexDirection: "row", gap: 7 },
  nome: { flexShrink: 1, fontSize: 15, fontWeight: "700" },
  usuario: { fontSize: 13 },
  online: { borderRadius: 4, height: 8, width: 8 },
  acao: { minHeight: 40, paddingHorizontal: 12 },
});
