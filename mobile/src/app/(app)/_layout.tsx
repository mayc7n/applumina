import { Stack } from "expo-router";

import { LoadingScreen } from "@/components/ui/loading-screen";
import { useArmazenamentoAutenticacao } from "@/store/auth-store";

export default function LayoutAplicativo() {
  const estado = useArmazenamentoAutenticacao(
    (armazenamento) => armazenamento.estado,
  );

  if (estado === "inicializando") return <LoadingScreen />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
