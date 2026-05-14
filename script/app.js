const STORAGE_KEY = 'smartfutOrders';
const INVENTORY_STORAGE_KEY = 'smartfutInventoryStock';
const DEFAULT_INVENTORY = {
    '#BLP26': 15,
    '#CTL26': 15,
    '#BTS26': 15,
    '#GTP26': 15,
    '#KDF26': 15,
};
const PRODUCT_MAP = {
    'Balón Profesional 2026': '#BLP26',
    'Camiseta Titular': '#CTL26',
    'Botines Speed': '#BTS26',
    'Guantes de Portero': '#GTP26',
    'Kit de Fútbol': '#KDF26',
};

function getOrders() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    try {
        return JSON.parse(stored) || [];
    } catch (error) {
        console.warn('No se pudo leer el carrito desde localStorage:', error);
        return [];
    }
}

function saveOrders(orders) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
}

function getInventory() {
    const stored = localStorage.getItem(INVENTORY_STORAGE_KEY);
    if (!stored) return { ...DEFAULT_INVENTORY };
    try {
        const parsed = JSON.parse(stored) || {};
        return { ...DEFAULT_INVENTORY, ...parsed };
    } catch (error) {
        console.warn('No se pudo leer el inventario desde localStorage:', error);
        return { ...DEFAULT_INVENTORY };
    }
}

function saveInventory(inventory) {
    localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(inventory));
}

function getProductStock(ref) {
    const inventory = getInventory();
    return Number(inventory[ref] || 0);
}

function updateProductCardStock(card, quantity) {
    const stockValue = card.querySelector('.stock-value');
    const button = card.querySelector('.add-btn');
    if (stockValue) {
        stockValue.textContent = quantity;
    }
    if (button) {
        button.disabled = quantity <= 0;
        button.textContent = quantity <= 0 ? 'Agotado' : 'Comprar';
        button.style.opacity = quantity <= 0 ? '0.6' : '1';
        button.style.cursor = quantity <= 0 ? 'not-allowed' : 'pointer';
    }
}

function initializeProductStock() {
    const inventory = getInventory();
    const cards = document.querySelectorAll('.product-card[data-ref]');
    cards.forEach(card => {
        const ref = card.dataset.ref;
        const quantity = Number(inventory[ref] ?? 0);
        updateProductCardStock(card, quantity);
    });
}

function decreaseProductStock(ref) {
    const inventory = getInventory();
    inventory[ref] = Math.max(0, Number(inventory[ref] || 0) - 1);
    saveInventory(inventory);
    return inventory[ref];
}

function renderStockSummary() {
    const stockSummary = document.getElementById('stockSummary');
    if (!stockSummary) return;

    const { totalProducts, productsWithStock, outOfStock, totalUnits } = getInventorySummary();

    if (totalProducts === 0) {
        stockSummary.textContent = 'No hay productos en inventario';
        return;
    }

    stockSummary.textContent = `${totalProducts} productos, ${totalUnits} unidades en stock`;
    if (outOfStock > 0) {
        stockSummary.textContent += ` · ${outOfStock} agotado${outOfStock === 1 ? '' : 's'}`;
    }
}

function increaseProductStock(ref) {
    const inventory = getInventory();
    inventory[ref] = Number(inventory[ref] || 0) + 1;
    saveInventory(inventory);
    return inventory[ref];
}

function deleteOrder(index) {
    const orders = getOrders();
    if (index < 0 || index >= orders.length) return;

    const order = orders[index];
    const producto = order.producto;
    const ref = PRODUCT_MAP[producto];
    if (ref) {
        increaseProductStock(ref);
        // Actualizar la tarjeta del producto en index20.html si existe
        const card = document.querySelector(`.product-card[data-ref="${ref}"]`);
        if (card) {
            const newStock = getProductStock(ref);
            updateProductCardStock(card, newStock);
        }
        renderStockSummary();
    }

    orders.splice(index, 1);
    saveOrders(orders);
    renderOrdersTable();
}

function addOrder(producto, categoria, precio) {
    const orders = getOrders();
    const nextId = orders.length ? Math.max(...orders.map(o => o.id)) + 1 : 1;
    const order = {
        id: nextId,
        cliente: 'Cliente SMARTFUT',
        producto,
        categoria,
        precio,
        estado: 'Pendiente',
        fecha: new Date().toLocaleString(),
    };
    orders.push(order);
    saveOrders(orders);
    return orders;
}

function renderOrdersTable() {
    const tableBody = document.getElementById('ordersTable');
    if (!tableBody) return;

    const orders = getOrders();
    tableBody.innerHTML = '';

    const pendingCount = document.getElementById('pendingOrdersCount');
    if (pendingCount) {
        pendingCount.textContent = orders.length;
    }

    if (!orders.length) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center; padding: 1rem;">No hay pedidos registrados.</td>
            </tr>
        `;
        return;
    }

    orders.forEach((order, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${order.id}</td>
            <td>${order.cliente}</td>
            <td>${order.producto}</td>
            <td>${order.estado}</td>
            <td><button class="delete-btn" data-index="${index}" style="background-color: #dc3545; color: white; border: none; padding: 5px 10px; cursor: pointer; border-radius: 3px;">Eliminar</button></td>
        `;
        tableBody.appendChild(row);
    });

    const deleteButtons = tableBody.querySelectorAll('.delete-btn');
    deleteButtons.forEach(button => {
        button.addEventListener('click', event => {
            const index = parseInt(event.target.getAttribute('data-index'));
            deleteOrder(index);
        });
    });
}

function bindProductButtons() {
    const buttons = document.querySelectorAll('.add-btn');
    if (!buttons.length) return;

    buttons.forEach(button => {
        button.addEventListener('click', event => {
            const card = event.target.closest('.product-card');
            if (!card) return;

            const ref = card.dataset.ref;
            if (!ref) return;

            const currentStock = getProductStock(ref);
            if (currentStock <= 0) {
                alert('Lo siento, este producto está agotado.');
                updateProductCardStock(card, 0);
                return;
            }

            const producto = card.querySelector('h3')?.textContent.trim() || 'Producto';
            const categoria = card.querySelector('.category')?.textContent.trim() || 'Sin categoría';
            const precio = card.querySelector('.price')?.textContent.trim() || '$0';
            const orders = addOrder(producto, categoria, precio);

            const newStock = decreaseProductStock(ref);
            updateProductCardStock(card, newStock);
            renderStockSummary();

            alert(`Pedido agregado a Dashboard:\n- ${producto}\n- ${categoria}\n- ${precio}`);
            const cartCount = document.getElementById('cartCount');
            if (cartCount) {
                cartCount.textContent = orders.length;
            }
        });
    });
}

function init() {
    renderOrdersTable();
    renderStockSummary();
    initializeProductStock();
    bindProductButtons();
}

window.addEventListener('storage', event => {
    if (event.key === INVENTORY_STORAGE_KEY) {
        renderStockSummary();
    }
});

document.addEventListener('DOMContentLoaded', init);
