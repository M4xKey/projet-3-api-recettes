const express = require("express");
const recettesRouter = require("./routes/recettes");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use("/recettes", recettesRouter);

app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});
