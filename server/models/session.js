export function normalizeSessionName(name) {
  if (typeof name !== "string") return null;
  const trimmed = name.trim();
  if (!trimmed) return null;
  return trimmed.toLowerCase();
}

export function makeSession({
  id,
  userId,
  name = null,
  nameNormalized = null,
  payload,
  createdAt,
  updatedAt
} = {}) {
  return {
    id: typeof id === "string" ? id : "",
    userId: typeof userId === "string" ? userId : "",
    name: typeof name === "string" ? name : null,
    nameNormalized: typeof nameNormalized === "string" ? nameNormalized : null,
    payload: payload ?? null,
    createdAt: typeof createdAt === "string" ? createdAt : "",
    updatedAt: typeof updatedAt === "string" ? updatedAt : ""
  };
}

