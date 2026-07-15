const express = require("express");
const router = express.Router();
const prisma = require("../db/prisma");
const authentifier = require("../middlewares/auth");

// GET /categories - lister toutes les catégories
router.get("/", async (req, res) => {
  const categories = await prisma.categorie.findMany();
  res.json(categories);
});

// POST /categories - créer une catégorie (connecté)
router.post("/", authentifier, async (req, res) => {
  const { nom } = req.body;

  if (!nom) {
    return res.status(400).json({ message: "Le champ nom est requis" });
  }

  const dejaExistante = await prisma.categorie.findUnique({ where: { nom } });
  if (dejaExistante) {
    return res.status(409).json({ message: "Une catégorie existe déjà avec ce nom" });
  }

  const categorie = await prisma.categorie.create({ data: { nom } });
  res.status(201).json(categorie);
});

// DELETE /categories/:id - supprimer une catégorie (connecté)
router.delete("/:id", authentifier, async (req, res) => {
  const id = Number(req.params.id);
  const categorie = await prisma.categorie.findUnique({ where: { id } });
  if (!categorie) {
    return res.status(404).json({ message: "Catégorie non trouvée" });
  }

  await prisma.categorie.delete({ where: { id } });
  res.json(categorie);
});

module.exports = router;
