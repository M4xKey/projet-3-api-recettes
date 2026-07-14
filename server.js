require("dotenv").config();
const express = require("express");
const cors = require("cors");
const recettesRouter = require("./routes/recettes");
const authRouter = require("./routes/auth");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use("/recettes", recettesRouter);
app.use("/auth", authRouter);

app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});
