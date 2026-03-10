// src/services/mongoClient.js
// Shared MongoDB connection — one connection reused across the app
const { MongoClient } = require("mongodb");
const config = require("../config");

let client = null;
let db     = null;

async function connect() {
  if (db) return db; // already connected, reuse
  client = new MongoClient(config.mongo.uri);
  await client.connect();
  db = client.db(config.mongo.dbName);
  console.log("✅ Connected to MongoDB Atlas");
  return db;
}

async function getDB() {
  if (!db) await connect();
  return db;
}

// Graceful shutdown
process.on("SIGINT", async () => {
  if (client) await client.close();
  process.exit(0);
});

module.exports = { connect, getDB };