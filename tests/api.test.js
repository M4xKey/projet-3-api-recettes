import { describe, it, expect, afterAll } from "vitest";
import request from "supertest";
import app from "../app.js";
import prisma from "../db/prisma.js";

function emailUnique(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}@vitest.test`;
}

function nomUnique(prefix) {
  return `${prefix}-vitest-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

afterAll(async () => {
  await prisma.recette.deleteMany({ where: { user: { email: { endsWith: "@vitest.test" } } } });
  await prisma.user.deleteMany({ where: { email: { endsWith: "@vitest.test" } } });
  await prisma.categorie.deleteMany({ where: { nom: { contains: "-vitest-" } } });
  await prisma.tag.deleteMany({ where: { nom: { contains: "-vitest-" } } });
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

describe("Catégories et tags", () => {
  async function creerUtilisateurAvecRecette(prefixEmail, titre) {
    const email = emailUnique(prefixEmail);
    const registerRes = await request(app)
      .post("/auth/register")
      .send({ email, password: "motdepasse123" });
    const token = registerRes.body.token;

    const recetteRes = await request(app)
      .post("/recettes")
      .set("Authorization", `Bearer ${token}`)
      .send({ titre, ingredients: ["ingrédient"], tempsPreparation: 10 });

    return { token, recetteId: recetteRes.body.id };
  }

  it("POST /categories - crée une catégorie", async () => {
    const { token } = await creerUtilisateurAvecRecette("cat-create", "Recette");
    const res = await request(app)
      .post("/categories")
      .set("Authorization", `Bearer ${token}`)
      .send({ nom: nomUnique("Dessert") });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
  });

  it("POST /categories - refuse un nom déjà utilisé (409)", async () => {
    const { token } = await creerUtilisateurAvecRecette("cat-dup", "Recette");
    const nom = nomUnique("Dessert");

    await request(app).post("/categories").set("Authorization", `Bearer ${token}`).send({ nom });
    const res = await request(app)
      .post("/categories")
      .set("Authorization", `Bearer ${token}`)
      .send({ nom });

    expect(res.status).toBe(409);
  });

  it("POST /tags - crée un tag", async () => {
    const { token } = await creerUtilisateurAvecRecette("tag-create", "Recette");
    const res = await request(app)
      .post("/tags")
      .set("Authorization", `Bearer ${token}`)
      .send({ nom: nomUnique("Végétarien") });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
  });

  it("attache puis détache une catégorie et un tag sur une recette possédée", async () => {
    const { token, recetteId } = await creerUtilisateurAvecRecette("attach", "Tarte");

    const categorieRes = await request(app)
      .post("/categories")
      .set("Authorization", `Bearer ${token}`)
      .send({ nom: nomUnique("Dessert") });
    const categorieId = categorieRes.body.id;

    const tagRes = await request(app)
      .post("/tags")
      .set("Authorization", `Bearer ${token}`)
      .send({ nom: nomUnique("Végétarien") });
    const tagId = tagRes.body.id;

    const apresAttache = await request(app)
      .post(`/recettes/${recetteId}/categories/${categorieId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(apresAttache.status).toBe(200);
    expect(apresAttache.body.categories.map((c) => c.id)).toContain(categorieId);

    await request(app)
      .post(`/recettes/${recetteId}/tags/${tagId}`)
      .set("Authorization", `Bearer ${token}`);

    const apresDetache = await request(app)
      .delete(`/recettes/${recetteId}/categories/${categorieId}`)
      .set("Authorization", `Bearer ${token}`);
    expect(apresDetache.status).toBe(200);
    expect(apresDetache.body.categories.map((c) => c.id)).not.toContain(categorieId);
    expect(apresDetache.body.tags.map((t) => t.id)).toContain(tagId);
  });

  it("POST /recettes/:id/categories/:categorieId - échoue si la recette appartient à un autre utilisateur (403)", async () => {
    const { recetteId } = await creerUtilisateurAvecRecette("attach-owner", "Tarte");
    const { token: tokenIntrus } = await creerUtilisateurAvecRecette("attach-intrus", "Autre recette");

    const categorieRes = await request(app)
      .post("/categories")
      .set("Authorization", `Bearer ${tokenIntrus}`)
      .send({ nom: nomUnique("Dessert") });

    const res = await request(app)
      .post(`/recettes/${recetteId}/categories/${categorieRes.body.id}`)
      .set("Authorization", `Bearer ${tokenIntrus}`);

    expect(res.status).toBe(403);
  });
});
