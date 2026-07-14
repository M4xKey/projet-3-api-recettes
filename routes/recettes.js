const express = require("express");
const router = express.Router();
const { recettes, sauvegarder } = require("../data/recettes");

// GET /recettes - lister toutes les recettes
router.get("/", (req, res) => {
  res.json(recettes);
});

// GET /recettes/:id - récupérer une recette par son id
router.get("/:id", (req, res) => {
  const recette = recettes.find((r) => r.id === Number(req.params.id));
  if (!recette) {
    return res.status(404).json({ message: "Recette non trouvée" });
  }
  res.json(recette);
});

// POST /recettes - créer une nouvelle recette
router.post("/", (req, res) => {
  const { titre, ingredients, tempsPreparation } = req.body;

  if (!titre || !ingredients || !tempsPreparation) {
    return res.status(400).json({
      message: "Les champs titre, ingredients et tempsPreparation sont requis",
    });
  }

  const nouvelleRecette = {
    id: recettes.length > 0 ? Math.max(...recettes.map((r) => r.id)) + 1 : 1,
    titre,
    ingredients,
    tempsPreparation,
  };

  recettes.push(nouvelleRecette);
  sauvegarder();
  res.status(201).json(nouvelleRecette);
});

// PUT /recettes/:id - modifier une recette existante
router.put("/:id", (req, res) => {
  const recette = recettes.find((r) => r.id === Number(req.params.id));
  if (!recette) {
    return res.status(404).json({ message: "Recette non trouvée" });
  }

  const { titre, ingredients, tempsPreparation } = req.body;
  if (titre !== undefined) recette.titre = titre;
  if (ingredients !== undefined) recette.ingredients = ingredients;
  if (tempsPreparation !== undefined) recette.tempsPreparation = tempsPreparation;

  sauvegarder();
  res.json(recette);
});

// DELETE /recettes/:id - supprimer une recette
router.delete("/:id", (req, res) => {
  const index = recettes.findIndex((r) => r.id === Number(req.params.id));
  if (index === -1) {
    return res.status(404).json({ message: "Recette non trouvée" });
  }

  const [recetteSupprimee] = recettes.splice(index, 1);
  sauvegarder();
  res.json(recetteSupprimee);
});

module.exports = router;
