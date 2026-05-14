import { usuariosApi } from "../services/api.js";

function setMessage(text, isError = false) {
    const message = document.getElementById("registerMessage");
    if (!message) return;

    message.textContent = text;
    message.style.color = isError ? "#b00020" : "#0a7f35";
}

function bindRegisterForm() {
    const form = document.getElementById("registerForm");
    if (!form) return;

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const nombre = document.getElementById("fullname")?.value.trim() || "";
        const correo = document.getElementById("email")?.value.trim() || "";
        const contrasena = document.getElementById("pass")?.value || "";
        const confirmacion = document.getElementById("confirm_pass")?.value || "";

        if (!nombre || !correo || !contrasena) {
            setMessage("Completa todos los campos obligatorios.", true);
            return;
        }

        if (contrasena !== confirmacion) {
            setMessage("Las contraseñas no coinciden.", true);
            return;
        }

        try {
            setMessage("Creando usuario...");
            await usuariosApi.create({
                nombre,
                correo,
                edad: 18,
                rol: "user",
                estado: true,
                contraseña: contrasena,
            });
            setMessage("Cuenta creada. Ahora puedes iniciar sesión.");
            form.reset();
        } catch (error) {
            setMessage(error.message || "No se pudo crear la cuenta.", true);
        }
    });
}

document.addEventListener("DOMContentLoaded", bindRegisterForm);
