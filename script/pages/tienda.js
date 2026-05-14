import { productosApi } from "../services/api.js";

const IMAGE_BY_CATEGORY = {
    balones: "images/balon.jfif",
    calzado: "images/botines.jfif",
    indumentaria: "images/camiseta.jfif",
    proteccion: "images/guantes.jfif",
    entrenamiento: "images/kit.jfif",
};

let productsCache = [];

function getImageByCategory(category) {
    const normalized = (category || "").toLowerCase();
    return IMAGE_BY_CATEGORY[normalized] || "images/kit.jfif";
}

function formatCurrency(value) {
    const number = Number(value || 0);
    return new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0,
    }).format(number);
}

function setProductsCount(amount) {
    const count = document.getElementById("productsCount");
    if (count) {
        count.textContent = `${amount} producto${amount === 1 ? "" : "s"}`;
    }
}

function renderProducts(products) {
    const grid = document.getElementById("productsGrid");
    if (!grid) return;

    if (!products.length) {
        grid.innerHTML = "<p>No hay productos disponibles.</p>";
        setProductsCount(0);
        return;
    }

    grid.innerHTML = products.map((producto) => `
        <article class='product-card'>
            <img src='${getImageByCategory(producto.categoria)}' alt='${producto.nombre || "Producto"}'>
            <h3>${producto.nombre || "Sin nombre"}</h3>
            <p class='category'>${producto.categoria || "Sin categoría"}</p>
            <p class='price'>${formatCurrency(producto.precio)}</p>
            <p class='stock-info'>Stock: <span class='stock-value'>${producto.stock ?? 0}</span></p>
        </article>
    `).join("");

    setProductsCount(products.length);
}

function filterAndRender() {
    const search = (document.getElementById("searchInput")?.value || "").toLowerCase();
    const category = document.getElementById("categoryFilter")?.value || "";

    const filtered = productsCache.filter((producto) => {
        const bySearch = `${producto.nombre || ""} ${producto.categoria || ""}`.toLowerCase().includes(search);
        const byCategory = !category || category === "Todas las categorías" || (producto.categoria || "").toLowerCase() === category.toLowerCase();
        return bySearch && byCategory;
    });

    renderProducts(filtered);
}

async function loadProducts() {
    const grid = document.getElementById("productsGrid");
    if (grid) {
        grid.innerHTML = "<p>Cargando productos...</p>";
    }

    try {
        const response = await productosApi.list();
        productsCache = Array.isArray(response) ? response : response?.data || [];
        filterAndRender();
    } catch (error) {
        if (grid) {
            grid.innerHTML = `<p>Error al cargar productos: ${error.message}</p>`;
        }
    }
}

function bindFilters() {
    document.getElementById("searchInput")?.addEventListener("input", filterAndRender);
    document.getElementById("categoryFilter")?.addEventListener("change", filterAndRender);
}

function init() {
    bindFilters();
    loadProducts();
}

document.addEventListener("DOMContentLoaded", init);
