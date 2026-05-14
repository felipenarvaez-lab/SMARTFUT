import { usuariosApi } from "../services/api.js";
import { requireAuth } from "../services/auth.js";

let usersCache = [];
let editingUserId = null;

function getUserId(user) {
    return user.id ?? user._id;
}

function initials(nombre) {
    return (nombre || "U")
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0].toUpperCase())
        .join("");
}

function setMessage(text, isError = false) {
    const message = document.getElementById("usersMessage");
    if (!message) return;
    message.textContent = text;
    message.style.color = isError ? "#b00020" : "#0a7f35";
}

function normalizeUsers(response) {
    return Array.isArray(response) ? response : response?.data || [];
}

function renderUsers(users) {
    const tbody = document.getElementById("usersTableBody");
    if (!tbody) return;

    if (!users.length) {
        tbody.innerHTML = "<tr><td colspan='5'>No hay usuarios para mostrar.</td></tr>";
        return;
    }

    tbody.innerHTML = users.map((user) => {
        const id = getUserId(user);
        const estado = user.estado === false ? "Inactivo" : "Activo";
        const statusClass = user.estado === false ? "status-inactive" : "status-active";

        return `
            <tr data-id='${id}'>
                <td>
                    <div class='user-info'>
                        <div class='user-avatar'>${initials(user.nombre)}</div>
                        <strong>${user.nombre || "Sin nombre"}</strong>
                    </div>
                </td>
                <td>${user.correo || "Sin correo"}</td>
                <td>${user.rol || "user"}</td>
                <td><span class='status ${statusClass}'>${estado}</span></td>
                <td class='actions'>
                    <button class='btn-action' data-action='edit'>Editar</button>
                    <button class='btn-action btn-delete' data-action='delete'>Eliminar</button>
                </td>
            </tr>
        `;
    }).join("");
}

async function loadUsers() {
    try {
        setMessage("Cargando usuarios...");
        const response = await usuariosApi.list();
        usersCache = normalizeUsers(response);
        renderUsers(usersCache);
        setMessage("Usuarios actualizados.");
    } catch (error) {
        setMessage(`Error al cargar usuarios: ${error.message}`, true);
    }
}

async function deleteUser(user) {
    const id = getUserId(user);
    if (!confirm(`¿Eliminar al usuario ${user.nombre || id}?`)) return;

    try {
        await usuariosApi.remove(id);
        await loadUsers();
    } catch (error) {
        setMessage(`No se pudo eliminar: ${error.message}`, true);
    }
}

function getUserFormElements() {
    return {
        modal: document.getElementById("userModal"),
        title: document.getElementById("userModalTitle"),
        form: document.getElementById("userForm"),
        id: document.getElementById("userId"),
        nombre: document.getElementById("userNombre"),
        correo: document.getElementById("userCorreo"),
        edad: document.getElementById("userEdad"),
        rol: document.getElementById("userRol"),
        estado: document.getElementById("userEstado"),
        password: document.getElementById("userPassword"),
    };
}

function openUserModal(user = null) {
    const elements = getUserFormElements();
    if (!elements.modal) return;

    if (user) {
        editingUserId = String(getUserId(user));
        elements.title.textContent = "Editar usuario";
        elements.id.value = editingUserId;
        elements.nombre.value = user.nombre || "";
        elements.correo.value = user.correo || "";
        elements.edad.value = String(user.edad ?? 18);
        elements.rol.value = user.rol || "user";
        elements.estado.value = String(user.estado !== false);
        elements.password.value = "";
    } else {
        editingUserId = null;
        elements.title.textContent = "Agregar usuario";
        elements.form.reset();
        elements.id.value = "";
        elements.edad.value = "18";
        elements.rol.value = "user";
        elements.estado.value = "true";
    }

    elements.modal.classList.add("is-open");
    elements.modal.setAttribute("aria-hidden", "false");
}

function closeUserModal() {
    const modal = document.getElementById("userModal");
    if (!modal) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
}

async function submitUserForm(event) {
    event.preventDefault();

    const elements = getUserFormElements();
    const nombre = elements.nombre.value.trim();
    const correo = elements.correo.value.trim();
    const edad = Number(elements.edad.value);
    const rol = elements.rol.value.trim() || "user";
    const estado = elements.estado.value === "true";
    const password = elements.password.value;

    if (!nombre || !correo || Number.isNaN(edad) || edad < 1) {
        setMessage("Completa los campos correctamente.", true);
        return;
    }

    try {
        if (editingUserId) {
            const user = usersCache.find((item) => String(getUserId(item)) === editingUserId);
            if (!user) {
                setMessage("No se encontró el usuario a editar.", true);
                return;
            }

            const payload = {
                ...user,
                nombre,
                correo,
                edad,
                rol,
                estado,
            };

            if (password) {
                payload.contraseña = password;
            }

            await usuariosApi.update(editingUserId, payload);
            setMessage("Usuario actualizado.");
        } else {
            await usuariosApi.create({
                nombre,
                correo,
                edad,
                rol,
                estado,
                contraseña: password || "123456",
            });
            setMessage("Usuario creado.");
        }

        closeUserModal();
        await loadUsers();
    } catch (error) {
        setMessage(`No se pudo guardar: ${error.message}`, true);
    }
}

function bindTableActions() {
    const tbody = document.getElementById("usersTableBody");
    if (!tbody) return;

    tbody.addEventListener("click", (event) => {
        const button = event.target.closest("button[data-action]");
        if (!button) return;

        const row = button.closest("tr");
        if (!row) return;

        const user = usersCache.find((item) => String(getUserId(item)) === String(row.dataset.id));
        if (!user) return;

        if (button.dataset.action === "delete") {
            deleteUser(user);
            return;
        }

        openUserModal(user);
    });
}

function bindUserForm() {
    const openBtn = document.getElementById("openUserModalBtn");
    const closeBtn = document.getElementById("closeUserModalBtn");
    const cancelBtn = document.getElementById("cancelUserModalBtn");
    const form = document.getElementById("userForm");
    const modal = document.getElementById("userModal");

    openBtn?.addEventListener("click", () => openUserModal());
    closeBtn?.addEventListener("click", closeUserModal);
    cancelBtn?.addEventListener("click", closeUserModal);
    form?.addEventListener("submit", submitUserForm);

    modal?.addEventListener("click", (event) => {
        if (event.target === modal) {
            closeUserModal();
        }
    });
}

function init() {
    requireAuth();
    bindUserForm();
    bindTableActions();
    loadUsers();
}

document.addEventListener("DOMContentLoaded", init);
