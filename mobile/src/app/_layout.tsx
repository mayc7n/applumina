import { Slot } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { OfflineBanner } from "@/components/ui/offline-banner";
import { ProvedorConsultas } from "@/providers/query-provider";
import { useArmazenamentoAutenticacao } from "@/store/auth-store";
import { useTemaApp } from "@/theme/theme";

void SplashScreen.preventAutoHideAsync();

export default function LayoutRaiz() {
  const tema = useTemaApp();
  const estado = useArmazenamentoAutenticacao(
    (armazenamento) => armazenamento.estado,
  );
  const inicializar = useArmazenamentoAutenticacao(
    (armazenamento) => armazenamento.inicializar,
  );

  useEffect(() => {
    void inicializar();
  }, [inicializar]);

  useEffect(() => {
    if (estado !== "inicializando") void SplashScreen.hideAsync();
  }, [estado]);

  return (
    <GestureHandlerRootView style={styles.flexivel}>
      <SafeAreaProvider>
        <ProvedorConsultas>
          <StatusBar style={tema.escuro ? "light" : "dark"} />
          <View style={styles.flexivel}>
            <OfflineBanner />
            <Slot />
          </View>
        </ProvedorConsultas>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({ flexivel: { flex: 1 } });
