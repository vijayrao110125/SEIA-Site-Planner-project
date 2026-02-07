export function safeGet(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function safeSet(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

export function safeRemove(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

