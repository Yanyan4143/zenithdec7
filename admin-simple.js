// Simple Inventory History Function
function loadInventoryHistory() {
    const tbody = document.querySelector('#inventory-history-table tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    // Simple data
    const simpleData = [
        { date: '2025-11-28', item: 'Coca Cola', previousStock: 50, newStock: 48, user: 'Cashier' },
        { date: '2025-11-28', item: 'Pepsi', previousStock: 30, newStock: 54, user: 'Admin' },
        { date: '2025-11-28', item: 'Sprite', previousStock: 25, newStock: 24, user: 'Cashier' }
    ];
    
    simpleData.forEach(item => {
        const row = `<tr>
            <td>${item.date}</td>
            <td>${item.item}</td>
            <td>${item.previousStock}</td>
            <td>${item.newStock}</td>
            <td>${item.user}</td>
        </tr>`;
        tbody.innerHTML += row;
    });
}

// Simple event listener for inventory history
document.addEventListener('DOMContentLoaded', function() {
    const inventoryHistoryTab = document.getElementById('inventory-history-tab');
    if (inventoryHistoryTab) {
        inventoryHistoryTab.addEventListener('shown.bs.tab', loadInventoryHistory);
    }
});
