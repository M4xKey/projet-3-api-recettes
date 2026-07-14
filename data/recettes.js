const fs = require("fs");
const path = require("path");

const cheminFichier = path.join(__dirname, "recettes.json");

// Au démarrage, on charge les recettes depuis le fichier JSON
let recettes = JSON.parse(fs.readFileSync(cheminFichier, "utf-8"));

// À appeler après chaque modification (POST/PUT/DELETE) pour écrire
// le tableau en mémoire dans le fichier, et ne pas perdre les données
function sauvegarder() {
  fs.writeFileSync(cheminFichier, JSON.stringify(recettes, null, 2));
}

module.exports = { recettes, sauvegarder };
