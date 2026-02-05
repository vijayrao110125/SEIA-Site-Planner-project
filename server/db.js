import dotenv from "dotenv";
import { MongoClient } from "mongodb";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI 
const DB_NAME = process.env.MONGODB_DB || "seia_site_planner";
const COLLECTION_NAME = process.env.MONGODB_COLLECTION || "sessions";

let client;
let collection;

async function getCollection() {
  if (collection) return collection;
  if (!MONGODB_URI) {
    throw new Error("Missing MONGODB_URI environment variable");
  }
  client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(DB_NAME);
  collection = db.collection(COLLECTION_NAME);
  await collection.createIndex({ updatedAt: -1 });
  await collection.createIndex(
    { nameNormalized: 1 },
    {
      unique: true,
      partialFilterExpression: { nameNormalized: { $type: "string", $ne: "" } }
    }
  );
  return collection;
}

function normalizeName(name) {
  if (typeof name !== "string") return null;
  const trimmed = name.trim();
  if (!trimmed) return null;
  return trimmed.toLowerCase();
}

export async function createSession({ id, name, payload }) {
  const now = new Date().toISOString();
  const col = await getCollection();
  const nameNormalized = normalizeName(name);
  if (nameNormalized) {
    const existing = await col.findOne({ nameNormalized }, { projection: { _id: 1 } });
    if (existing) {
      const err = new Error("Session name already exists");
      err.code = 11000;
      throw err;
    }
  }
  await col.insertOne({
    id,
    name: name ?? null,
    nameNormalized,
    payload,
    createdAt: now,
    updatedAt: now
  });
  return { id, createdAt: now, updatedAt: now };
}

export async function listSessions() {
  const col = await getCollection();
  return col
    .find({}, { projection: { _id: 0, id: 1, name: 1, createdAt: 1, updatedAt: 1 } })
    .sort({ updatedAt: -1 })
    .toArray();
}

export async function getSession(id) {
  const col = await getCollection();
  const row = await col.findOne({ id }, { projection: { _id: 0 } });
  return row || null;
}

export async function updateSession(id, { name, payload }) {
  const now = new Date().toISOString();
  const col = await getCollection();
  const nameNormalized = normalizeName(name);
  if (nameNormalized) {
    const existing = await col.findOne(
      { nameNormalized, id: { $ne: id } },
      { projection: { _id: 1 } }
    );
    if (existing) {
      const err = new Error("Session name already exists");
      err.code = 11000;
      throw err;
    }
  }
  const res = await col.updateOne(
    { id },
    { $set: { name: name ?? null, nameNormalized, payload, updatedAt: now } }
  );
  return res.matchedCount ? { id, updatedAt: now } : null;
}

export async function deleteSession(id) {
  const col = await getCollection();
  const res = await col.deleteOne({ id });
  return res.deletedCount ? { id } : null;
}
