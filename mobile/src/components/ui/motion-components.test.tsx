import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import type { ReactElement } from "react";
import {
  Animated,
  Pressable,
  type GestureResponderEvent,
} from "react-native";

const mockCleanups: (void | (() => void))[] = [];
const mockUseReducaoMovimento = jest.fn<() => boolean | null>();

jest.mock("react", () => ({
  ...jest.requireActual<typeof import("react")>("react"),
  useEffect: jest.fn((efeito: () => void | (() => void)) => {
    mockCleanups.push(efeito());
  }),
  useState: jest.fn((inicial: unknown | (() => unknown)) => [
    typeof inicial === "function" ? (inicial as () => unknown)() : inicial,
    jest.fn(),
  ]),
}));

jest.mock("@/theme/theme", () => ({
  useTemaApp: () => ({
    cores: {
      borda: "#ddd",
      bordaForte: "#ccc",
      marca: "#c00",
      marcaPressionada: "#a00",
      perigo: "#b00",
      sobreMarca: "#fff",
      sobreposicao: "#eee",
      texto: "#111",
    },
  }),
}));

jest.mock("@/theme/use-reduced-motion", () => ({
  useReducaoMovimento: mockUseReducaoMovimento,
}));

const mockAnimacaoTiming = {
  reset: jest.fn(),
  start: jest.fn(),
  stop: jest.fn(),
};
const mockAnimacaoParalela = {
  reset: jest.fn(),
  start: jest.fn(),
  stop: jest.fn(),
};
const mockTiming = jest
  .spyOn(Animated, "timing")
  .mockReturnValue(mockAnimacaoTiming);
const mockParallel = jest
  .spyOn(Animated, "parallel")
  .mockReturnValue(mockAnimacaoParalela);
const mockAnimatedPressable = "AnimatedPressable";
const mockCreateAnimatedComponent = jest
  .spyOn(Animated, "createAnimatedComponent")
  .mockReturnValue(mockAnimatedPressable as never);

const { AnimatedEntry } = jest.requireActual<typeof import("./animated-entry")>(
  "./animated-entry",
);
const { AppButton } =
  jest.requireActual<typeof import("./app-button")>("./app-button");

interface AnimatedEntryPropsTest {
  style: [unknown, { opacity: Animated.Value }];
}

interface AppButtonPropsTest {
  onPressIn: (evento: GestureResponderEvent) => void;
  onPressOut: (evento: GestureResponderEvent) => void;
  style: (estado: { pressed: boolean }) => [
    unknown,
    { transform: [{ scale: Animated.Value }] },
  ];
}

describe("superfícies animadas", () => {
  beforeEach(() => {
    mockCleanups.length = 0;
    mockTiming.mockClear();
    mockParallel.mockClear();
    mockAnimacaoParalela.stop.mockClear();
  });

  test("vincula a escala do botão a uma superfície Animated", () => {
    expect(mockCreateAnimatedComponent).toHaveBeenCalledWith(Pressable);

    mockUseReducaoMovimento.mockReturnValue(false);
    const elemento = AppButton({ rotulo: "Continuar" }) as ReactElement;

    expect(elemento.type).toBe(mockAnimatedPressable);
  });

  test("mantém o cabeçalho visível enquanto a preferência é desconhecida", () => {
    mockUseReducaoMovimento.mockReturnValue(null);

    const elemento = AnimatedEntry({
      children: "Cabeçalho",
    }) as ReactElement<AnimatedEntryPropsTest>;

    const opacidade = elemento.props.style[1].opacity as unknown as {
      __getValue: () => number;
    };
    expect(opacidade.__getValue()).toBe(1);
    expect(mockTiming).not.toHaveBeenCalled();
  });

  test("não agenda timing quando a redução de movimento está ativa", () => {
    mockUseReducaoMovimento.mockReturnValue(true);

    AnimatedEntry({ children: "Cabeçalho" });

    expect(mockTiming).not.toHaveBeenCalled();
  });

  test("preserva callbacks e interrompe a escala ao desmontar", () => {
    mockUseReducaoMovimento.mockReturnValue(false);
    const aoPressionar = jest.fn();
    const aoSoltar = jest.fn();
    const evento = {} as GestureResponderEvent;
    const elemento = AppButton({
      onPressIn: aoPressionar,
      onPressOut: aoSoltar,
      rotulo: "Continuar",
    }) as ReactElement<AppButtonPropsTest>;
    const escala = elemento.props.style({ pressed: false })[1].transform[0].scale;
    const pararEscala = jest.spyOn(escala, "stopAnimation");

    elemento.props.onPressIn(evento);
    elemento.props.onPressOut(evento);
    mockCleanups.forEach((cleanup) => cleanup?.());

    expect(aoPressionar).toHaveBeenCalledWith(evento);
    expect(aoSoltar).toHaveBeenCalledWith(evento);
    expect(pararEscala).toHaveBeenCalled();
  });

  test("interrompe a entrada ao desmontar", () => {
    mockUseReducaoMovimento.mockReturnValue(false);

    AnimatedEntry({ children: "Cabeçalho" });
    mockCleanups.forEach((cleanup) => cleanup?.());

    expect(mockAnimacaoParalela.stop).toHaveBeenCalled();
  });
});
