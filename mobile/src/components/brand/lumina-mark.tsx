import Svg, { Circle, Ellipse, Polygon } from "react-native-svg";

import { useTemaApp } from "@/theme/theme";

interface LuminaMarkProps {
  tamanho?: number;
  decorativo?: boolean;
}

export function LuminaMark({
  tamanho = 40,
  decorativo = false,
}: LuminaMarkProps) {
  const tema = useTemaApp();

  return (
    <Svg
      accessibilityElementsHidden={decorativo}
      accessibilityLabel={decorativo ? undefined : "Lumina"}
      accessible={!decorativo}
      height={tamanho}
      viewBox="0 0 64 64"
      width={tamanho}
    >
      <Ellipse
        cx="31"
        cy="31.25"
        fill={tema.cores.marcaContorno}
        rx="22.5"
        ry="21.9"
      />
      <Ellipse
        cx="33.75"
        cy="34.25"
        fill={tema.cores.marcaSuave}
        rx="19.75"
        ry="19.1"
      />
      <Polygon
        fill={tema.cores.marca}
        points="12,45 50.6,32.2 52.5,38.1 13.8,50.9"
      />
      <Circle cx="12.8" cy="48" fill={tema.cores.marca} r="3.1" />
      <Circle cx="51.6" cy="35.1" fill={tema.cores.marca} r="3.1" />
      <Circle cx="52.6" cy="13.6" fill={tema.cores.marca} r="4" />
    </Svg>
  );
}
