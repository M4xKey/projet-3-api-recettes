const express = require("express");
const router = express.Router();
const prisma = require("../db/prisma");
const authentifier = require("../middlewares/auth");

// GET /tags - lister tous les tags
router.get("/", async (req, res) => {
  const tags = await prisma.tag.findMany();
  res.json(tags);
});

// POST /tags - créer un tag (connecté)
router.post("/", authentifier, async (req, res) => {
  const { nom } = req.body;

  if (!nom) {
    return res.status(400).json({ message: "Le champ nom est requis" });
  }

  const dejaExistant = await prisma.tag.findUnique({ where: { nom } });
  if (dejaExistant) {
    return res.status(409).json({ message: "Un tag existe déjà avec ce nom" });
  }

  const tag = await prisma.tag.create({ data: { nom } });
  res.status(201).json(tag);
});

// DELETE /tags/:id - supprimer un tag (connecté)
router.delete("/:id", authentifier, async (req, res) => {
  const id = Number(req.params.id);
  const tag = await prisma.tag.findUnique({ where: { id } });
  if (!tag) {
    return res.status(404).json({ message: "Tag non trouvé" });
  }

  await prisma.tag.delete({ where: { id } });
  res.json(tag);
});

module.exports = router;
