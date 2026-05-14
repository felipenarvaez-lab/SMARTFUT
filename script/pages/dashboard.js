import { productosApi, usuariosApi } from "../services/api.js";
import { getSession, logout, requireAuth } from "../services/auth.js";

function formatCurrency(value) {
    const number = Number(value || 0);
    return new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0,
    }).format(number);
}

function setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
}

async function loadDashboardData() {
    try {
        const [productos, usuarios] = await Promise.all([
            productosApi.list(),
            usuariosApi.list(),
        ]);

        const productsList = Array.isArray(productos) ? productos : productos?.data || [];
        const usersList = Array.isArray(usuarios) ? usuarios : usuarios?.data || [];

        const totalStock = productsList.reduce((sum, item) => sum + Number(item.stock || 0), 0);

        setText("totalProductos", String(productsList.length));
        setText("totalUsuarios", String(usersList.length));
        setText("totalStock", String(totalStock));

        const tableBody = document.getElementById("productsTable");
        if (!tableBody) return;

        if (!productsList.length) {
            tableBody.innerHTML = "<tr><td colspan='5'>No hay productos para mostrar.</td></tr>";
            return;
        }

        tableBody.innerHTML = productsList.slice(0, 8).map((producto) => {
            const id = producto.id ?? producto._id ?? "-";
            return `
                <tr>
                    <td>${id}</td>
                    <td>${producto.nombre || "Sin nombre"}</td>
                    <td>${producto.categoria || "Sin categoría"}</td>
                    <td>${formatCurrency(producto.precio)}</td>
                    <td>${producto.stock ?? 0}</td>
                </tr>
            `;
        }).join("");
    } catch (error) {
        const errorBox = document.getElementById("dashboardError");
        if (errorBox) {
            errorBox.textContent = `No se pudo cargar el dashboard: ${error.message}`;
        }
    }
}

function bindLogout() {
    const logoutBtn = document.getElementById("logoutBtn");
    if (!logoutBtn) return;
    logoutBtn.addEventListener("click", logout);
}

function showSessionUser() {
    const session = getSession();
    const name = session?.user?.nombre || session?.user?.correo || "Usuario";
    setText("sessionUser", name);
}

function init() {
    requireAuth();
    bindLogout();
    showSessionUser();
    loadDashboardData();
}

document.addEventListener("DOMContentLoaded", init);
