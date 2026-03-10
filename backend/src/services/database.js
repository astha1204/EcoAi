// src/services/database.js
// ─────────────────────────────────────────
//  MongoDB Atlas — real persistent storage
//  Drop-in replacement for in-memory store
// ─────────────────────────────────────────
const { getDB } = require("./mongoClient");

const Database = {

  // ── Products (Module 1) ──
  async saveProduct(record) {
    const db = await getDB();
    await db.collection("products").insertOne(record);
    return record;
  },

  async getProducts() {
    const db = await getDB();
    return db.collection("products")
      .find({}, { projection: { _id: 0 } })
      .sort({ created_at: -1 })
      .toArray();
  },

  async getProductById(id) {
    const db = await getDB();
    return db.collection("products").findOne({ id }, { projection: { _id: 0 } });
  },

  // ── Proposals (Module 2) ──
  async saveProposal(record) {
    const db = await getDB();
    await db.collection("proposals").insertOne(record);
    return record;
  },

  async getProposals() {
    const db = await getDB();
    return db.collection("proposals")
      .find({}, { projection: { _id: 0 } })
      .sort({ created_at: -1 })
      .toArray();
  },

  async getProposalById(id) {
    const db = await getDB();
    return db.collection("proposals").findOne({ id }, { projection: { _id: 0 } });
  },

  // ── Stats ──
  async getStats() {
    const db = await getDB();
    const [totalProducts, totalProposals, needsReview, categories] = await Promise.all([
      db.collection("products").countDocuments(),
      db.collection("proposals").countDocuments(),
      db.collection("products").countDocuments({ needs_review: true }),
      db.collection("products").distinct("primary_category"),
    ]);
    return { total_products: totalProducts, total_proposals: totalProposals, needs_review: needsReview, categories };
  },
};

module.exports = Database;