import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import {
  Children,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import { StyleSheet } from "react-native";

const mockUseListaTreinos = jest.fn();

jest.mock("expo-router", () => ({ router: { push: jest.fn() } }));
jest.mock("expo-haptics", () => ({
  NotificationFeedbackType: { Success: "success" },
  notificationAsync: jest.fn(),
}));
jest.mock("lucide-react-native", () => ({
  Activity: () => null,
  Bike: () => null,
  Dumbbell: () => null,
  Footprints: () => null,
  Plus: () => null,
  Waves: () => null,
}));
jest.mock("@/components/ui/animated-entry", () => ({
  AnimatedEntry: ({ children }: { children: ReactNode }) => children,
}));
jest.mock("@/components/ui/app-button", () => ({ AppButton: () => null }));
jest.mock("@/components/ui/feedback-state", () => ({ FeedbackState: () => null }));
jest.mock("@/components/workouts/workout-row", () => ({ WorkoutRow: () => null }));
jest.mock("@/features/workouts/hooks", () => ({
  useListaTreinos: mockUseListaTreinos,
}));
jest.mock("@/i18n/idioma", () => ({
  useIdioma: () => ({ idioma: "pt-BR", traduzir: (chave: string) => chave }),
}));
jest.mock("@/store/auth-store", () => ({
  useArmazenamentoAutenticacao: (seletor: (estado: unknown) => unknown) =>
    seletor({ estado: "autenticado", usuario: { id: "user-1" } }),
}));
jest.mock("@/theme/theme", () => ({
  useTemaApp: () => ({
    cores: new Proxy({}, { get: (_alvo, chave) => String(chave) }),
  }),
}));

const TelaTreinos = jest.requireActual<
  typeof import("../../app/(app)/(tabs)/workouts")
>("../../app/(app)/(tabs)/workouts").default;

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

describe("ação principal de treinos", () => {
  beforeEach(() => {
    mockUseListaTreinos.mockReturnValue({
      data: [],
      isError: false,
      isLoading: false,
      isRefetching: false,
      refetch: jest.fn(),
    });
  });

  test("mantém um CTA compacto sem camadas decorativas", () => {
    const tela = TelaTreinos();
    const acao = encontrarElemento(
      tela,
      (elemento) => elemento.props.accessibilityLabel === "treinos.registrar",
    );
    const filhos = Children.toArray(acao?.props.children as ReactNode);
    const estilo = (
      acao?.props.style as
        | ((estado: { pressed: boolean }) => unknown)
        | undefined
    )?.({ pressed: false });

    expect(filhos).toHaveLength(2);
    expect(StyleSheet.flatten(estilo as object)).toMatchObject({
      borderRadius: 18,
      elevation: 1,
      minHeight: 104,
      padding: 16,
      shadowOpacity: 0.06,
      shadowRadius: 8,
    });
  });
});
