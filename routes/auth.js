const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../db/database");

const router = express.Router();
const SALT_ROUNDS = 10;

function genererToken(user) {
  return jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
}

// POST /auth/register - créer un compte
router.post("/register", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Les champs email et password sont requis" });
  }

  const dejaExistant = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (dejaExistant) {
    return res.status(409).json({ message: "Un compte existe déjà avec cet email" });
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const resultat = db
    .prepare("INSERT INTO users (email, password_hash) VALUES (?, ?)")
    .run(email, passwordHash);

  const user = { id: resultat.lastInsertRowid, email };
  res.status(201).json({ token: genererToken(user) });
});

// POST /auth/login - se connecter
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Les champs email et password sont requis" });
  }

  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (!user) {
    return res.status(401).json({ message: "Email ou mot de passe incorrect" });
  }

  const motDePasseValide = await bcrypt.compare(password, user.password_hash);
  if (!motDePasseValide) {
    return res.status(401).json({ message: "Email ou mot de passe incorrect" });
  }

  res.json({ token: genererToken(user) });
});

module.exports = router;
