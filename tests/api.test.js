import { describe, it, expect, afterAll } from "vitest";
import request from "supertest";
import app from "../app.js";
import prisma from "../db/prisma.js";

function emailUnique(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}@vitest.test`;
}

afterAll(async () => {
  await prisma.recette.deleteMany({ where: { user: { email: { endsWith: "@vitest.test" } } } });
  await prisma.user.deleteMany({ where: { email: { endsWith: "@vitest.test" } } });
  await prisma.$disconnect();
});

describe("Auth", () => {
  it("POST /auth/register - inscription réussie", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({ email: emailUnique("register"), password: "motdepasse123" });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
  });

  it("POST /auth/login - connexion réussie", async () => {
    const email = emailUnique("login-ok");
    const password = "motdepasse123";
    await request(app).post("/auth/register").send({ email, password });

    const res = await request(app).post("/auth/login").send({ email, password });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it("POST /auth/login - mot de passe incorrect", async () => {
    const email = emailUnique("login-ko");
    await request(app)
      .post("/auth/register")
      .send({ email, password: "motdepasse123" });

    const res = await request(app)
      .post("/auth/login")
      .send({ email, password: "mauvais-mot-de-passe" });

    expect(res.status).toBe(401);
  });
});

describe("Recettes", () => {
  it("POST /recettes - échoue sans token (401)", async () => {
    const res = await request(app).post("/recettes").send({
      titre: "Tarte aux pommes",
      ingredients: ["pommes", "pâte"],
      tempsPreparation: 45,
    });

    expect(res.status).toBe(401);
  });

  it("POST /recettes - réussit avec un token valide (201)", async () => {
    const email = emailUnique("create-recette");
    const registerRes = await request(app)
      .post("/auth/register")
      .send({ email, password: "motdepasse123" });
    const token = registerRes.body.token;

    const res = await request(app)
      .post("/recettes")
      .set("Authorization", `Bearer ${token}`)
      .send({
        titre: "Tarte aux pommes",
        ingredients: ["pommes", "pâte"],
        tempsPreparation: 45,
      });

    expect(res.status).toBe(201);
    expect(res.body.titre).toBe("Tarte aux pommes");
  });

  it("DELETE /recettes/:id - échoue si la recette appartient à un autre utilisateur (403)", async () => {
    const emailA = emailUnique("owner");
    const registerResA = await request(app)
      .post("/auth/register")
      .send({ email: emailA, password: "motdepasse123" });
    const tokenA = registerResA.body.token;

    const creationRes = await request(app)
      .post("/recettes")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({
        titre: "Recette d'Alice",
        ingredients: ["secret"],
        tempsPreparation: 10,
      });
    const recetteId = creationRes.body.id;

    const emailB = emailUnique("intrus");
    const registerResB = await request(app)
      .post("/auth/register")
      .send({ email: emailB, password: "motdepasse123" });
    const tokenB = registerResB.body.token;

    const res = await request(app)
      .delete(`/recettes/${recetteId}`)
      .set("Authorization", `Bearer ${tokenB}`);

    expect(res.status).toBe(403);
  });
});
