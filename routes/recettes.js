const express = require("express");
const router = express.Router();
const db = require("../db/database");
const authentifier = require("../middlewares/auth");
const { estTempsPreparationValide, champsRequisPresents } = require("../validation/recette");

function formater(row) {
  return { ...row, ingredients: JSON.parse(row.ingredients) };
}

// GET /recettes - lister toutes les recettes
router.get("/", (req, res) => {
  const recettes = db.prepare("SELECT * FROM recettes").all();
  res.json(recettes.map(formater));
});

// GET /recettes/:id - récupérer une recette par son id
router.get("/:id", (req, res) => {
  const recette = db.prepare("SELECT * FROM recettes WHERE id = ?").get(req.params.id);
  if (!recette) {
    return res.status(404).json({ message: "Recette non trouvée" });
  }
  res.json(formater(recette));
});

// POST /recettes - créer une nouvelle recette (connecté)
router.post("/", authentifier, (req, res) => {
  const { titre, ingredients, tempsPreparation } = req.body;

  if (!champsRequisPresents({ titre, ingredients, tempsPreparation })) {
    return res.status(400).json({
      message: "Les champs titre, ingredients et tempsPreparation sont requis",
    });
  }

  if (!estTempsPreparationValide(tempsPreparation)) {
    return res.status(400).json({
      message: "tempsPreparation doit être un nombre positif",
    });
  }

  const resultat = db
    .prepare(
      "INSERT INTO recettes (titre, ingredients, tempsPreparation, user_id) VALUES (?, ?, ?, ?)"
    )
    .run(titre, JSON.stringify(ingredients), tempsPreparation, req.user.id);

  const nouvelleRecette = db
    .prepare("SELECT * FROM recettes WHERE id = ?")
    .get(resultat.lastInsertRowid);

  res.status(201).json(formater(nouvelleRecette));
});

// PUT /recettes/:id - modifier une recette existante (connecté + propriétaire)
router.put("/:id", authentifier, (req, res) => {
  const recette = db.prepare("SELECT * FROM recettes WHERE id = ?").get(req.params.id);
  if (!recette) {
    return res.status(404).json({ message: "Recette non trouvée" });
  }
  if (recette.user_id !== req.user.id) {
    return res.status(403).json({ message: "Vous n'êtes pas propriétaire de cette recette" });
  }

  const { titre, ingredients, tempsPreparation } = req.body;

  if (tempsPreparation !== undefined && !estTempsPreparationValide(tempsPreparation)) {
    return res.status(400).json({
      message: "tempsPreparation doit être un nombre positif",
    });
  }

  const nouveauTitre = titre !== undefined ? titre : recette.titre;
  const nouveauxIngredients =
    ingredients !== undefined ? JSON.stringify(ingredients) : recette.ingredients;
  const nouveauTemps =
    tempsPreparation !== undefined ? tempsPreparation : recette.tempsPreparation;

  db.prepare(
    "UPDATE recettes SET titre = ?, ingredients = ?, tempsPreparation = ? WHERE id = ?"
  ).run(nouveauTitre, nouveauxIngredients, nouveauTemps, recette.id);

  const recetteMaj = db.prepare("SELECT * FROM recettes WHERE id = ?").get(recette.id);
  res.json(formater(recetteMaj));
});

// DELETE /recettes/:id - supprimer une recette (connecté + propriétaire)
router.delete("/:id", authentifier, (req, res) => {
  const recette = db.prepare("SELECT * FROM recettes WHERE id = ?").get(req.params.id);
  if (!recette) {
    return res.status(404).json({ message: "Recette non trouvée" });
  }
  if (recette.user_id !== req.user.id) {
    return res.status(403).json({ message: "Vous n'êtes pas propriétaire de cette recette" });
  }

  db.prepare("DELETE FROM recettes WHERE id = ?").run(recette.id);
  res.json(formater(recette));
});

module.exports = router;
