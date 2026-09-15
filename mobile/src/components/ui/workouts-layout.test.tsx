import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import { Children, type ReactNode } from "react";
import { StyleSheet } from "react-native";
import React from "react";
import { act, create } from "react-test-renderer";

const mockUseListaTreinos = jest.fn();
const mockUseCalendarioTreinos = jest.fn();

jest.mock("expo-router", () => ({ router: { push: jest.fn() } }));
jest.mock("expo-haptics", () => ({
  NotificationFeedbackType: { Success: "success" },
  notificationAsync: jest.fn(),
}));
jest.mock("lucide-react-native", () => ({
  Activity: () => null,
  Bike: () => null,
  ChevronLeft: () => null,
  ChevronRight: () => null,
  Dumbbell: () => null,
  Footprints: () => null,
  Image: () => null,
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
  useCalendarioTreinos: mockUseCalendarioTreinos,
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

describe("ação principal de treinos", () => {
  beforeEach(() => {
    mockUseCalendarioTreinos.mockReturnValue({
      data: [], isError: false, isLoading: false, isRefetching: false, refetch: jest.fn(),
    });
    mockUseListaTreinos.mockReturnValue({
      data: [],
      isError: false,
      isLoading: false,
      isRefetching: false,
      refetch: jest.fn(),
    });
  });

  test("mantém um CTA compacto sem camadas decorativas", () => {
    mockUseCalendarioTreinos.mockReturnValue({ data: [], isError: false, isLoading: false, isRefetching: false, refetch: jest.fn() });
    let arvore!: ReturnType<typeof create>;
    act(() => { arvore = create(React.createElement(TelaTreinos)); });
    const acao = arvore.root.find((elemento) => elemento.props.accessibilityLabel === "treinos.registrar");
    const filhos = acao.props.children;
    const estilo = acao.props.style({ pressed: false });

    expect(Children.toArray(filhos)).toHaveLength(2);
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
