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
  Bell: () => null,
  CheckCircle2: () => null,
  ChevronRight: () => null,
  Flame: () => null,
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
      estado: "autenticado",
      usuario: { displayName: "Ana", id: "user-1" },
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
    const anelAmpliado = encontrarElemento(
      metricas,
      (elemento) =>
        elemento.props.accessibilityLabel === "inicio.tarefasRotulo: 12345",
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
    expect(StyleSheet.flatten(anelAmpliado?.props.style)).toMatchObject({
      height: 112,
      width: 112,
    });
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
      backgroundColor: "elevado",
      borderColor: "marcaContorno",
      borderWidth: 1,
    });
    const estiloAcao =
      typeof acao?.props.style === "function"
        ? acao.props.style({ pressed: false })
        : acao?.props.style;
    expect(StyleSheet.flatten(estiloAcao)).toMatchObject({
      backgroundColor: "marca",
    });
  });
});
