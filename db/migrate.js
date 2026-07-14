const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");
const db = require("./database");

const TEST_EMAIL = "test@test.com";
const TEST_PASSWORD = "test1234";

async function migrer() {
  let user = db.prepare("SELECT * FROM users WHERE email = ?").get(TEST_EMAIL);

  if (!user) {
    const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);
    const resultat = db
      .prepare("INSERT INTO users (email, password_hash) VALUES (?, ?)")
      .run(TEST_EMAIL, passwordHash);
    user = { id: resultat.lastInsertRowid };
    console.log(`Compte de test créé : ${TEST_EMAIL} / ${TEST_PASSWORD}`);
  } else {
    console.log("Le compte de test existe déjà, réutilisation.");
  }

  const ancienFichier = path.join(__dirname, "..", "data", "recettes.json");
  const anciennesRecettes = JSON.parse(fs.readFileSync(ancienFichier, "utf-8"));

  const insererRecette = db.prepare(
    "INSERT INTO recettes (titre, ingredients, tempsPreparation, user_id) VALUES (?, ?, ?, ?)"
  );

  for (const recette of anciennesRecettes) {
    const dejaPresente = db
      .prepare("SELECT id FROM recettes WHERE titre = ? AND user_id = ?")
      .get(recette.titre, user.id);
    if (dejaPresente) continue;

    insererRecette.run(
      recette.titre,
      JSON.stringify(recette.ingredients),
      recette.tempsPreparation,
      user.id
    );
    console.log(`Recette migrée : ${recette.titre}`);
  }

  console.log("Migration terminée.");
}

migrer();
