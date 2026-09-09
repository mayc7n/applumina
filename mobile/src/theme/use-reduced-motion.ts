import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

type ObservadorReducaoMovimento = (habilitada: boolean) => void;

let preferenciaCache: boolean | null = null;
let assinatura: ReturnType<typeof AccessibilityInfo.addEventListener> | null =
  null;
let cicloAtual = 0;
let versaoPreferencia = 0;
const observadores = new Set<ObservadorReducaoMovimento>();

function publicarPreferencia(habilitada: boolean) {
  preferenciaCache = habilitada;
  versaoPreferencia += 1;
  observadores.forEach((observador) => observador(habilitada));
}

function iniciarObservacao() {
  if (assinatura) {
    return;
  }

  const ciclo = ++cicloAtual;
  const versaoInicial = versaoPreferencia;
  assinatura = AccessibilityInfo.addEventListener(
    "reduceMotionChanged",
    (habilitada) => {
      if (ciclo === cicloAtual) {
        publicarPreferencia(habilitada);
      }
    },
  );

  void AccessibilityInfo.isReduceMotionEnabled()
    .then((habilitada) => {
      if (ciclo === cicloAtual && versaoPreferencia === versaoInicial) {
        publicarPreferencia(habilitada);
      }
    })
    .catch(() => {
      if (ciclo === cicloAtual && versaoPreferencia === versaoInicial) {
        publicarPreferencia(true);
      }
    });
}

function observarPreferencia(observador: ObservadorReducaoMovimento) {
  observadores.add(observador);
  iniciarObservacao();

  return () => {
    observadores.delete(observador);
    if (observadores.size === 0) {
      assinatura?.remove();
      assinatura = null;
      cicloAtual += 1;
    }
  };
}

export function useReducaoMovimento(): boolean | null {
  const [reduzirMovimento, definirReducaoMovimento] = useState<boolean | null>(
    () => preferenciaCache,
  );

  useEffect(
    () => observarPreferencia(definirReducaoMovimento),
    [definirReducaoMovimento],
  );

  return reduzirMovimento;
}
