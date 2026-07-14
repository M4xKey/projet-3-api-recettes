function estTempsPreparationValide(valeur) {
  return typeof valeur === "number" && Number.isFinite(valeur) && valeur > 0;
}

function champsRequisPresents({ titre, ingredients, tempsPreparation }) {
  return Boolean(titre && ingredients && tempsPreparation);
}

module.exports = { estTempsPreparationValide, champsRequisPresents };
