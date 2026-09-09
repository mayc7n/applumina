import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

export function useReducaoMovimento(): boolean | null {
  const [reduzirMovimento, definirReducaoMovimento] = useState<boolean | null>(
    null,
  );

  useEffect(() => {
    let ativo = true;
    let eventoRecebido = false;
    const assinatura = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      (habilitada) => {
        eventoRecebido = true;
        if (ativo) {
          definirReducaoMovimento(habilitada);
        }
      },
    );

    void AccessibilityInfo.isReduceMotionEnabled()
      .then((habilitada) => {
        if (ativo && !eventoRecebido) {
          definirReducaoMovimento(habilitada);
        }
      })
      .catch(() => {
        if (ativo && !eventoRecebido) {
          definirReducaoMovimento(true);
        }
      });

    return () => {
      ativo = false;
      assinatura.remove();
    };
  }, []);

  return reduzirMovimento;
}
