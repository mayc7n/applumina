import { describe, expect, jest, test } from "@jest/globals";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { StyleSheet } from "react-native";

import type { DiaRitmo } from "@/features/dashboard/home-metrics";

jest.mock("@/theme/theme", () => ({
  useTemaApp: () => ({
    cores: {
      borda: "#E9DED9",
      marca: "#C63C24",
      marcaSuave: "#FFF0EB",
      sobreposicao: "#F8F4F1",
      texto: "#201A18",
      textoSutil: "#8A7C75",
    },
  }),
}));

const { WeekRhythm } = jest.requireActual<
  typeof import("./week-rhythm")
>("./week-rhythm");

function criarDias(quantidade = 7): DiaRitmo[] {
  return Array.from({ length: quantidade }, (_, indice) => ({
    id: `2030-01-0${indice + 1}`,
    data: new Date(2030, 0, indice + 1, 12),
    rotulo: ["seg", "ter", "qua", "qui", "sex", "sáb", "dom"][indice],
    ativo: indice === 1 || indice === 6,
    hoje: indice === 6,
    rotuloAcessibilidade: `dia ${indice + 1}`,
  }));
}

describe("WeekRhythm", () => {
  test("renderiza sete células, estados e rótulos acessíveis", () => {
    let renderizacao: ReactTestRenderer | undefined;
    act(() => {
      renderizacao = create(
        <WeekRhythm
          descricao="2 de 7 dias com registros"
          dias={criarDias()}
          titulo="Seu ritmo"
        />,
      );
    });

    const celulas = [
      "2030-01-01",
      "2030-01-02",
      "2030-01-03",
      "2030-01-04",
      "2030-01-05",
      "2030-01-06",
      "2030-01-07",
    ].map((id) =>
      renderizacao!.root.findByProps({ testID: `week-rhythm-day-${id}` }),
    );
    const marcadorAtivo = renderizacao!.root.findByProps({
      testID: "week-rhythm-marker-2030-01-02",
    });
    const marcadorVazio = renderizacao!.root.findByProps({
      testID: "week-rhythm-marker-2030-01-01",
    });

    expect(renderizacao!.root.findByProps({ children: "Seu ritmo" })).toBeDefined();
    expect(renderizacao!.root.findByProps({ children: "2 de 7 dias com registros" })).toBeDefined();
    expect(celulas).toHaveLength(7);
    expect(celulas[1].props.accessibilityLabel).toBe("dia 2");
    expect(StyleSheet.flatten(marcadorAtivo.props.style)).toMatchObject({
      backgroundColor: "#C63C24",
    });
    expect(StyleSheet.flatten(marcadorVazio.props.style)).toMatchObject({
      backgroundColor: "#F8F4F1",
    });
    expect(
      StyleSheet.flatten(
        renderizacao!.root.findByProps({ testID: "week-rhythm-day-2030-01-07" })
          .props.style,
      ),
    ).toMatchObject({ borderColor: "#C63C24" });
  });

  test("não transforma células ausentes em ações", () => {
    let renderizacao: ReactTestRenderer | undefined;
    act(() => {
      renderizacao = create(
        <WeekRhythm
          descricao="sem registros"
          dias={criarDias(2)}
          titulo="Seu ritmo"
        />,
      );
    });

    const botoes = renderizacao!.root.findAll(
      (elemento) => elemento.props.accessibilityRole === "button",
    );
    expect(botoes).toHaveLength(0);
  });
});
