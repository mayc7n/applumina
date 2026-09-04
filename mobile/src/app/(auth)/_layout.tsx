import { Redirect, Stack, usePathname } from "expo-router";

import { LoadingScreen } from "@/components/ui/loading-screen";
import { useArmazenamentoAutenticacao } from "@/store/auth-store";

export default function LayoutAutenticacao() {
  const caminho = usePathname();
  const estado = useArmazenamentoAutenticacao(
    (armazenamento) => armazenamento.estado,
  );

  if (estado === "inicializando") return <LoadingScreen />;
  if (estado === "autenticado" && caminho !== "/reset-password") {
    return <Redirect href="/home" />;
  }

  return <Stack screenOptions={{ headerShown: false, animation: "fade" }} />;
}
