import Svg, { Circle } from "react-native-svg";

import { useTemaApp } from "@/theme/theme";

interface WeeklyArcProps {
  progresso: number;
  tamanho?: number;
  rotulo: string;
}

export function WeeklyArc({
  progresso,
  tamanho = 88,
  rotulo,
}: WeeklyArcProps) {
  const tema = useTemaApp();
  const raio = 34;
  const circunferencia = 2 * Math.PI * raio;
  const valor = Math.max(0, Math.min(1, progresso));

  return (
    <Svg
      accessibilityLabel={rotulo}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(valor * 100) }}
      height={tamanho}
      viewBox="0 0 88 88"
      width={tamanho}
    >
      <Circle
        cx="44"
        cy="44"
        fill="none"
        r={raio}
        stroke={tema.cores.marcaSuave}
        strokeWidth="9"
      />
      <Circle
        cx="44"
        cy="44"
        fill="none"
        r={raio}
        stroke={tema.cores.marca}
        strokeDasharray={`${circunferencia} ${circunferencia}`}
        strokeDashoffset={circunferencia * (1 - valor)}
        strokeLinecap="round"
        strokeWidth="9"
        transform="rotate(-90 44 44)"
      />
    </Svg>
  );
}
