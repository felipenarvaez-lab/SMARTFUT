const INVENTORY_STORAGE_KEY = 'smartfutInventoryStock';
const DEFAULT_INVENTORY = {
    '#BLP26': 15,
    '#CTL26': 15,
    '#BTS26': 15,
    '#GTP26': 15,
    '#KDF26': 15,
};

function getStoredInventory() {
    const stored = localStorage.getItem(INVENTORY_STORAGE_KEY);
    if (!stored) return { ...DEFAULT_INVENTORY };
    try {
        const parsed = JSON.parse(stored) || {};
        return { ...DEFAULT_INVENTORY, ...parsed };
    } catch (error) {
        console.warn('Error leyendo inventario desde localStorage:', error);
        return { ...DEFAULT_INVENTORY };
    }
}

function saveInventory(inventory) {
    localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(inventory));
}

function updateStockRow(row, quantity) {
    const stockCell = row.querySelector('td:nth-child(5)');
    const statusSpan = row.querySelector('.stock-pill');
    if (!stockCell || !statusSpan) return;

    stockCell.textContent = quantity;

    if (quantity > 0) {
        statusSpan.textContent = 'Disponible';
        statusSpan.classList.add('in-stock');
        statusSpan.classList.remove('out-of-stock');
    } else {
        statusSpan.textContent = 'Agotado';
        statusSpan.classList.remove('in-stock');
        statusSpan.classList.add('out-of-stock');
    }
}

function loadInventoryFromStorage() {
    const inventory = getStoredInventory();
    const rows = document.querySelectorAll('.data-table tbody tr');

    rows.forEach(row => {
        const ref = row.dataset.ref || row.querySelector('td')?.textContent.trim();
        if (!ref) return;
        const storedQuantity = inventory[ref];
        if (storedQuantity !== undefined && storedQuantity !== null) {
            updateStockRow(row, storedQuantity);
        }
    });
}

function bindEditButtons() {
    const editButtons = document.querySelectorAll('.btn-edit');
    editButtons.forEach(button => {
        button.addEventListener('click', () => {
            const row = button.closest('tr');
            if (!row) return;

            const ref = row.dataset.ref || row.querySelector('td')?.textContent.trim();
            const stockCell = row.querySelector('td:nth-child(5)');
            if (!ref || !stockCell) return;

            const currentStock = parseInt(stockCell.textContent, 10);
            const inputValue = prompt('Ingrese la nueva cantidad de stock para este producto:', currentStock);
            if (inputValue === null) return;

            const newStock = parseInt(inputValue.trim(), 10);
            if (Number.isNaN(newStock) || newStock < 0) {
                alert('Por favor ingrese un número válido mayor o igual a 0.');
                return;
            }

            updateStockRow(row, newStock);

            const inventory = getStoredInventory();
            inventory[ref] = newStock;
            saveInventory(inventory);
        });
    });
}

function initInventoryPage() {
    loadInventoryFromStorage();
    bindEditButtons();
}

window.addEventListener('storage', event => {
    if (event.key === INVENTORY_STORAGE_KEY) {
        loadInventoryFromStorage();
    }
});

document.addEventListener('DOMContentLoaded', initInventoryPage);
