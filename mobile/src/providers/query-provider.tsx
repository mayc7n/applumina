import NetInfo from "@react-native-community/netinfo";
import {
  focusManager,
  onlineManager,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { useEffect, type PropsWithChildren } from "react";
import { AppState, type AppStateStatus, Platform } from "react-native";

function aoMudarEstadoApp(estado: AppStateStatus): void {
  if (Platform.OS !== "web") focusManager.setFocused(estado === "active");
}

export const clienteConsultas = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, refetchOnReconnect: true },
    mutations: { retry: 0 },
  },
});

export function ProvedorConsultas({ children: filhos }: PropsWithChildren) {
  useEffect(() => {
    const inscricaoEstadoApp = AppState.addEventListener(
      "change",
      aoMudarEstadoApp,
    );
    let removerEscutaRede: () => void = () => undefined;
    onlineManager.setEventListener((definirOnline) => {
      removerEscutaRede = NetInfo.addEventListener((estado) =>
        definirOnline(Boolean(estado.isConnected)),
      );
      return removerEscutaRede;
    });

    return () => {
      inscricaoEstadoApp.remove();
      removerEscutaRede();
    };
  }, []);

  return (
    <QueryClientProvider client={clienteConsultas}>
      {filhos}
    </QueryClientProvider>
  );
}
