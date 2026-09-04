import { z } from "zod";

import type { useIdioma } from "@/i18n/idioma";

type Traduzir = ReturnType<typeof useIdioma>["traduzir"];

export function criarEsquemaLogin(traduzir: Traduzir) {
  return z.object({
    email: z.string().trim().email(traduzir("validacao.email")),
    password: z.string().min(1, traduzir("validacao.senhaObrigatoria")),
  });
}

export function criarEsquemaCadastro(traduzir: Traduzir) {
  return z
    .object({
      displayName: z
        .string()
        .trim()
        .min(2, traduzir("validacao.nomeMinimo"))
        .max(100, traduzir("validacao.nomeMaximo")),
      username: z
        .string()
        .trim()
        .min(3, traduzir("validacao.usuarioMinimo"))
        .max(50, traduzir("validacao.usuarioMaximo"))
        .regex(/^[a-z0-9_]+$/, traduzir("validacao.usuarioFormato")),
      email: z.string().trim().email(traduzir("validacao.email")),
      password: z
        .string()
        .min(8, traduzir("validacao.senhaMinimo"))
        .max(128, traduzir("validacao.senhaMaximo")),
      confirmPassword: z.string(),
    })
    .refine((valores) => valores.password === valores.confirmPassword, {
      message: traduzir("validacao.senhasDiferentes"),
      path: ["confirmPassword"],
    });
}

export type FormularioLogin = z.infer<ReturnType<typeof criarEsquemaLogin>>;
export type FormularioCadastro = z.infer<
  ReturnType<typeof criarEsquemaCadastro>
>;
