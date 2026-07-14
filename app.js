require("dotenv").config();
const express = require("express");
const cors = require("cors");
const recettesRouter = require("./routes/recettes");
const authRouter = require("./routes/auth");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/recettes", recettesRouter);
app.use("/auth", authRouter);

module.exports = app;
