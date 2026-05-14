import { productosApi } from "../services/api.js";
import { requireAuth } from "../services/auth.js";

let productsCache = [];
let editingProductId = null;

function getProductId(producto) {
    return producto.id ?? producto._id;
}

function formatCurrency(value) {
    const number = Number(value || 0);
    return new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0,
    }).format(number);
}

function stockPill(stock) {
    if (Number(stock) <= 0) return "<span class='stock-pill no-stock'>Agotado</span>";
    if (Number(stock) <= 5) return "<span class='stock-pill low-stock'>Bajo</span>";
    return "<span class='stock-pill in-stock'>Disponible</span>";
}

function setMessage(text, isError = false) {
    const message = document.getElementById("inventoryMessage");
    if (!message) return;
    message.textContent = text;
    message.style.color = isError ? "#b00020" : "#0a7f35";
}

function renderRows(products) {
    const tbody = document.getElementById("inventoryTableBody");
    if (!tbody) return;

    if (!products.length) {
        tbody.innerHTML = "<tr><td colspan='7'>No hay productos disponibles.</td></tr>";
        return;
    }

    tbody.innerHTML = products.map((producto) => {
        const id = getProductId(producto);
        return `
            <tr data-id='${id}'>
                <td>${id}</td>
                <td>${producto.nombre || "Sin nombre"}</td>
                <td>${producto.categoria || "Sin categoría"}</td>
                <td>${formatCurrency(producto.precio)}</td>
                <td>${producto.stock ?? 0}</td>
                <td>${stockPill(producto.stock ?? 0)}</td>
                <td>
                    <button class='btn-edit' data-action='edit'>Editar</button>
                    <button class='btn-delete' data-action='delete'>Eliminar</button>
                </td>
            </tr>
        `;
    }).join("");
}

function filterAndRender() {
    const text = (document.getElementById("inventorySearch")?.value || "").toLowerCase();
    const category = document.getElementById("inventoryCategory")?.value || "";

    const filtered = productsCache.filter((producto) => {
        const byText = `${producto.nombre || ""} ${producto.categoria || ""}`.toLowerCase().includes(text);
        const byCategory = !category || (producto.categoria || "").toLowerCase() === category.toLowerCase();
        return byText && byCategory;
    });

    renderRows(filtered);
}

async function loadProducts() {
    try {
        setMessage("Cargando inventario...");
        const response = await productosApi.list();
        productsCache = Array.isArray(response) ? response : response?.data || [];
        filterAndRender();
        setMessage("Inventario actualizado.");
    } catch (error) {
        setMessage(`Error al cargar productos: ${error.message}`, true);
    }
}

function getProductFormElements() {
    return {
        modal: document.getElementById("productModal"),
        title: document.getElementById("productModalTitle"),
        form: document.getElementById("productForm"),
        id: document.getElementById("productId"),
        nombre: document.getElementById("productNombre"),
        categoria: document.getElementById("productCategoria"),
        precio: document.getElementById("productPrecio"),
        stock: document.getElementById("productStock"),
    };
}

function openProductModal(product = null) {
    const elements = getProductFormElements();
    if (!elements.modal) return;

    if (product) {
        editingProductId = String(getProductId(product));
        elements.title.textContent = "Editar producto";
        elements.id.value = editingProductId;
        elements.nombre.value = product.nombre || "";
        elements.categoria.value = product.categoria || "";
        elements.precio.value = String(product.precio ?? 0);
        elements.stock.value = String(product.stock ?? 0);
    } else {
        editingProductId = null;
        elements.title.textContent = "Agregar producto";
        elements.form.reset();
        elements.id.value = "";
    }

    elements.modal.classList.add("is-open");
    elements.modal.setAttribute("aria-hidden", "false");
}

function closeProductModal() {
    const modal = document.getElementById("productModal");
    if (!modal) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
}

async function submitProductForm(event) {
    event.preventDefault();

    const elements = getProductFormElements();
    const nombre = elements.nombre.value.trim();
    const categoria = elements.categoria.value.trim();
    const precio = Number(elements.precio.value);
    const stock = Number(elements.stock.value);

    if (!nombre || !categoria || Number.isNaN(precio) || precio < 0 || Number.isNaN(stock) || stock < 0) {
        setMessage("Completa correctamente nombre, categoría, precio y stock.", true);
        return;
    }

    try {
        if (editingProductId) {
            const product = productsCache.find((item) => String(getProductId(item)) === editingProductId);
            if (!product) {
                setMessage("No se encontró el producto a editar.", true);
                return;
            }

            await productosApi.update(editingProductId, {
                ...product,
                nombre,
                categoria,
                precio,
                stock,
            });
            setMessage("Producto actualizado.");
        } else {
            await productosApi.create({
                nombre,
                categoria,
                precio,
                stock,
            });
            setMessage("Producto creado.");
        }

        closeProductModal();
        await loadProducts();
    } catch (error) {
        setMessage(`No se pudo guardar: ${error.message}`, true);
    }
}

function bindTableActions() {
    const tbody = document.getElementById("inventoryTableBody");
    if (!tbody) return;

    tbody.addEventListener("click", async (event) => {
        const button = event.target.closest("button[data-action]");
        if (!button) return;

        const row = button.closest("tr");
        if (!row) return;

        const id = row.dataset.id;
        const product = productsCache.find((item) => String(getProductId(item)) === String(id));
        if (!product) return;

        if (button.dataset.action === "delete") {
            const confirmDelete = confirm(`¿Eliminar el producto ${product.nombre || id}?`);
            if (!confirmDelete) return;

            try {
                await productosApi.remove(id);
                setMessage("Producto eliminado.");
                await loadProducts();
            } catch (error) {
                setMessage(`No se pudo eliminar: ${error.message}`, true);
            }
            return;
        }

        openProductModal(product);
    });
}

function bindProductForm() {
    const openBtn = document.getElementById("openProductModalBtn");
    const closeBtn = document.getElementById("closeProductModalBtn");
    const cancelBtn = document.getElementById("cancelProductModalBtn");
    const form = document.getElementById("productForm");
    const modal = document.getElementById("productModal");

    openBtn?.addEventListener("click", () => openProductModal());
    closeBtn?.addEventListener("click", closeProductModal);
    cancelBtn?.addEventListener("click", closeProductModal);
    form?.addEventListener("submit", submitProductForm);

    modal?.addEventListener("click", (event) => {
        if (event.target === modal) {
            closeProductModal();
        }
    });
}

function bindFilters() {
    document.getElementById("inventorySearch")?.addEventListener("input", filterAndRender);
    document.getElementById("inventoryCategory")?.addEventListener("change", filterAndRender);
}

function init() {
    requireAuth();
    bindProductForm();
    bindTableActions();
    bindFilters();
    loadProducts();
}

document.addEventListener("DOMContentLoaded", init);
