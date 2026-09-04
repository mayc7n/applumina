import { Redirect } from "expo-router";

import { LoadingScreen } from "@/components/ui/loading-screen";
import { useArmazenamentoAutenticacao } from "@/store/auth-store";

export default function InicioRoteamento() {
  const estado = useArmazenamentoAutenticacao(
    (armazenamento) => armazenamento.estado,
  );

  if (estado === "inicializando") return <LoadingScreen />;
  return <Redirect href="/home" />;
}
