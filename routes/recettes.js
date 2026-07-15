const express = require("express");
const router = express.Router();
const prisma = require("../db/prisma");
const authentifier = require("../middlewares/auth");
const { estTempsPreparationValide, champsRequisPresents } = require("../validation/recette");

// GET /recettes - lister toutes les recettes
router.get("/", async (req, res) => {
  const recettes = await prisma.recette.findMany();
  res.json(recettes);
});

// GET /recettes/:id - récupérer une recette par son id
router.get("/:id", async (req, res) => {
  const recette = await prisma.recette.findUnique({ where: { id: Number(req.params.id) } });
  if (!recette) {
    return res.status(404).json({ message: "Recette non trouvée" });
  }
  res.json(recette);
});

// POST /recettes - créer une nouvelle recette (connecté)
router.post("/", authentifier, async (req, res) => {
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

  const nouvelleRecette = await prisma.recette.create({
    data: { titre, ingredients, tempsPreparation, userId: req.user.id },
  });

  res.status(201).json(nouvelleRecette);
});

// PUT /recettes/:id - modifier une recette existante (connecté + propriétaire)
router.put("/:id", authentifier, async (req, res) => {
  const id = Number(req.params.id);
  const recette = await prisma.recette.findUnique({ where: { id } });
  if (!recette) {
    return res.status(404).json({ message: "Recette non trouvée" });
  }
  if (recette.userId !== req.user.id) {
    return res.status(403).json({ message: "Vous n'êtes pas propriétaire de cette recette" });
  }

  const { titre, ingredients, tempsPreparation } = req.body;

  if (tempsPreparation !== undefined && !estTempsPreparationValide(tempsPreparation)) {
    return res.status(400).json({
      message: "tempsPreparation doit être un nombre positif",
    });
  }

  const recetteMaj = await prisma.recette.update({
    where: { id },
    data: { titre, ingredients, tempsPreparation },
  });

  res.json(recetteMaj);
});

// DELETE /recettes/:id - supprimer une recette (connecté + propriétaire)
router.delete("/:id", authentifier, async (req, res) => {
  const id = Number(req.params.id);
  const recette = await prisma.recette.findUnique({ where: { id } });
  if (!recette) {
    return res.status(404).json({ message: "Recette non trouvée" });
  }
  if (recette.userId !== req.user.id) {
    return res.status(403).json({ message: "Vous n'êtes pas propriétaire de cette recette" });
  }

  await prisma.recette.delete({ where: { id } });
  res.json(recette);
});

module.exports = router;
