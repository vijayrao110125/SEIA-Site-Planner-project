export function normalizeEmail(email) {
  if (typeof email !== "string") return null;
  const trimmed = email.trim();
  if (!trimmed) return null;
  return trimmed.toLowerCase();
}

export function normalizeDisplayName(name) {
  if (typeof name !== "string") return null;
  const trimmed = name.trim();
  if (!trimmed) return null;
  return trimmed;
}

export function makeUser({
  id,
  email,
  name = null,
  passwordHash,
  createdAt,
  updatedAt
} = {}) {
  return {
    id: typeof id === "string" ? id : "",
    email: typeof email === "string" ? email : "",
    name: typeof name === "string" ? name : null,
    passwordHash: typeof passwordHash === "string" ? passwordHash : "",
    createdAt: typeof createdAt === "string" ? createdAt : "",
    updatedAt: typeof updatedAt === "string" ? updatedAt : ""
  };
}

