import { z } from "zod";

import type { useIdioma } from "@/i18n/idioma";

export const categoriasDenuncia = [
  "HARASSMENT",
  "SPAM",
  "HATE",
  "IMPERSONATION",
  "INAPPROPRIATE_CONTENT",
  "OTHER",
] as const;

type Traduzir = ReturnType<typeof useIdioma>["traduzir"];

export function criarEsquemaDenuncia(traduzir: Traduzir) {
  return z.object({
    category: z.enum(categoriasDenuncia, {
      message: traduzir("amigos.denunciaCategoriaObrigatoria"),
    }),
    details: z
      .string()
      .trim()
      .max(1000, traduzir("amigos.denunciaDetalhesMaximo")),
  });
}

export type EntradaDenuncia = z.infer<ReturnType<typeof criarEsquemaDenuncia>>;
