export function saveUserToLocalStorage(user) {
    window.localStorage.setItem("user", JSON.stringify(user));
}

export function getUserFromLocalStorage() {
    const tokenString = localStorage.getItem("token");
    if (!tokenString) return null;
    try {
        const parsed = JSON.parse(tokenString);
        return parsed.user; // Возвращаем именно user, а не весь объект
    } catch (e) {
        return null;
    }
}

export function removeUserFromLocalStorage() {
    window.localStorage.removeItem("token");
}

// Экранирование тегов
export function escapeHtml(text) {
  if (typeof text !== "string") return text;
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}