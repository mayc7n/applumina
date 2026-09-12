import { describe, expect, test } from "@jest/globals";
import type { ReactElement } from "react";

import { GrupoSelecao } from "./selection-group";

describe("grupo de seleção", () => {
  test("expõe o rótulo e o papel de grupo de rádio para tecnologias assistivas", () => {
    const grupo = GrupoSelecao({
      children: "Alta",
      rotulo: "Prioridade",
    }) as ReactElement<{
      accessibilityLabel: string;
      accessibilityRole: string;
    }>;

    expect(grupo.props.accessibilityRole).toBe("radiogroup");
    expect(grupo.props.accessibilityLabel).toBe("Prioridade");
  });
});
