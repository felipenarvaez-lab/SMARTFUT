const STORAGE_KEY = 'smartfutOrders';

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

function deleteOrder(index) {
    const orders = getOrders();
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

    // Agregar event listeners a los botones de eliminar
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

            const producto = card.querySelector('h3')?.textContent.trim() || 'Producto';
            const categoria = card.querySelector('.category')?.textContent.trim() || 'Sin categoría';
            const precio = card.querySelector('.price')?.textContent.trim() || '$0';
            const orders = addOrder(producto, categoria, precio);

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
    bindProductButtons();
}

document.addEventListener('DOMContentLoaded', init);
