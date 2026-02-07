import dotenv from "dotenv";
import { MongoClient } from "mongodb";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB || "seia_site_planner";
const SESSIONS_COLLECTION_NAME = process.env.MONGODB_COLLECTION || "sessions";
const USERS_COLLECTION_NAME = process.env.MONGODB_USERS_COLLECTION || "users";

let client;
let sessionsCollection;
let usersCollection;

async function getClient() {
  if (client) return client;
  if (!MONGODB_URI) throw new Error("Missing MONGODB_URI environment variable");
  client = new MongoClient(MONGODB_URI);
  await client.connect();
  return client;
}

async function getSessionsCollection() {
  if (sessionsCollection) return sessionsCollection;
  const c = await getClient();
  const db = c.db(DB_NAME);
  sessionsCollection = db.collection(SESSIONS_COLLECTION_NAME);

  await sessionsCollection.createIndex({ updatedAt: -1 });

  // Migrate from global unique session names to per-user unique names.
  // Best-effort: drop old unique index if present, then create compound unique index.
  try {
    const idx = await sessionsCollection.indexes();
    const old = idx.find(
      (i) => i?.unique && JSON.stringify(i?.key) === JSON.stringify({ nameNormalized: 1 })
    );
    if (old?.name) await sessionsCollection.dropIndex(old.name);
  } catch {
    // ignore (index may not exist / permissions)
  }

  await sessionsCollection.createIndex(
    { userId: 1, nameNormalized: 1 },
    {
      unique: true,
      partialFilterExpression: { userId: { $type: "string" }, nameNormalized: { $type: "string" } }
    }
  );

  return sessionsCollection;
}

async function getUsersCollection() {
  if (usersCollection) return usersCollection;
  const c = await getClient();
  const db = c.db(DB_NAME);
  usersCollection = db.collection(USERS_COLLECTION_NAME);
  await usersCollection.createIndex(
    { emailNormalized: 1 },
    { unique: true, partialFilterExpression: { emailNormalized: { $type: "string" } } }
  );
  return usersCollection;
}

function normalizeName(name) {
  if (typeof name !== "string") return null;
  const trimmed = name.trim();
  if (!trimmed) return null;
  return trimmed.toLowerCase();
}

function normalizeEmail(email) {
  if (typeof email !== "string") return null;
  const trimmed = email.trim();
  if (!trimmed) return null;
  return trimmed.toLowerCase();
}

export async function createUser({ id, email, passwordHash }) {
  const now = new Date().toISOString();
  const col = await getUsersCollection();
  const emailNormalized = normalizeEmail(email);
  if (!emailNormalized) {
    const err = new Error("Email is required");
    err.code = "VALIDATION";
    throw err;
  }
  await col.insertOne({
    id,
    email,
    emailNormalized,
    name: null,
    passwordHash,
    createdAt: now,
    updatedAt: now
  });
  return { id, email, createdAt: now, updatedAt: now };
}

export async function createUserWithName({ id, email, name, passwordHash }) {
  const now = new Date().toISOString();
  const col = await getUsersCollection();
  const emailNormalized = normalizeEmail(email);
  if (!emailNormalized) {
    const err = new Error("Email is required");
    err.code = "VALIDATION";
    throw err;
  }
  await col.insertOne({
    id,
    email,
    emailNormalized,
    name: typeof name === "string" ? name : null,
    passwordHash,
    createdAt: now,
    updatedAt: now
  });
  return { id, email, name: typeof name === "string" ? name : null, createdAt: now, updatedAt: now };
}

export async function getUserByEmail(email) {
  const col = await getUsersCollection();
  const emailNormalized = normalizeEmail(email);
  if (!emailNormalized) return null;
  const row = await col.findOne({ emailNormalized }, { projection: { _id: 0 } });
  return row || null;
}

export async function getUserById(id) {
  const col = await getUsersCollection();
  const row = await col.findOne({ id }, { projection: { _id: 0 } });
  return row || null;
}

export async function updateUserName(id, name) {
  const now = new Date().toISOString();
  const col = await getUsersCollection();
  const res = await col.updateOne(
    { id },
    { $set: { name: typeof name === "string" ? name : null, updatedAt: now } }
  );
  return res.matchedCount ? { id, updatedAt: now } : null;
}

export async function createSession({ id, userId, name, payload }) {
  const now = new Date().toISOString();
  const col = await getSessionsCollection();
  const nameNormalized = normalizeName(name);
  if (nameNormalized) {
    const existing = await col.findOne({ userId, nameNormalized }, { projection: { _id: 1 } });
    if (existing) {
      const err = new Error("Session name already exists");
      err.code = 11000;
      throw err;
    }
  }
  await col.insertOne({
    id,
    userId,
    name: name ?? null,
    nameNormalized,
    payload,
    createdAt: now,
    updatedAt: now
  });
  return { id, createdAt: now, updatedAt: now };
}

export async function listSessions(userId) {
  const col = await getSessionsCollection();
  return col
    .find(
      { userId },
      { projection: { _id: 0, id: 1, name: 1, createdAt: 1, updatedAt: 1 } }
    )
    .sort({ updatedAt: -1 })
    .toArray();
}

export async function getSession(userId, id) {
  const col = await getSessionsCollection();
  const row = await col.findOne({ userId, id }, { projection: { _id: 0 } });
  return row || null;
}

export async function updateSession(userId, id, { name, payload }) {
  const now = new Date().toISOString();
  const col = await getSessionsCollection();
  const nameNormalized = normalizeName(name);
  if (nameNormalized) {
    const existing = await col.findOne(
      { userId, nameNormalized, id: { $ne: id } },
      { projection: { _id: 1 } }
    );
    if (existing) {
      const err = new Error("Session name already exists");
      err.code = 11000;
      throw err;
    }
  }
  const res = await col.updateOne(
    { userId, id },
    { $set: { name: name ?? null, nameNormalized, payload, updatedAt: now } }
  );
  return res.matchedCount ? { id, updatedAt: now } : null;
}

export async function deleteSession(userId, id) {
  const col = await getSessionsCollection();
  const res = await col.deleteOne({ userId, id });
  return res.deletedCount ? { id } : null;
}
