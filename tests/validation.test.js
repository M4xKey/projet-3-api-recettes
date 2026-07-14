import { describe, it, expect } from "vitest";
import { estTempsPreparationValide, champsRequisPresents } from "../validation/recette.js";

describe("estTempsPreparationValide", () => {
  it("accepte un nombre positif", () => {
    expect(estTempsPreparationValide(10)).toBe(true);
  });

  it("accepte un nombre décimal positif", () => {
    expect(estTempsPreparationValide(0.5)).toBe(true);
  });

  it("refuse zéro", () => {
    expect(estTempsPreparationValide(0)).toBe(false);
  });

  it("refuse un nombre négatif", () => {
    expect(estTempsPreparationValide(-5)).toBe(false);
  });

  it("refuse une chaîne de caractères", () => {
    expect(estTempsPreparationValide("10")).toBe(false);
  });

  it("refuse NaN", () => {
    expect(estTempsPreparationValide(NaN)).toBe(false);
  });

  it("refuse Infinity", () => {
    expect(estTempsPreparationValide(Infinity)).toBe(false);
  });

  it("refuse null et undefined", () => {
    expect(estTempsPreparationValide(null)).toBe(false);
    expect(estTempsPreparationValide(undefined)).toBe(false);
  });
});

describe("champsRequisPresents", () => {
  it("accepte une recette avec tous les champs présents", () => {
    expect(
      champsRequisPresents({ titre: "Tarte", ingredients: ["pomme"], tempsPreparation: 30 })
    ).toBe(true);
  });

  it("refuse si le titre est manquant", () => {
    expect(
      champsRequisPresents({ titre: "", ingredients: ["pomme"], tempsPreparation: 30 })
    ).toBe(false);
  });

  it("refuse si les ingrédients sont manquants", () => {
    expect(
      champsRequisPresents({ titre: "Tarte", ingredients: undefined, tempsPreparation: 30 })
    ).toBe(false);
  });

  it("refuse si tempsPreparation est manquant", () => {
    expect(
      champsRequisPresents({ titre: "Tarte", ingredients: ["pomme"], tempsPreparation: undefined })
    ).toBe(false);
  });

  it("refuse si tempsPreparation vaut 0 (comportement actuel : traité comme champ manquant, pas comme valeur invalide)", () => {
    expect(
      champsRequisPresents({ titre: "Tarte", ingredients: ["pomme"], tempsPreparation: 0 })
    ).toBe(false);
  });

  it("accepte un tableau d'ingrédients vide (comportement actuel, potentiellement à revoir)", () => {
    expect(
      champsRequisPresents({ titre: "Tarte", ingredients: [], tempsPreparation: 30 })
    ).toBe(true);
  });
});
