import { isAuthenticated, login } from "../services/auth.js";

function setMessage(text, isError = false) {
    const message = document.getElementById("authMessage");
    if (!message) return;

    message.textContent = text;
    message.style.color = isError ? "#b00020" : "#0a7f35";
}

function bindLoginForm() {
    const form = document.getElementById("loginForm");
    if (!form) return;

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const correo = document.getElementById("correo")?.value.trim() || "";
        const contrasena = document.getElementById("contrasena")?.value || "";

        if (!correo || !contrasena) {
            setMessage("Completa correo y contraseña.", true);
            return;
        }

        try {
            setMessage("Iniciando sesión...");
            await login(correo, contrasena);
            window.location.href = "dashboard.html";
        } catch (error) {
            setMessage(error.message || "No se pudo iniciar sesión.", true);
        }
    });
}

function init() {
    if (isAuthenticated()) {
        window.location.href = "dashboard.html";
        return;
    }

    bindLoginForm();
}

document.addEventListener("DOMContentLoaded", init);
