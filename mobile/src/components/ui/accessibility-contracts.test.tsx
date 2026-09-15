import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "@jest/globals";

const fonteTarefas = readFileSync(
  resolve(__dirname, "../../app/(app)/(tabs)/tasks.tsx"),
  "utf8",
);
const fonteDenuncia = readFileSync(
  resolve(__dirname, "../../app/(app)/friends/safety/[id].tsx"),
  "utf8",
);

describe("alvos de toque acessíveis", () => {
  test("mantém filtros de tarefas com alvo mínimo e expansão de toque", () => {
    expect(fonteTarefas).toContain("minHeight: 44");
    expect(fonteTarefas).toContain("hitSlop={2}");
  });

  test("mantém categorias de denúncia com alvo mínimo e expansão de toque", () => {
    expect(fonteDenuncia).toContain("hitSlop={2}");
    expect(fonteDenuncia).toContain("minHeight: 44");
  });
});
