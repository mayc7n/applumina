import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import {
  Children,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import { StyleSheet } from "react-native";

const mockUseQuery = jest.fn();
const mockUseWindowDimensions = jest.fn();
const mockRouterPush = jest.fn();
let mockAutenticado = true;

jest.mock(
  "react-native/Libraries/Utilities/useWindowDimensions",
  () => ({ __esModule: true, default: mockUseWindowDimensions }),
);

jest.mock("@tanstack/react-query", () => ({ useQuery: mockUseQuery }));

jest.mock("expo-router", () => ({
  router: { push: mockRouterPush },
}));

jest.mock("expo-image", () => ({ Image: () => null }));

jest.mock("lucide-react-native", () => ({
  Activity: () => null,
  ArrowUpRight: () => null,
  CheckSquare2: () => null,
  CheckCircle2: () => null,
  ChevronRight: () => null,
  Plus: () => null,
  Sprout: () => null,
  UsersRound: () => null,
}));

jest.mock("@/i18n/idioma", () => ({
  useIdioma: () => ({
    idioma: "pt-BR",
    traduzir: (chave: string) => chave,
  }),
}));

jest.mock("@/store/auth-store", () => ({
  useArmazenamentoAutenticacao: (seletor: (estado: unknown) => unknown) =>
    seletor({
      estado: mockAutenticado ? "autenticado" : "nao_autenticado",
      usuario: mockAutenticado
        ? { displayName: "Ana", id: "user-1" }
        : undefined,
    }),
}));

jest.mock("@/theme/theme", () => ({
  useTemaApp: () => ({
    escuro: false,
    cores: new Proxy({}, { get: (_alvo, chave) => String(chave) }),
  }),
}));

const TelaInicio = jest.requireActual<
  typeof import("../../app/(app)/(tabs)/home")
>("../../app/(app)/(tabs)/home").default;

function encontrarElemento(
  raiz: ReactNode,
  predicado: (elemento: ReactElement<Record<string, unknown>>) => boolean,
): ReactElement<Record<string, unknown>> | undefined {
  if (!isValidElement<Record<string, unknown>>(raiz)) return undefined;
  if (predicado(raiz)) return raiz;

  for (const filho of Children.toArray(raiz.props.children as ReactNode)) {
    const encontrado = encontrarElemento(filho, predicado);
    if (encontrado) return encontrado;
  }

  return undefined;
}

function possuiRotuloDiasAtivos(raiz: ReactNode): boolean {
  return Boolean(
    encontrarElemento(
      raiz,
      (elemento) => elemento.props.rotulo === "inicio.diasAtivos",
    ),
  );
}

describe("cartão de atividade semanal", () => {
  beforeEach(() => {
    mockRouterPush.mockReset();
    mockAutenticado = true;
    mockUseQuery.mockReturnValue({
      data: {
        todayTasks: [],
        weeklyData: [
          {
            date: "2030-01-01",
            focusMins: 54321,
            habitRate: 1,
            productivityScore: 100,
            tasksCompleted: 12345,
          },
        ],
      },
      isError: false,
      isLoading: false,
      isRefetching: false,
      refetch: jest.fn(),
    });
  });

  test("empilha métricas e contém valores longos com fonte ampliada", () => {
    mockUseWindowDimensions.mockReturnValue({
      fontScale: 1.6,
      height: 800,
      scale: 2,
      width: 360,
    });

    const tela = TelaInicio();
    const metricas = encontrarElemento(tela, (elemento) => {
      const filhos = Children.toArray(elemento.props.children as ReactNode);
      return filhos.length === 3 && possuiRotuloDiasAtivos(filhos[0]);
    });
    const valorTarefas = encontrarElemento(
      metricas,
      (elemento) => elemento.props.children === 12345,
    );
    const valorFoco = encontrarElemento(
      metricas,
      (elemento) => elemento.props.children === 54321,
    );
    const arcoAmpliado = encontrarElemento(
      metricas,
      (elemento) => elemento.props.tamanho === 112,
    );
    expect(StyleSheet.flatten(metricas?.props.style)).toMatchObject({
      flexDirection: "column",
    });
    expect(valorTarefas?.props).toMatchObject({
      adjustsFontSizeToFit: true,
      numberOfLines: 1,
    });
    expect(valorFoco?.props).toMatchObject({
      adjustsFontSizeToFit: true,
      numberOfLines: 1,
    });
    expect(arcoAmpliado).toBeDefined();
  });

  test("mantém avatar acessível para a conta e um bloco hoje compacto", () => {
    mockUseWindowDimensions.mockReturnValue({
      fontScale: 1,
      height: 800,
      scale: 2,
      width: 360,
    });

    const tela = TelaInicio();
    const cabecalho = encontrarElemento(
      tela,
      (elemento) => Boolean(elemento.props.inicio),
    );
    const avatar = cabecalho?.props.inicio as ReactElement<Record<string, unknown>> | undefined;
    const blocoHoje = encontrarElemento(
      tela,
      (elemento) => {
        const estilo = StyleSheet.flatten(elemento.props.style as object) as {
          minHeight?: number;
        } | undefined;
        return estilo?.minHeight === 200;
      },
    );

    expect(avatar).toMatchObject({
      props: { accessibilityRole: "button" },
    });
    const onPress = avatar?.props.onPress;
    expect(typeof onPress).toBe("function");
    if (typeof onPress === "function") onPress();
    expect(mockRouterPush).toHaveBeenCalledWith("/account");
    expect(blocoHoje).toBeDefined();
  });

  test("mantém o bloco hoje leve e reserva a marca para a ação", () => {
    mockUseWindowDimensions.mockReturnValue({
      fontScale: 1,
      height: 800,
      scale: 2,
      width: 360,
    });

    const tela = TelaInicio();
    const blocoHoje = encontrarElemento(
      tela,
      (elemento) => {
        const estilo = StyleSheet.flatten(elemento.props.style as object) as {
          minHeight?: number;
        } | undefined;
        return estilo?.minHeight === 200;
      },
    );
    const acao = encontrarElemento(
      blocoHoje,
      (elemento) =>
        elemento.props.accessibilityRole === "button" &&
        typeof elemento.props.onPress === "function",
    );

    expect(StyleSheet.flatten(blocoHoje?.props.style)).toMatchObject({
      borderBottomRightRadius: 28,
      borderTopLeftRadius: 28,
      borderWidth: 1,
    });
    const estiloAcao =
      typeof acao?.props.style === "function"
        ? acao.props.style({ pressed: false })
        : acao?.props.style;
    expect(StyleSheet.flatten(estiloAcao)).toMatchObject({
      backgroundColor: "marca",
    });
    expect(acao?.props.accessibilityLabel).toBe("inicio.acaoTreino");
  });

  test("apresenta ações rápidas e trilho de ritmo para pessoa autenticada", () => {
    mockUseWindowDimensions.mockReturnValue({
      fontScale: 1,
      height: 800,
      scale: 2,
      width: 360,
    });

    const tela = TelaInicio();
    const botoes = [] as ReactElement<Record<string, unknown>>[];
    const percorrer = (raiz: ReactNode): void => {
      if (!isValidElement<Record<string, unknown>>(raiz)) return;
      if (
        raiz.props.accessibilityRole === "button" &&
        (raiz.props.accessibilityLabel === "inicio.novaTarefa" ||
          raiz.props.accessibilityLabel === "inicio.novoTreino")
      ) {
        botoes.push(raiz);
      }
      for (const filho of Children.toArray(raiz.props.children as ReactNode)) {
        percorrer(filho);
      }
    };
    percorrer(tela);

    const ritmo = encontrarElemento(
      tela,
      (elemento) => elemento.props.titulo === "inicio.ritmoTitulo",
    );

    expect(botoes).toHaveLength(2);
    expect(ritmo?.props.dias).toHaveLength(7);
    expect(typeof botoes[0].props.onPress).toBe("function");
    expect(typeof botoes[1].props.onPress).toBe("function");
    const onPressTarefa = botoes[0].props.onPress;
    const onPressTreino = botoes[1].props.onPress;
    if (typeof onPressTarefa === "function") onPressTarefa();
    if (typeof onPressTreino === "function") onPressTreino();
    expect(mockRouterPush).toHaveBeenNthCalledWith(1, "/tasks/new");
    expect(mockRouterPush).toHaveBeenNthCalledWith(2, "/workouts/new");
  });

  test("não mostra ações autenticadas para visitante", () => {
    mockAutenticado = false;
    mockUseWindowDimensions.mockReturnValue({
      fontScale: 1,
      height: 800,
      scale: 2,
      width: 360,
    });

    const tela = TelaInicio();
    const acaoRapida = encontrarElemento(
      tela,
      (elemento) =>
        elemento.props.accessibilityLabel === "inicio.novaTarefa" ||
        elemento.props.accessibilityLabel === "inicio.novoTreino",
    );

    expect(acaoRapida).toBeUndefined();
  });
});
