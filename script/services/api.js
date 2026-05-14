export const API_BASE_URL = "http://localhost:8080/api";

async function parseJsonSafely(response) {
    const text = await response.text();
    if (!text) return null;

    try {
        return JSON.parse(text);
    } catch {
        return { message: text };
    }
}

export async function apiRequest(path, options = {}) {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {}),
        },
        ...options,
    });

    const payload = await parseJsonSafely(response);
    if (!response.ok) {
        const message = payload?.message || payload?.error || `Error ${response.status}`;
        throw new Error(message);
    }

    return payload;
}

export const usuariosApi = {
    list: () => apiRequest("/usuarios"),
    getById: (id) => apiRequest(`/usuarios/${id}`),
    create: (data) => apiRequest("/usuarios", { method: "POST", body: JSON.stringify(data) }),
    update: (id, data) => apiRequest(`/usuarios/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    remove: (id) => apiRequest(`/usuarios/${id}`, { method: "DELETE" }),
    login: (data) => apiRequest("/usuarios/login", { method: "POST", body: JSON.stringify(data) }),
};

export const productosApi = {
    list: () => apiRequest("/productos"),
    getById: (id) => apiRequest(`/productos/${id}`),
    create: (data) => apiRequest("/productos", { method: "POST", body: JSON.stringify(data) }),
    update: (id, data) => apiRequest(`/productos/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    remove: (id) => apiRequest(`/productos/${id}`, { method: "DELETE" }),
};

export const healthApi = {
    check: () => apiRequest("/health"),
};
