import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

export function useReducaoMovimento(): boolean | null {
  const [reduzirMovimento, definirReducaoMovimento] = useState<boolean | null>(
    null,
  );

  useEffect(() => {
    let ativo = true;
    const assinatura = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      definirReducaoMovimento,
    );

    void AccessibilityInfo.isReduceMotionEnabled()
      .then((habilitada) => {
        if (ativo) {
          definirReducaoMovimento(habilitada);
        }
      })
      .catch(() => {
        if (ativo) {
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
