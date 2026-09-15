import NetInfo from "@react-native-community/netinfo";
import { WifiOff } from "lucide-react-native";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useIdioma } from "@/i18n/idioma";
import { useTemaApp } from "@/theme/theme";

export function OfflineBanner() {
  const tema = useTemaApp();
  const { traduzir } = useIdioma();
  const [offline, definirOffline] = useState(false);

  useEffect(
    () =>
      NetInfo.addEventListener((estado) => {
        definirOffline(
          estado.isConnected === false || estado.isInternetReachable === false,
        );
      }),
    [],
  );

  if (!offline) return null;

  return (
    <SafeAreaView
      accessibilityLiveRegion="polite"
      edges={["top"]}
      style={{ backgroundColor: tema.cores.offlineSuave }}
    >
      <View
        style={[
          styles.conteudo,
          {
            backgroundColor: tema.cores.offlineSuave,
            borderColor: tema.cores.offline,
          },
        ]}
      >
        <View style={[styles.icone, { backgroundColor: tema.cores.elevado }]}>
          <WifiOff color={tema.cores.offline} size={16} />
        </View>
        <Text style={[styles.texto, { color: tema.cores.texto }]}>
          {traduzir("comum.offline")}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  conteudo: {
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: 8,
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  icone: { alignItems: "center", borderRadius: 15, height: 30, justifyContent: "center", width: 30 },
  texto: { flex: 1, fontSize: 12, lineHeight: 17 },
});
