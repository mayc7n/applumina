import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import type { ReactElement } from "react";
import {
  Animated,
  Pressable,
  type GestureResponderEvent,
} from "react-native";

const mockEfeitos: (() => void | (() => void))[] = [];
const mockCleanups: (void | (() => void))[] = [];
const mockEstados: unknown[] = [];
let mockIndiceEstado = 0;
const mockUseReducaoMovimento = jest.fn<() => boolean | null>();

jest.mock("react", () => ({
  ...jest.requireActual<typeof import("react")>("react"),
  useEffect: jest.fn((efeito: () => void | (() => void)) => {
    mockEfeitos.push(efeito);
  }),
  useState: jest.fn((inicial: unknown | (() => unknown)) => {
    const indice = mockIndiceEstado++;
    if (!(indice in mockEstados)) {
      mockEstados[indice] =
        typeof inicial === "function" ? (inicial as () => unknown)() : inicial;
    }
    return [mockEstados[indice], jest.fn()];
  }),
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
jest.spyOn(Animated, "parallel").mockReturnValue(mockAnimacaoParalela);

const { AnimatedEntry } = jest.requireActual<typeof import("./animated-entry")>(
  "./animated-entry",
);
const { AppButton } =
  jest.requireActual<typeof import("./app-button")>("./app-button");

interface AnimatedSurfacePropsTest {
  children: ReactElement<AppButtonPropsTest>;
  style: { transform: [{ scale: Animated.Value }] };
}

interface AnimatedEntryPropsTest {
  style: [
    unknown,
    {
      opacity: Animated.Value;
      transform: [{ translateY: Animated.Value }];
    },
  ];
}

interface AppButtonPropsTest {
  onPressIn: (evento: GestureResponderEvent) => void;
  onPressOut: (evento: GestureResponderEvent) => void;
  style: (estado: { pressed: boolean }) => unknown[];
}

function novaInstancia() {
  mockEstados.length = 0;
  mockIndiceEstado = 0;
  mockEfeitos.length = 0;
  mockCleanups.length = 0;
}

function renderizar<T>(render: () => T): T {
  mockIndiceEstado = 0;
  return render();
}

function executarEfeitos() {
  mockEfeitos.splice(0).forEach((efeito) => mockCleanups.push(efeito()));
}

function valorAtual(valor: Animated.Value): number {
  return (valor as unknown as { __getValue: () => number }).__getValue();
}

describe("superfícies animadas", () => {
  beforeEach(() => {
    novaInstancia();
    mockTiming.mockClear();
    mockAnimacaoParalela.stop.mockClear();
  });

  test("mantém escala em estilo estático de Animated.View e toque no Pressable", () => {
    mockUseReducaoMovimento.mockReturnValue(false);
    const estiloExterno = { marginTop: 8 };

    const superficie = renderizar(() =>
      AppButton({ rotulo: "Continuar", style: estiloExterno }),
    ) as ReactElement<AnimatedSurfacePropsTest>;

    expect(superficie.type).toBe(Animated.View);
    expect(typeof superficie.props.style).not.toBe("function");
    expect(superficie.props.style.transform[0].scale).toBeInstanceOf(
      Animated.Value,
    );
    expect(superficie.props.children.type).toBe(Pressable);
    expect(superficie.props.children.props.style({ pressed: false })).toContain(
      estiloExterno,
    );
  });

  test("não faz instância já visível desaparecer quando null muda para false", () => {
    mockUseReducaoMovimento.mockReturnValue(null);
    const inicial = renderizar(() =>
      AnimatedEntry({ children: "Cabeçalho" }),
    ) as ReactElement<AnimatedEntryPropsTest>;
    executarEfeitos();

    mockUseReducaoMovimento.mockReturnValue(false);
    const atualizado = renderizar(() =>
      AnimatedEntry({ children: "Cabeçalho" }),
    ) as ReactElement<AnimatedEntryPropsTest>;
    executarEfeitos();

    expect(valorAtual(inicial.props.style[1].opacity)).toBe(1);
    expect(valorAtual(atualizado.props.style[1].opacity)).toBe(1);
    expect(
      valorAtual(atualizado.props.style[1].transform[0].translateY),
    ).toBe(0);
    expect(mockTiming).not.toHaveBeenCalled();
  });

  test("anima montagem que já recebe false cacheado", () => {
    mockUseReducaoMovimento.mockReturnValue(false);

    const elemento = renderizar(() =>
      AnimatedEntry({ children: "Cabeçalho" }),
    ) as ReactElement<AnimatedEntryPropsTest>;

    expect(valorAtual(elemento.props.style[1].opacity)).toBe(0);
    expect(valorAtual(elemento.props.style[1].transform[0].translateY)).toBe(8);

    executarEfeitos();
    expect(mockTiming).toHaveBeenCalledTimes(2);
  });

  test("não agenda timing quando a redução de movimento está ativa", () => {
    mockUseReducaoMovimento.mockReturnValue(true);

    renderizar(() => AnimatedEntry({ children: "Cabeçalho" }));
    executarEfeitos();

    expect(mockTiming).not.toHaveBeenCalled();
  });

  test("preserva callbacks e interrompe a escala ao desmontar", () => {
    mockUseReducaoMovimento.mockReturnValue(false);
    const aoPressionar = jest.fn();
    const aoSoltar = jest.fn();
    const evento = {} as GestureResponderEvent;
    const raiz = renderizar(() =>
      AppButton({
        onPressIn: aoPressionar,
        onPressOut: aoSoltar,
        rotulo: "Continuar",
      }),
    ) as ReactElement<AnimatedSurfacePropsTest | AppButtonPropsTest>;
    const botao =
      raiz.type === Animated.View
        ? (raiz as ReactElement<AnimatedSurfacePropsTest>).props.children
        : (raiz as ReactElement<AppButtonPropsTest>);
    const escala =
      raiz.type === Animated.View
        ? (raiz as ReactElement<AnimatedSurfacePropsTest>).props.style.transform[0]
            .scale
        : ((botao.props.style({ pressed: false })[1] as {
            transform: [{ scale: Animated.Value }];
          }).transform[0].scale);
    const pararEscala = jest.spyOn(escala, "stopAnimation");

    executarEfeitos();
    botao.props.onPressIn(evento);
    botao.props.onPressOut(evento);
    mockCleanups.forEach((cleanup) => cleanup?.());

    expect(aoPressionar).toHaveBeenCalledWith(evento);
    expect(aoSoltar).toHaveBeenCalledWith(evento);
    expect(pararEscala).toHaveBeenCalled();
  });

  test("interrompe a entrada ao desmontar", () => {
    mockUseReducaoMovimento.mockReturnValue(false);

    renderizar(() => AnimatedEntry({ children: "Cabeçalho" }));
    executarEfeitos();
    mockCleanups.forEach((cleanup) => cleanup?.());

    expect(mockAnimacaoParalela.stop).toHaveBeenCalled();
  });
});
