import { usuariosApi } from "./api.js";

const AUTH_STORAGE_KEY = "smartfutAuthSession";

export function getSession() {
    const sessionJson = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!sessionJson) return null;

    try {
        return JSON.parse(sessionJson);
    } catch {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        return null;
    }
}

export function saveSession(sessionData) {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sessionData));
}

export function clearSession() {
    localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function isAuthenticated() {
    return Boolean(getSession());
}

export function requireAuth() {
    if (isAuthenticated()) return;
    window.location.href = "registroSF.html";
}

export async function login(correo, contrasena) {
    const payload = await usuariosApi.login({ correo, contraseña: contrasena });
    const session = {
        loginAt: new Date().toISOString(),
        user: payload?.usuario || payload?.user || payload,
        token: payload?.token || null,
    };

    saveSession(session);
    return session;
}

export function logout() {
    clearSession();
    window.location.href = "registroSF.html";
}
