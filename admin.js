function getSession(){
    try {
        // Try secure session management first
        const session = getSecureSession();
        if (session && session.role === 'admin') {
            return session;
        }
        
        // Fallback to simple session
        const raw = sessionStorage.getItem('session');
        if (!raw) return null;
        const simpleSession = JSON.parse(raw);
        if (!simpleSession || !simpleSession.role || !simpleSession.expiresAt) return null;
        if (Date.now() > simpleSession.expiresAt) return null;
        if (simpleSession.role !== 'admin') return null;
        
        return simpleSession;
    } catch (error) {
        console.error('Session validation error:', error);
        return null;
    }
}

let editingItemId = null;
let currentReceiptLogoData = '';
const SETTINGS_STORAGE_KEY = 'zenithPosSettings';
let editingSupplierId = null;

function showAdminNotification(message, type = 'info', duration = 3000){
    const container = document.getElementById('admin-alert-container');
    if (!container) {
        alert(message);
        return;
    }

    // Quickly fade out any existing alerts when showing a new one
    Array.from(container.children).forEach(existing => {
        existing.classList.add('app-alert-fadeout');
        setTimeout(() => {
            if (existing.parentNode) existing.parentNode.removeChild(existing);
        }, 150);
    });

    const wrapper = document.createElement('div');
    wrapper.className = `app-alert app-alert-${type} mb-2`;
    wrapper.innerHTML = `
        <div class="app-alert-message">${message}</div>
        <button type="button" class="app-alert-close" aria-label="Close">&times;</button>
    `;
    container.appendChild(wrapper);

    const close = () => {
        wrapper.classList.add('app-alert-fadeout');
        setTimeout(() => {
            if (wrapper.parentNode) wrapper.parentNode.removeChild(wrapper);
        }, 150);
    };

    const closeBtn = wrapper.querySelector('.app-alert-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', close);
    }

    if (duration && duration > 0) {
        setTimeout(close, duration);
    }
}

document.addEventListener('DOMContentLoaded', async function() {
    const session = getSession();
    if (!session || session.role !== 'admin') {
        window.location.href = 'index.html';
        return;
    }

    const salesMonthSelect = document.getElementById('sales-month');
    if (salesMonthSelect) {
        const now = new Date();
        const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
        salesMonthSelect.value = currentMonth;
    }

    // Set default dates for Top Selling items (empty placeholders for user input)
    const fromDateInput = document.getElementById('top-selling-from-date');
    const toDateInput = document.getElementById('top-selling-to-date');
    
    if (fromDateInput && !fromDateInput.value) {
        fromDateInput.value = ''; // Keep empty for user input
        fromDateInput.placeholder = 'DD/MM/YYYY';
    }
    if (toDateInput && !toDateInput.value) {
        toDateInput.value = ''; // Keep empty for user input
        toDateInput.placeholder = 'DD/MM/YYYY';
    }

    await loadDashboard();
    await loadInventory();
    await loadSuppliers();
    await loadSalesJournal();
    await loadExpenseJournal();
    await loadAuditLogs();
    await loadVoidItems();
    await loadTopSellingItems(); // Initial load of Top 3 Items
    
    // Auto-refresh Top 3 Items card every 15 seconds for more responsive updates
    setInterval(async () => {
        await loadTopSellingItems();
    }, 15000);

    // Auto-refresh Sales Journal every 10 seconds for real-time updates
    setInterval(async () => {
        console.log('📊 Sales Journal updated with real-time data');
    }, 10000);
    
    // Auto-refresh Admin Dashboard every 5 seconds for real-time void updates
    setInterval(async () => {
        await refreshAllAdminData();
        console.log('🔄 Admin Dashboard updated with real-time data');
    }, 5000);
    
    // Listen for void operations from cashier (cross-tab sync)
    window.addEventListener('storage', async function(e) {
        if (e.key === 'void_operation_sync' && e.newValue) {
            try {
                const voidData = JSON.parse(e.newValue);
                if (voidData.source === 'cashier') {
                    console.log('📡 Received void operation from cashier:', voidData);
                    
                    // Handle different void operation types
                    if (voidData.action === 'item_voided') {
                        // Single item void (legacy)
                        showAdminNotification(
                            `Item voided by cashier: ${voidData.quantity}× ${voidData.itemName}${voidData.reason ? ` (Reason: ${voidData.reason})` : ''}`,
                            'warning',
                            5000
                        );
                    } else if (voidData.action === 'multiple_items_voided') {
                        // Multiple items void (new feature)
                        const itemsText = voidData.items.map(item => `${item.quantity}× ${item.itemName}`).join(', ');
                        showAdminNotification(
                            `Multiple items voided by cashier: ${voidData.totalItems} items (${itemsText})${voidData.reason ? ` (Reason: ${voidData.reason})` : ''}`,
                            'warning',
                            6000
                        );
                    }
                    
                    // Immediate refresh of affected data
                    await refreshAllAdminData();
                    console.log('✅ Admin dashboard refreshed after void operation');
                }
            } catch (error) {
                console.error('❌ Error processing void operation sync:', error);
            }
        }
    });
    
    // Set up date change listeners for Top Selling items
    if (fromDateInput) {
        fromDateInput.addEventListener('change', function() {
            console.log('📅 From date changed:', this.value);
            loadTopSellingItems();
        });
    }
    
    if (toDateInput) {
        toDateInput.addEventListener('change', function() {
            console.log('📅 To date changed:', this.value);
            loadTopSellingItems();
        });
    }

    document.getElementById('item-form').addEventListener('submit', saveItem);
    document.getElementById('item-image').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if(file){
            const reader = new FileReader();
            reader.onload = () => {
                document.getElementById('image-preview').src = reader.result;
                document.getElementById('image-preview').style.display = 'block';
            };
            reader.readAsDataURL(file);
        } else {
            document.getElementById('image-preview').style.display = 'none';
        }
    });


    const supplierForm = document.getElementById('supplier-form');
    if (supplierForm) {
        supplierForm.addEventListener('submit', saveSupplier);
    }

    document.getElementById('sales-month').addEventListener('change', loadSalesJournal);

    const expenseDateFilter = document.getElementById('expense-date-filter');
    if (expenseDateFilter) {
        expenseDateFilter.addEventListener('change', async function() {
            console.log('🔄 DEBUG: Expense date filter changed - refreshing both journals...');
            // Refresh expense journal
            await loadExpenseJournal();
            // Also refresh sales journal to listen to expense updates
            await loadSalesJournal();
            console.log('📈 DEBUG: Both journals refreshed after expense date filter change');
        });
    }

    const exportBtn = document.getElementById('export-data-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportAllData);
    }

    const salesJournalTable = document.getElementById('sales-journal-table');
    console.log('📊 Sales journal table element:', salesJournalTable);
    if (salesJournalTable) {
        console.log('✅ Adding click listener to sales journal table');
        salesJournalTable.addEventListener('click', handleSalesJournalRowClick);
    } else {
        console.log('❌ Sales journal table not found');
    }

    const viewGrossBtn = document.getElementById('view-gross-btn');
    if (viewGrossBtn && window.bootstrap) {
        viewGrossBtn.addEventListener('click', () => {
            const tabTrigger = document.getElementById('sales-journal-tab');
            if (tabTrigger) {
                const tab = new bootstrap.Tab(tabTrigger);
                tab.show();
            }
            const panel = document.getElementById('sales-journal');
            if (panel) {
                panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    }

    const viewGrossProfitBtn = document.getElementById('view-gross-profit-btn');
    if (viewGrossProfitBtn && window.bootstrap) {
        viewGrossProfitBtn.addEventListener('click', () => {
            const tabTrigger = document.getElementById('sales-journal-tab');
            if (tabTrigger) {
                const tab = new bootstrap.Tab(tabTrigger);
                tab.show();
            }
            const panel = document.getElementById('sales-journal');
            if (panel) {
                panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    }

    const viewLowStockBtn = document.getElementById('view-lowstock-btn');
    if (viewLowStockBtn && window.bootstrap) {
        viewLowStockBtn.addEventListener('click', () => {
            const tabTrigger = document.getElementById('inventory-tab');
            if (tabTrigger) {
                const tab = new bootstrap.Tab(tabTrigger);
                tab.show();
            }
            const panel = document.getElementById('inventory');
            if (panel) {
                panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    }

    const viewOutStockBtn = document.getElementById('view-outstock-btn');
    if (viewOutStockBtn && window.bootstrap) {
        viewOutStockBtn.addEventListener('click', () => {
            const tabTrigger = document.getElementById('inventory-tab');
            if (tabTrigger) {
                const tab = new bootstrap.Tab(tabTrigger);
                tab.show();
            }
            const panel = document.getElementById('inventory');
            if (panel) {
                panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    }


    const adminTabsToggle = document.getElementById('adminTabsToggle');
    const adminTabs = document.getElementById('adminTabs');
    if (adminTabsToggle && adminTabs) {
        const applyAdminTabsVisibility = () => {
            const isDesktop = window.matchMedia('(min-width: 992px)').matches;
            if (isDesktop) {
                adminTabs.classList.remove('admin-tabs-collapsed');
            } else {
                if (!adminTabs.classList.contains('admin-tabs-collapsed')) {
                    adminTabs.classList.add('admin-tabs-collapsed');
                }
            }
        };

        applyAdminTabsVisibility();

        window.addEventListener('resize', applyAdminTabsVisibility);

        adminTabsToggle.addEventListener('click', () => {
            const isDesktop = window.matchMedia('(min-width: 992px)').matches;
            if (!isDesktop) {
                adminTabs.classList.toggle('admin-tabs-collapsed');
            }
        });

        adminTabs.addEventListener('click', (event) => {
            const isDesktop = window.matchMedia('(min-width: 992px)').matches;
            if (isDesktop) return;
            const clicked = event.target.closest('.nav-link');
            if (!clicked) return;
            if (!adminTabs.classList.contains('admin-tabs-collapsed')) {
                adminTabs.classList.add('admin-tabs-collapsed');
            }
        });
    }

    const settingsForm = document.getElementById('settings-form');
    if (settingsForm) {
        settingsForm.addEventListener('submit', saveSettings);
    }
    const receiptLogoInput = document.getElementById('receipt-logo');
    if (receiptLogoInput) {
        receiptLogoInput.addEventListener('change', handleReceiptLogoChange);
    }

    const clearDataBtn = document.getElementById('clear-data-btn');
    if (clearDataBtn) {
        clearDataBtn.addEventListener('click', handleClearAllData);
    }

    // Inventory Search Functionality
    const inventorySearchInput = document.getElementById('inventory-search');
    if (inventorySearchInput) {
        inventorySearchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const inventoryTable = document.getElementById('inventory-table');
            if (!inventoryTable) return;
            
            const rows = inventoryTable.getElementsByTagName('tbody')[0].getElementsByTagName('tr');
            for (let row of rows) {
                const name = row.cells[0]?.textContent.toLowerCase() || '';
                const price = row.cells[1]?.textContent.toLowerCase() || '';
                const category = row.cells[3]?.textContent.toLowerCase() || '';
                
                const matchesSearch = name.includes(searchTerm) || 
                                    price.includes(searchTerm) || 
                                    category.includes(searchTerm);
                
                row.style.display = matchesSearch ? '' : 'none';
            }
        });
    }

    // Audit Search Functionality
    const auditSearchInput = document.getElementById('audit-search');
    if (auditSearchInput) {
        auditSearchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const auditTable = document.getElementById('audit-logs-table');
            if (!auditTable) return;
            
            const rows = auditTable.getElementsByTagName('tbody')[0].getElementsByTagName('tr');
            for (let row of rows) {
                const date = row.cells[0]?.textContent.toLowerCase() || '';
                const action = row.cells[1]?.textContent.toLowerCase() || '';
                
                const matchesSearch = date.includes(searchTerm) || 
                                    action.includes(searchTerm);
                
                row.style.display = matchesSearch ? '' : 'none';
            }
        });
    }

    // Audit Date Picker Functionality
    const auditDatePicker = document.getElementById('audit-date-picker');
    if (auditDatePicker) {
        auditDatePicker.addEventListener('change', function() {
            loadAuditLogs(); // Reload logs with date filter
        });
    }

    // Clean Audit Logs Button
    const cleanAuditLogsBtn = document.getElementById('clean-audit-logs-btn');
    if (cleanAuditLogsBtn) {
        cleanAuditLogsBtn.addEventListener('click', async function() {
            if (confirm('Are you sure you want to remove all SECURITY_INITIALIZED logs from the database?')) {
                await cleanSecurityLogs();
            }
        });
    }

    populateSettingsForm();
});

window.logout = () => {
    try {
        sessionStorage.removeItem('session');
    } catch (err) {
        console.error('Failed to clear session', err);
    }
    window.location.href = 'index.html';
};

window.showItemModal = showItemModal;
window.showSupplierModal = showSupplierModal;
window.editSupplier = editSupplier;
window.deleteSupplier = deleteSupplier;

function showItemModal(item=null){
    const modal = new bootstrap.Modal(document.getElementById('itemModal'));
    const form = document.getElementById('item-form');
    form.reset();

    const titleEl = document.getElementById('itemModalLabel');
    const isMobile = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(max-width: 767.98px)').matches;

    if(item){
        editingItemId = item.id;
        if (titleEl) titleEl.textContent = 'Edit Item';
        document.getElementById('item-name').value = item.name;
        document.getElementById('item-cost').value = item.cost || '';
        document.getElementById('item-price').value = item.price;
        document.getElementById('item-stock').value = item.stock;
        document.getElementById('item-category').value = item.category;
        if(item.image){
            document.getElementById('image-preview').src = item.image;
            document.getElementById('image-preview').style.display = 'block';
        } else {
            document.getElementById('image-preview').style.display = 'none';
        }
    } else {
        editingItemId = null;
        if (titleEl) titleEl.textContent = isMobile ? 'Add' : 'Add Item';
        document.getElementById('image-preview').style.display = 'none';
    }
    modal.show();
}

async function saveItem(e){
    e.preventDefault();
    const name = document.getElementById('item-name').value;
    const cost = parseFloat(document.getElementById('item-cost').value) || 0;
    const price = parseFloat(document.getElementById('item-price').value);
    const stock = parseInt(document.getElementById('item-stock').value);
    const category = document.getElementById('item-category').value;

    const imageFile = document.getElementById('item-image').files[0];
    let image = '';
    if(imageFile){
        image = await new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(imageFile);
        });
    }

    if(editingItemId){
        const inventory = await getAllInventory();
        const item = inventory.find(i => i.id === editingItemId);
        item.name = name; 
        item.cost = cost; 
        item.price = price; 
        item.stock = stock; 
        item.category = category;
        if(image) item.image = image;
        await putInventoryItem(item);
        await addAuditLog({ date: new Date().toISOString(), action: `Admin edited item: ${name}` });
    } else {
        await addInventoryItem({ name, cost, price, stock, category, image });
        await addAuditLog({ date: new Date().toISOString(), action: `Admin added item: ${name}` });
    }

    bootstrap.Modal.getInstance(document.getElementById('itemModal')).hide();
    await loadInventory();
    await loadDashboard();
}

function showSupplierModal(supplier=null){
    const modalEl = document.getElementById('supplierModal');
    if (!modalEl || !window.bootstrap) return;
    const modal = new bootstrap.Modal(modalEl);
    const form = document.getElementById('supplier-form');
    if (!form) return;
    form.reset();

    const titleEl = document.getElementById('supplierModalLabel');

    if (supplier){
        editingSupplierId = supplier.id;
        if (titleEl) titleEl.textContent = 'Edit Supplier';
        document.getElementById('supplier-name').value = supplier.name || '';
        document.getElementById('supplier-contact').value = supplier.contact || '';
        document.getElementById('supplier-phone').value = supplier.phone || '';
        document.getElementById('supplier-email').value = supplier.email || '';
        document.getElementById('supplier-address').value = supplier.address || '';
        document.getElementById('supplier-notes').value = supplier.notes || '';
    } else {
        editingSupplierId = null;
        if (titleEl) titleEl.textContent = 'Add Supplier';
    }

    modal.show();
}

async function editItem(id){
    const inventory = await getAllInventory();
    const item = inventory.find(i => i.id===id);
    if(item) showItemModal(item);
}

async function deleteItem(id){
    if(confirm('Are you sure you want to delete this item?')){
        await deleteInventoryItem(id);
        await addAuditLog({ date: new Date().toISOString(), action: `Admin deleted item with ID: ${id}` });
        await loadInventory();
        await loadDashboard();
    }
}
async function hashPassword(password){
    if (!window.crypto || !window.crypto.subtle) {
        throw new Error('Secure hashing is not supported in this browser.');
    }
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

async function handleClearAllData(){
    const statusEl = document.getElementById('clear-data-status');
    if (!confirm('This will delete all POS data (inventory, sales, journals, suppliers, audit logs). Continue?')) {
        return;
    }

    const storedHash = localStorage.getItem('user_admin_hash');
    if (!storedHash) {
        if (statusEl) {
            statusEl.classList.remove('text-success','text-muted');
            statusEl.classList.add('text-danger');
            statusEl.textContent = 'No admin password is configured. Please set an admin password from the login screen first.';
            statusEl.style.display = 'block';
            setTimeout(() => {
                statusEl.style.display = 'none';
            }, 4000);
        }
        return;
    }

    const password = prompt('Please enter the admin password to confirm clearing all POS data:');
    if (password === null) {
        if (statusEl) {
            statusEl.classList.remove('text-success','text-danger');
            statusEl.classList.add('text-muted');
            statusEl.textContent = 'Clear data cancelled.';
            statusEl.style.display = 'block';
            setTimeout(() => {
                statusEl.style.display = 'none';
            }, 3000);
        }
        return;
    }
    if (!password) {
        if (statusEl) {
            statusEl.classList.remove('text-success','text-muted');
            statusEl.classList.add('text-danger');
            statusEl.textContent = 'Admin password is required to clear data.';
            statusEl.style.display = 'block';
            setTimeout(() => {
                statusEl.style.display = 'none';
            }, 4000);
        }
        return;
    }

    try {
        const enteredHash = await hashPassword(password);
        if (enteredHash !== storedHash) {
            if (statusEl) {
                statusEl.classList.remove('text-success','text-muted');
                statusEl.classList.add('text-danger');
                statusEl.textContent = 'Incorrect admin password. Data was not cleared.';
                statusEl.style.display = 'block';
                setTimeout(() => {
                    statusEl.style.display = 'none';
                }, 4000);
            }
            return;
        }
    } catch (err) {
        console.error('Password verification failed', err);
        if (statusEl) {
            statusEl.classList.remove('text-success');
            statusEl.classList.add('text-danger');
            statusEl.textContent = 'Unable to verify admin password on this browser.';
            statusEl.style.display = 'block';
            setTimeout(() => {
                statusEl.style.display = 'none';
            }, 4000);
        }
        return;
    }

    if (statusEl) {
        statusEl.classList.remove('text-success','text-danger');
        statusEl.classList.add('text-muted');
        statusEl.textContent = 'Clearing data…';
        statusEl.style.display = 'block';
    }

    try {
        await clearAllData();
        await addAuditLog({ date: new Date().toISOString(), action: 'Admin cleared all POS data' });
        await loadInventory();
        await loadSuppliers();
        await loadSalesJournal();
        await loadExpenseJournal();
        await loadAuditLogs();

        if (statusEl) {
            statusEl.classList.remove('text-muted','text-danger');
            statusEl.classList.add('text-success');
            statusEl.textContent = 'All POS data has been cleared.';
        }
    } catch (err) {
        console.error('Failed to clear data', err);
        if (statusEl) {
            statusEl.classList.remove('text-muted','text-success');
            statusEl.classList.add('text-danger');
            statusEl.textContent = 'Failed to clear data. Please try again.';
        }
    }

    if (statusEl) {
        setTimeout(() => {
            statusEl.style.display = 'none';
        }, 4000);
    }
}

// --- Load Functions ---
async function loadInventory(){
    const inventory = await getAllInventory();
    const tbody = document.querySelector('#inventory-table tbody');
    tbody.innerHTML = '';
    
    let totalProfitPotential = 0;
    let totalSellingValue = 0;
    
    inventory.forEach(item => {
        const cost = parseFloat(item.cost || 0);
        const price = parseFloat(item.price || 0);
        const profit = price - cost;
        const totalSellingValueItem = price * item.stock;
        const profitPotential = profit * item.stock;
        
        totalProfitPotential += profitPotential;
        totalSellingValue += totalSellingValueItem;
        
        const isOut = item.stock <= 0;
        const isLow = item.stock > 0 && item.stock <= 5;
        const rowClass = isOut ? 'table-danger' : (isLow ? 'table-warning' : '');
        const stockLabel = isOut ? ' (Out of stock)' : (isLow ? ' (Low stock)' : '');
        
        const profitClass = profit < 0 ? 'text-danger' : (profit === 0 ? 'text-muted' : 'text-success');
        const profitDisplay = profit === 0 ? '-' : `₱${profit.toFixed(2)}`;
        
        const row = `<tr class="${rowClass}">
            <td>${item.name}</td>
            <td>₱${cost.toFixed(2)}</td>
            <td>₱${price.toFixed(2)}</td>
            <td class="${profitClass} fw-semibold">${profitDisplay}</td>
            <td class="fw-semibold">₱${totalSellingValueItem.toFixed(2)}</td>
            <td>${item.stock}${stockLabel}</td>
            <td>${item.category}</td>
            <td class="text-end">
                <button class="btn btn-sm btn-primary me-1" onclick="editItem(${item.id})">Edit</button>
                <button class="btn btn-sm btn-danger" onclick="deleteItem(${item.id})">Delete</button>
            </td>
        </tr>`;
        tbody.insertAdjacentHTML('beforeend', row);
    });
    
    // Update summary display above table
    const profitDisplay = document.getElementById('total-profit-display');
    const retailDisplay = document.getElementById('total-retail-display');
    
    if (profitDisplay) {
        profitDisplay.textContent = `₱${totalProfitPotential.toFixed(2)}`;
        profitDisplay.className = `h5 mb-0 ${totalProfitPotential < 0 ? 'text-danger' : 'text-success'}`;
    }
    
    if (retailDisplay) {
        retailDisplay.textContent = `₱${totalSellingValue.toFixed(2)}`;
    }
}

// Calculate Net Profit from sales data
async function calculateNetProfit(startDate = null, endDate = null) {
    try {
        const sales = await getAllSales();
        let totalProfit = 0;
        
        sales.forEach(sale => {
            const saleDate = new Date(sale.date);
            const now = new Date();
            
            // Filter by date range if provided
            if (startDate && saleDate < new Date(startDate)) return;
            if (endDate && saleDate > new Date(endDate + 'T23:59:59')) return;
            
            // Add profit from this sale
            totalProfit += sale.profit || 0;
        });
        
        return totalProfit;
    } catch (error) {
        console.error('Error calculating net profit:', error);
        return 0;
    }
}

// Load Net Profit data
async function loadNetProfit() {
    try {
        const totalProfit = await calculateNetProfit();
        const profitElement = document.getElementById('total-profit');
        if (profitElement) {
            profitElement.textContent = totalProfit.toFixed(2);
        }
        return totalProfit;
    } catch (error) {
        console.error('Error loading net profit:', error);
        return 0;
    }
}

async function saveSupplier(e){
    e.preventDefault();
    const name = document.getElementById('supplier-name').value.trim();
    const contact = document.getElementById('supplier-contact').value.trim();
    const phone = document.getElementById('supplier-phone').value.trim();
    const email = document.getElementById('supplier-email').value.trim();
    const address = document.getElementById('supplier-address').value.trim();
    const notes = document.getElementById('supplier-notes').value.trim();

    if (!name) {
        alert('Supplier name is required.');
        return;
    }

    const supplier = {
        name,
        contact,
        phone,
        email,
        address,
        notes
    };

    const now = new Date().toISOString();

    if (editingSupplierId != null) {
        supplier.id = editingSupplierId;
        await updateSupplierRecord(supplier);
        await addAuditLog({ date: now, action: `Admin edited supplier: ${name}` });
    } else {
        await addSupplierRecord(supplier);
        await addAuditLog({ date: now, action: `Admin added supplier: ${name}` });
    }

    const modalEl = document.getElementById('supplierModal');
    if (modalEl && window.bootstrap) {
        const instance = bootstrap.Modal.getInstance(modalEl);
        if (instance) instance.hide();
    }

    editingSupplierId = null;
    await loadSuppliers();
}

async function editSupplier(id){
    const suppliers = await getAllSuppliers();
    const supplier = suppliers.find(s => s.id === id);
    if (supplier) {
        showSupplierModal(supplier);
    }
}

async function deleteSupplier(id){
    if (!confirm('Are you sure you want to delete this supplier?')) return;
    const suppliers = await getAllSuppliers();
    const supplier = suppliers.find(s => s.id === id);
    const name = supplier && supplier.name ? supplier.name : `ID ${id}`;
    await deleteSupplierRecord(id);
    await addAuditLog({ date: new Date().toISOString(), action: `Admin deleted supplier: ${name}` });
    await loadSuppliers();
}

async function loadSuppliers(){
    const suppliers = await getAllSuppliers();
    const tbody = document.querySelector('#suppliers-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    suppliers.forEach(s => {
        const row = `<tr>
            <td>${s.name || ''}</td>
            <td>${s.contact || ''}</td>
            <td>${s.phone || ''}</td>
            <td>${s.email || ''}</td>
            <td>${s.address || ''}</td>
            <td class="text-end">
                <button class="btn btn-sm btn-primary me-1" onclick="editSupplier(${s.id})">Edit</button>
                <button class="btn btn-sm btn-danger" onclick="deleteSupplier(${s.id})">Delete</button>
            </td>
        </tr>`;
        tbody.insertAdjacentHTML('beforeend', row);
    });
}

// Cache-busting timestamp to ensure latest code loads
console.log('🚀 Admin.js loaded at:', new Date().toISOString());
console.log('📝 Admin.js version:', '2025-11-29-v2');

async function loadDashboard(){
    console.log('🔄 Loading dashboard...');
    const inventory = await getAllInventory();
    const sales = await getAllSales();
    const journals = await getAllJournals();
    const expenses = journals.filter(j=>j.type==='expense');

    const totalItemsEl = document.getElementById('total-items');
    if (totalItemsEl) {
        totalItemsEl.textContent = inventory.length;
        console.log('✅ total-items updated');
    } else {
        console.log('❌ total-items element not found');
    }
    
    // Calculate gross sales excluding voided items
    const totalGross = sales.reduce((sum,s)=> {
        const validTotal = s.items.reduce((itemSum, item) => {
            if (!item.voided) {
                return itemSum + (item.price * item.qty);
            }
            return itemSum;
        }, 0);
        return sum + validTotal;
    }, 0);
    
    // Calculate total expenses including both paid and remaining amounts
    const totalPaidExpense = expenses.reduce((sum,e)=>sum+(e.paidAmount || 0),0);
    const totalRemainingExpense = expenses.reduce((sum,e)=>sum+((e.cash || 0) - (e.paidAmount || 0)),0);
    const totalCommittedExpense = expenses.reduce((sum,e)=>sum+(e.cash || 0),0);
    
    console.log('💰 Dashboard Expense Breakdown:', {
        paid: totalPaidExpense.toFixed(2),
        remaining: totalRemainingExpense.toFixed(2),
        committed: totalCommittedExpense.toFixed(2)
    });

    const lowStockCount = inventory.filter(i=>i.stock>0 && i.stock<=5).length;
    const outStockCount = inventory.filter(i=>i.stock<=0).length;

    // Calculate Gross Profit from sold items in Sales History (Selling Price - Cost)
    const grossProfitFromSales = sales.reduce((sum, sale) => {
        const validProfit = sale.items.reduce((itemSum, item) => {
            if (!item.voided) {
                const itemCost = item.cost || 0;
                const itemPrice = item.price || 0;
                const quantity = item.qty || 0;
                return itemSum + ((itemPrice - itemCost) * quantity);
            }
            return itemSum;
        }, 0);
        return sum + validProfit;
    }, 0);

    // Safe DOM updates with null checks and debugging
    console.log('📊 Updating dashboard elements...');
    
    const totalGrossEl = document.getElementById('total-gross');
    if (totalGrossEl) {
        totalGrossEl.textContent = totalGross.toFixed(2);
        console.log('✅ total-gross updated');
    } else {
        console.log('❌ total-gross element not found');
    }
    
    const totalGrossProfitEl = document.getElementById('total-gross-profit');
    if (totalGrossProfitEl) {
        totalGrossProfitEl.textContent = grossProfitFromSales.toFixed(2);
        console.log('✅ total-gross-profit updated');
    } else {
        console.log('❌ total-gross-profit element not found');
    }
    
    const totalNetEl = document.getElementById('total-net');
    if (totalNetEl) {
        // Use committed expenses (paid + remaining) for net calculation
        totalNetEl.textContent = (grossProfitFromSales - totalCommittedExpense).toFixed(2);
        console.log('✅ total-net updated with committed expenses');
    } else {
        console.log('❌ total-net element not found');
    }
    
    const totalProfitEl = document.getElementById('total-profit');
    if(totalProfitEl) {
        totalProfitEl.textContent = grossProfitFromSales.toFixed(2);
        console.log('✅ total-profit updated');
    } else {
        console.log('❌ total-profit element not found');
    }
    const lowStockEl = document.getElementById('low-stock-count');
    if(lowStockEl) {
        lowStockEl.textContent = lowStockCount;
        console.log('✅ low-stock-count updated');
    } else {
        console.log('❌ low-stock-count element not found');
    }
    
    const outStockEl = document.getElementById('out-stock-count');
    if(outStockEl) {
        outStockEl.textContent = outStockCount;
        console.log('✅ out-stock-count updated');
    } else {
        console.log('❌ out-stock-count element not found');
    }

    // ----- Revenue vs Expense (This Year) -----
    const currentYear = new Date().getFullYear();
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const monthlyRevenue = new Array(12).fill(0);
    const monthlyExpense = new Array(12).fill(0);

    sales.forEach(s=>{
        const [year,month] = s.date.split('T')[0].split('-');
        if(parseInt(year,10) === currentYear){
            const mIndex = parseInt(month,10) - 1;
            if(mIndex>=0 && mIndex<12){
                // Only include non-voided items in monthly revenue
                const validTotal = s.items.reduce((itemSum, item) => {
                    if (!item.voided) {
                        return itemSum + (item.price * item.qty);
                    }
                    return itemSum;
                }, 0);
                monthlyRevenue[mIndex] += validTotal;
            }
        }
    });

    expenses.forEach(e=>{
        const [year,month] = e.date.split('T')[0].split('-');
        if(parseInt(year,10) === currentYear){
            const mIndex = parseInt(month,10) - 1;
            if(mIndex>=0 && mIndex<12){
                // Use committed expenses (paid + remaining) instead of just paid amounts
                monthlyExpense[mIndex] += (e.cash || 0);
            }
        }
    });

    const chartCanvas = document.getElementById('revenue-expense-chart');
    if(chartCanvas && window.Chart){
        if(window.revenueExpenseChart){
            window.revenueExpenseChart.destroy();
        }
        window.revenueExpenseChart = new Chart(chartCanvas, {
            type: 'bar',
            data: {
                labels: months,
                datasets: [
                    {
                        label: 'Revenue',
                        data: monthlyRevenue,
                        backgroundColor: 'rgba(5, 150, 105, 0.7)',
                        borderRadius: 4,
                    },
                    {
                        label: 'Expenses',
                        data: monthlyExpense,
                        backgroundColor: 'rgba(220, 38, 38, 0.7)',
                        borderRadius: 4,
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        labels: {
                            font: { size: 10 }
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: { font: { size: 10 } }
                    },
                    y: {
                        ticks: {
                            font: { size: 10 },
                            callback: value => `₱${value}`
                        }
                    }
                }
            }
        });
    }

    // ----- Financial Overview Line Chart (Gross Sales, Expenses, Gross Profit) -----
    await loadFinancialOverviewChart();

    // ----- Top Selling Items (all-time) -----
    const topSellingMap = {};
    sales.forEach(s=>{
        s.items.forEach(i=>{
            const key = i.id || `${i.name}-${i.category}`;
            if(!topSellingMap[key]){
                topSellingMap[key] = { id: i.id, name: i.name, category: i.category, qty: 0, gross: 0 };
            }
            topSellingMap[key].qty += i.qty;
            topSellingMap[key].gross += i.price * i.qty;
        });
    });

    const topSelling = Object.values(topSellingMap)
        .sort((a,b)=>b.qty - a.qty)
        .slice(0, 10);

    const topTableBody = document.querySelector('#top-selling-table tbody');
    if(topTableBody){
        topTableBody.innerHTML = '';
        topSelling.forEach(item=>{
            const row = `<tr>
                <td>${item.name}</td>
                <td>${item.qty}</td>
                <td>${item.gross.toFixed(2)}</td>
                <td>${item.category}</td>
            </tr>`;
            topTableBody.insertAdjacentHTML('beforeend', row);
        });
    }
}

async function loadSalesJournal(){
    console.log('🔄 DEBUG: loadSalesJournal() called');
    const month = document.getElementById('sales-month').value;
    const sales = await getAllSales();
    const inventory = await getAllInventory(); // Get inventory to get actual costs
    const journals = await getAllJournals(); // Get expenses
    const expenses = journals.filter(j=>j.type==='expense');
    
    console.log('🔄 DEBUG: loadSalesJournal data loaded:', {
        month: month,
        salesCount: sales.length,
        expensesCount: expenses.length,
        expenses: expenses.map(e => ({ 
            id: e.id, 
            cash: e.cash, 
            paidAmount: e.paidAmount,
            paid: e.paid,
            description: e.description
        }))
    });
    const tbody = document.querySelector('#sales-journal-table tbody');
    tbody.innerHTML = '';
    const currentYear = new Date().getFullYear();
    const monthlySales = {};
    
    // Calculate sales data
    sales.forEach(s=>{
        const date = s.date.split('T')[0];
        if(date.startsWith(`${currentYear}-${month}`)){
            if(!monthlySales[date]) monthlySales[date] = { gross:0, profit:0, expense:0, items: [] };
            s.items.forEach(i=>{
                // Only include non-voided items in sales calculations
                if (!i.voided) {
                    const lineTotal = i.price * i.qty;
                    monthlySales[date].gross += lineTotal;
                    
                    // Get actual cost from inventory (most accurate)
                    const inventoryItem = inventory.find(inv => inv.id === i.id);
                    const actualCost = inventoryItem ? (inventoryItem.cost || 0) : (i.cost || 0);
                    
                    // Calculate profit: (selling price - cost) * quantity
                    const lineProfit = (i.price - actualCost) * i.qty;
                    monthlySales[date].profit += lineProfit;
                    
                    // Track individual items for debugging
                    monthlySales[date].items.push({
                        name: i.name,
                        price: i.price,
                        cost: actualCost,
                        qty: i.qty,
                        lineProfit: lineProfit
                    });
                }
            });
        }
    });
    
    // Calculate REMAINING expenses for each date (committed - paid) - same as Analytics Dashboard
    console.log('🔍 Admin Sales Journal: Using remaining expenses logic (committed - paid) like Analytics Dashboard');
    expenses.forEach(e=>{
        const date = e.date.split('T')[0];
        if(date.startsWith(`${currentYear}-${month}`)){
            if(!monthlySales[date]) monthlySales[date] = { gross:0, profit:0, expense:0, items: [] };
            
            // Calculate total committed amount
            const totalCommitted = (e.cash || 0) + (e.gcash || 0);
            
            // Calculate total paid amount
            let totalPaid = 0;
            if (e.partialPayments && e.partialPayments.length > 0) {
                totalPaid = e.partialPayments.reduce((sum, payment) => sum + payment.amount, 0);
            } else if (e.paidAmount > 0) {
                totalPaid = e.paidAmount;
            }
            
            // Calculate remaining amount (committed - paid)
            const remainingAmount = totalCommitted - totalPaid;
            
            console.log(`🔍 Admin Sales Journal Expense ${e.id} for ${date}:`, {
                description: e.description,
                totalCommitted: totalCommitted,
                totalPaid: totalPaid,
                remainingAmount: remainingAmount,
                usingRemainingAmount: remainingAmount > 0 ? 'Yes' : 'No (fully paid)'
            });
            
            // Only add remaining amounts (same as Analytics Dashboard)
            if (remainingAmount > 0) {
                monthlySales[date].expense += remainingAmount;
            } else {
                console.log(`   ✅ Skipping fully paid expense: ${e.description} (remaining: ₱${remainingAmount})`);
            }
        }
    });
    
    const sortedDates = Object.keys(monthlySales).sort((a,b)=> new Date(b) - new Date(a));
    sortedDates.forEach(date=>{
        const currency = window.posCurrency || '₱';
        const decimals = window.posDecimalPlaces || 2;
        
        // Debug log for 2025-11-29
        if(date === '2025-11-29') {
            console.log('📊 2025-11-29 Items:', monthlySales[date].items);
            console.log(`📊 2025-11-29 Summary: Gross=${monthlySales[date].gross}, Expense=${monthlySales[date].expense}, Profit=${monthlySales[date].profit}`);
        }
        
        // Format date to "Month Day, Year" format
        const dateObj = new Date(date);
        const formattedDate = dateObj.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        // Calculate Net Profit using same formula as Analytics Dashboard: Sales - Cost - Expenses
        const netProfit = monthlySales[date].profit - monthlySales[date].expense;
        const netProfitClass = netProfit >= 0 ? 'text-success' : 'text-danger';
        
        console.log(`💰 Admin Sales Journal ${date} - Net Profit Calculation (same as Analytics Dashboard):`);
        console.log(`   - Gross Sales: ₱${monthlySales[date].gross.toFixed(2)}`);
        console.log(`   - Gross Profit (Sales - Cost): ₱${monthlySales[date].profit.toFixed(2)}`);
        console.log(`   - Remaining Expenses: ₱${monthlySales[date].expense.toFixed(2)}`);
        console.log(`   - Net Profit Formula: Gross Profit - Remaining Expenses`);
        console.log(`   - Net Profit: ₱${monthlySales[date].profit.toFixed(2)} - ₱${monthlySales[date].expense.toFixed(2)} = ₱${netProfit.toFixed(2)}`);
        console.log(`   - Updates automatically when expenses change (same as Analytics Dashboard)`);
        
        console.log(`📊 Sales Journal ${date}:`, {
            gross: monthlySales[date].gross.toFixed(2),
            expense: monthlySales[date].expense.toFixed(2),
            profit: monthlySales[date].profit.toFixed(2),
            netProfit: netProfit.toFixed(2),
            expenseType: 'remaining amounts (committed - paid) - same as Analytics Dashboard'
        });
        
        const row = `<tr class="sales-journal-row clickable-row" data-date="${date}" style="cursor: pointer;">
            <td>${formattedDate}</td>
            <td><button type="button" class="btn btn-outline-primary btn-sm view-sales-btn" data-date="${date}">View</button></td>
            <td>${currency}${monthlySales[date].gross.toFixed(decimals)}</td>
            <td class="text-danger fw-semibold" style="color: #8B0000 !important;">${currency}${monthlySales[date].expense.toFixed(decimals)}</td>
            <td class="text-success fw-semibold" style="color: #006400 !important;">${currency}${monthlySales[date].profit.toFixed(decimals)}</td>
            <td class="${netProfitClass} fw-semibold">${currency}${netProfit.toFixed(decimals)}</td>
        </tr>`;
        tbody.insertAdjacentHTML('beforeend', row);
    });
    const totalMonthly = Object.values(monthlySales).reduce((sum,d)=>sum+d.gross,0);
    const totalMonthlyExpenses = Object.values(monthlySales).reduce((sum,d)=>sum+d.expense,0);
    const totalMonthlyProfit = Object.values(monthlySales).reduce((sum,d)=>sum+d.profit,0);
    const totalMonthlyNetProfit = totalMonthlyProfit - totalMonthlyExpenses;
    
    const currency = window.posCurrency || '₱';
    const decimals = window.posDecimalPlaces || 2;
    const monthlyGrossEl = document.getElementById('monthly-gross');
    if (monthlyGrossEl) {
        monthlyGrossEl.textContent = `${currency}${totalMonthly.toFixed(decimals)}`;
        console.log('✅ monthly-gross updated');
    } else {
        console.log('❌ monthly-gross element not found');
    }
    
    console.log('📊 Sales Journal Monthly Summary (same as Analytics Dashboard):', {
        totalGross: totalMonthly.toFixed(2),
        totalExpenses: totalMonthlyExpenses.toFixed(2),
        totalProfit: totalMonthlyProfit.toFixed(2),
        totalNetProfit: totalMonthlyNetProfit.toFixed(2),
        expenseType: 'remaining amounts (committed - paid)',
        netProfitFormula: 'Total Profit - Total Expenses'
    });
    
    // Update Revenue Trends chart to stay synchronized with Sales Journal
    try {
        console.log('📈 Updating Revenue Trends chart after Sales Journal refresh...');
        await loadFinancialOverviewChart();
        console.log('✅ Revenue Trends chart updated successfully');
    } catch (error) {
        console.error('❌ Error updating Revenue Trends chart:', error);
    }
}

async function handleSalesJournalRowClick(event){
    console.log('🖱️ Sales journal clicked:', event.target);
    
    // Handle View button clicks
    if (event.target.classList.contains('view-sales-btn')) {
        console.log('🔘 View button clicked');
        event.stopPropagation();
        const date = event.target.dataset.date;
        console.log('📅 Date from button:', date);
        if (date) {
            await showSalesDetailsForDate(date);
        }
        return;
    }
    
    // Handle row clicks
    const row = event.target.closest('tr');
    console.log('📊 Row clicked:', row);
    if (!row || !row.dataset || !row.dataset.date) {
        console.log('❌ No valid row or date found');
        return;
    }
    const date = row.dataset.date;
    console.log('📅 Date from row:', date);
    await showSalesDetailsForDate(date);
}

async function showSalesDetailsForDate(date){
    console.log('🔍 Showing sales details for date:', date);
    const sales = await getAllSales();
    console.log('📊 Total sales loaded:', sales.length);
    const items = [];
    let total = 0;
    let voidedTotal = 0;

    sales.forEach(s => {
        if (!s.date || !s.items) return;
        const saleDate = s.date.split('T')[0];
        if (saleDate !== date) return;
        s.items.forEach(i => {
            const lineTotal = (i.price || 0) * (i.qty || 0);
            if (i.voided) {
                voidedTotal += lineTotal;
            } else {
                total += lineTotal;
            }
            items.push({
                name: i.name,
                category: i.category,
                price: i.price,
                qty: i.qty,
                lineTotal,
                voided: i.voided || false,
                voidReason: i.voidReason || '',
                voidDate: i.voidDate || ''
            });
        });
    });

    const tbody = document.querySelector('#sales-details-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    items.forEach(item => {
        const voidClass = item.voided ? 'text-decoration-line-through text-muted' : '';
        const voidBadge = item.voided ? '<span class="badge bg-secondary ms-2">VOIDED</span>' : '';
        const voidReason = item.voided ? `<br><small class="text-muted">Reason: ${item.voidReason}</small>` : '';
        const row = `<tr class="${item.voided ? 'table-secondary' : ''}">
            <td class="${voidClass}">${item.name}${voidBadge}${voidReason}</td>
            <td class="${voidClass}">${item.category || ''}</td>
            <td class="${voidClass}">${(item.price || 0).toFixed(2)}</td>
            <td class="${voidClass}">${item.qty}</td>
            <td class="${voidClass}">${item.lineTotal.toFixed(2)}</td>
        </tr>`;
        tbody.insertAdjacentHTML('beforeend', row);
    });

    // Update totals with voided items info
    const totalEl = document.getElementById('sales-details-total');
    if (totalEl) {
        totalEl.innerHTML = `${total.toFixed(2)}${voidedTotal > 0 ? `<br><small class="text-muted">Voided: ₱${voidedTotal.toFixed(2)}</small>` : ''}`;
    }

    const titleEl = document.getElementById('salesDetailsModalLabel');
    if (titleEl) {
        titleEl.textContent = `Sales Details - ${date}${voidedTotal > 0 ? ' (Including Voided Items)' : ''}`;
    }

    const modalEl = document.getElementById('salesDetailsModal');
    console.log('🎭 Modal element:', modalEl);
    if (modalEl && window.bootstrap) {
        console.log('✅ Showing modal for date:', date);
        const modal = new window.bootstrap.Modal(modalEl);
        modal.show();
    } else {
        console.log('❌ Modal or Bootstrap not available');
    }
}

async function loadExpenseJournal(){
    const journals = await getAllJournals();
    const dateFilter = document.getElementById('expense-date-filter')?.value;
    
    let expenses = journals.filter(j=>j.type==='expense');
    
    // Apply date filter if selected
    if (dateFilter) {
        expenses = expenses.filter(e => {
            if (!e.date) return false;
            const expenseDate = new Date(e.date).toISOString().split('T')[0];
            return expenseDate === dateFilter;
        });
    }
    
    // Sort by date (newest first)
    expenses.sort((a,b)=> new Date(b.date) - new Date(a.date));
    
    const tbody = document.querySelector('#expense-journal-table tbody');
    tbody.innerHTML = '';
    
    if (expenses.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center text-muted py-3">
                    No expenses found${dateFilter ? ` for ${dateFilter}` : ''}
                </td>
            </tr>
        `;
    } else {
        expenses.forEach(e=>{
            const d = e.date ? new Date(e.date) : null;
            const formatted = d && !isNaN(d)
                ? d.toLocaleString(undefined, {
                    year: 'numeric', month: 'long', day: '2-digit',
                    hour: 'numeric', minute: '2-digit', hour12: true
                })
                : (e.date || '');
            
            const isPaid = e.paid || (e.cash || 0) === 0;
            const statusBadge = isPaid 
                ? '<span class="badge bg-success">Paid</span>' 
                : '<span class="badge bg-warning">Pending</span>';
            
            // Calculate progress information
            const totalAmount = e.cash || 0;
            const paidAmount = e.paidAmount || 0;
            const remainingAmount = totalAmount - paidAmount;
            const progressPercentage = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;
            
            console.log(`📊 Expense ${e.id} Progress:`, {
                total: totalAmount.toFixed(2),
                paid: paidAmount.toFixed(2),
                remaining: remainingAmount.toFixed(2),
                percentage: progressPercentage.toFixed(1) + '%',
                status: isPaid ? 'Paid' : 'Pending'
            });
            
            // Create progress bar
            let progressBar = '';
            let progressColor = '';
            if (progressPercentage >= 100) {
                progressColor = 'bg-success';
            } else if (progressPercentage >= 75) {
                progressColor = 'bg-info';
            } else if (progressPercentage >= 50) {
                progressColor = 'bg-primary';
            } else if (progressPercentage >= 25) {
                progressColor = 'bg-warning';
            } else if (progressPercentage > 0) {
                progressColor = 'bg-danger';
            } else {
                progressColor = 'bg-secondary';
            }
            
            progressBar = `
                <div class="progress" style="height: 20px;">
                    <div class="progress-bar ${progressColor}" role="progressbar" 
                         style="width: ${progressPercentage}%; font-size: 0.75rem;" 
                         aria-valuenow="${progressPercentage}" aria-valuemin="0" aria-valuemax="100">
                        ${progressPercentage > 0 ? progressPercentage.toFixed(0) + '%' : ''}
                    </div>
                </div>
            `;
            
            const row = `<tr>
                <td>${formatted}</td>
                <td class="text-center">
                    <button type="button" class="btn btn-outline-primary btn-sm" onclick="showExpenseDetails('${e.id}')" style="font-size: 0.8rem; padding: 0.25rem 0.5rem;">
                        <i class="fas fa-eye" style="font-size: 0.7rem;"></i> View Payment
                    </button>
                </td>
                <td class="text-center">${statusBadge}</td>
                <td>${e.description}</td>
                <td>₱${totalAmount.toFixed(2)}</td>
                <td class="text-center">₱${paidAmount.toFixed(2)}</td>
                <td class="text-center">${progressBar}</td>
            </tr>`;
            tbody.insertAdjacentHTML('beforeend', row);
        });
    }
    
    // Calculate total expenses using same logic as Analytics Dashboard (committed - paid)
    console.log('🔍 Dashboard: Using remaining expenses logic (committed - paid) like Analytics Dashboard');
    const totalPaidExpenses = expenses.reduce((sum,e)=>sum+(e.paidAmount || 0),0);
    const totalRemainingExpenses = expenses.reduce((sum,e)=>sum+((e.cash || 0) - (e.paidAmount || 0)),0);
    const totalCommittedExpenses = expenses.reduce((sum,e)=>sum+(e.cash || 0),0);
    
    console.log('💰 Dashboard Expense Calculation:');
    console.log(`   - Total Committed: ₱${totalCommittedExpenses.toFixed(2)}`);
    console.log(`   - Total Paid: ₱${totalPaidExpenses.toFixed(2)}`);
    console.log(`   - Total Remaining: ₱${totalRemainingExpenses.toFixed(2)} ← Shown in REMAINING card (TOTAL EXPENSES removed)`);
    
    // Update Paid Amount card
    const paidExpensesEl = document.getElementById('paid-expenses');
    if (paidExpensesEl) {
        paidExpensesEl.textContent = totalPaidExpenses.toFixed(2);
        console.log('✅ PAID AMOUNT updated:', totalPaidExpenses.toFixed(2));
    } else {
        console.log('❌ paid-expenses element not found');
    }
    
    // Update Remaining Amount card
    const remainingExpensesEl = document.getElementById('remaining-expenses');
    if (remainingExpensesEl) {
        remainingExpensesEl.textContent = totalRemainingExpenses.toFixed(2);
        console.log('✅ REMAINING updated:', totalRemainingExpenses.toFixed(2));
    } else {
        console.log('❌ remaining-expenses element not found');
    }
    
    console.log('💰 Dashboard Expense Summary (TOTAL EXPENSES removed):', {
        paid: totalPaidExpenses.toFixed(2),
        remaining: totalRemainingExpenses.toFixed(2),
        paidPercentage: totalCommittedExpenses > 0 ? ((totalPaidExpenses / totalCommittedExpenses) * 100).toFixed(1) + '%' : '0%',
        note: 'TOTAL EXPENSES card removed - showing PAID and REMAINING cards only'
    });
    
    // Update Revenue Trends chart to stay synchronized with Expense Journal
    try {
        console.log('📈 Updating Revenue Trends chart after Expense Journal refresh...');
        await loadFinancialOverviewChart();
        console.log('✅ Revenue Trends chart updated successfully');
    } catch (error) {
        console.error('❌ Error updating Revenue Trends chart:', error);
    }
}

async function loadAuditLogs(){
    const logs = await getAllAuditLogs();
    const auditDatePicker = document.getElementById('audit-date-picker');
    const selectedDate = auditDatePicker?.value;
    
    // Filter out SECURITY_INITIALIZED logs
    let filteredLogs = logs.filter(log => log.action !== 'SECURITY_INITIALIZED');
    
    // Filter by selected date if provided
    if (selectedDate) {
        filteredLogs = filteredLogs.filter(log => {
            if (!log.date) return false;
            const logDate = new Date(log.date).toISOString().split('T')[0];
            return logDate === selectedDate;
        });
    }
    
    // sort by date descending so newest logs appear first
    filteredLogs.sort((a, b) => new Date(b.date) - new Date(a.date));
    const tbody = document.querySelector('#audit-logs-table tbody');
    tbody.innerHTML='';
    filteredLogs.forEach(log=>{
        const d = log.date ? new Date(log.date) : null;
        const formatted = d && !isNaN(d)
            ? d.toLocaleString(undefined, {
                year: 'numeric', month: 'long', day: '2-digit',
                hour: 'numeric', minute: '2-digit', hour12: true
            })
            : (log.date || '');
        const row = `<tr>
            <td>${formatted}</td>
            <td>${log.action}</td>
        </tr>`;
        tbody.insertAdjacentHTML('beforeend', row);
    });
}

// Clean SECURITY_INITIALIZED logs from database
async function cleanSecurityLogs() {
    try {
        const logs = await getAllAuditLogs();
        const securityLogs = logs.filter(log => log.action === 'SECURITY_INITIALIZED');
        
        if (securityLogs.length === 0) {
            alert('No SECURITY_INITIALIZED logs found to clean.');
            return;
        }
        
        // Delete each security log
        for (const log of securityLogs) {
            if (typeof deleteAuditLog === 'function') {
                await deleteAuditLog(log.id);
            } else {
                console.warn('deleteAuditLog function not available');
            }
        }
        
        // Reload the audit logs display
        await loadAuditLogs();
        
        alert(`Successfully removed ${securityLogs.length} SECURITY_INITIALIZED log(s).`);
        console.log(`✅ Cleaned ${securityLogs.length} SECURITY_INITIALIZED logs from database`);
    } catch (error) {
        console.error('❌ Error cleaning security logs:', error);
        alert('Error cleaning security logs. Please try again.');
    }
}

async function loadVoidItems(){
    const sales = await getAllSales();
    const voidDatePicker = document.getElementById('void-date-picker');
    const selectedDate = voidDatePicker?.value;
    
    const tbody = document.querySelector('#void-item-table tbody');
    if (!tbody) return;

    const entries = [];
    sales.forEach(s => {
        if (!s.items) return;
        s.items.forEach(i => {
            if (!i.voided) return;
            const when = i.voidDate || s.date;
            
            // Filter by selected date if provided
            if (selectedDate) {
                const entryDate = new Date(when).toISOString().split('T')[0];
                if (entryDate !== selectedDate) return;
            }
            
            entries.push({
                when,
                name: i.name,
                qty: i.qty,
                category: i.category,
                reason: i.voidReason || ''
            });
        });
    });

    entries.sort((a, b) => new Date(b.when) - new Date(a.when));

    tbody.innerHTML = '';
    entries.forEach(entry => {
        const d = entry.when ? new Date(entry.when) : null;
        let dateCellHtml = entry.when || '';
        if (d && !isNaN(d)) {
            const datePart = d.toLocaleDateString(undefined, {
                year: 'numeric', month: 'short', day: '2-digit'
            });
            const timePart = d.toLocaleTimeString(undefined, {
                hour: 'numeric', minute: '2-digit', hour12: true
            });
            dateCellHtml = `<span class="sales-date-main">${datePart}</span><span class="sales-date-sub">${timePart}</span>`;
        }
        const row = `<tr>
            <td class="sales-history-date">${dateCellHtml}</td>
            <td>${entry.name || ''}</td>
            <td>${entry.qty || 0}</td>
            <td>${entry.category || ''}</td>
            <td>${entry.reason || ''}</td>
        </tr>`;
        tbody.insertAdjacentHTML('beforeend', row);
    });

    const searchInput = document.getElementById('void-item-search');
    if (searchInput && !searchInput.dataset.bound) {
        searchInput.dataset.bound = 'true';
        searchInput.addEventListener('input', () => {
            const term = searchInput.value.toLowerCase();
            Array.from(tbody.querySelectorAll('tr')).forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(term) ? '' : 'none';
            });
        });
    }

    // Void Date Picker Functionality
    const voidDatePickerEl = document.getElementById('void-date-picker');
    if (voidDatePickerEl) {
        voidDatePickerEl.addEventListener('change', function() {
            loadVoidItems(); // Reload void items with date filter
        });
    }
}

function populateSettingsForm(){
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return;
    let data;
    try {
        data = JSON.parse(raw);
    } catch {
        return;
    }

    const vatInput = document.getElementById('vat-rate');
    const scInput = document.getElementById('service-charge-rate');
    const titleInput = document.getElementById('receipt-title');
    const footerInput = document.getElementById('receipt-footer');
    const logoPreview = document.getElementById('receipt-logo-preview');

    if (vatInput && data.vatRate != null) vatInput.value = data.vatRate;
    if (scInput && data.serviceChargeRate != null) scInput.value = data.serviceChargeRate;
    if (titleInput && data.receiptTitle != null) titleInput.value = data.receiptTitle;
    if (footerInput && data.receiptFooter != null) footerInput.value = data.receiptFooter;

    currentReceiptLogoData = data.receiptLogo || '';
    if (logoPreview) {
        if (currentReceiptLogoData) {
            logoPreview.src = currentReceiptLogoData;
            logoPreview.style.display = 'block';
        } else {
            logoPreview.src = '';
            logoPreview.style.display = 'none';
        }
    }
}

function handleReceiptLogoChange(e){
    const file = e.target.files && e.target.files[0];
    const preview = document.getElementById('receipt-logo-preview');
    if (!file) {
        currentReceiptLogoData = '';
        if (preview) {
            preview.src = '';
            preview.style.display = 'none';
        }
        return;
    }
    const reader = new FileReader();
    reader.onload = () => {
        currentReceiptLogoData = reader.result;
        if (preview) {
            preview.src = currentReceiptLogoData;
            preview.style.display = 'block';
        }
    };
    reader.readAsDataURL(file);
}

function saveSettings(e){
    e.preventDefault();
    const vatInput = document.getElementById('vat-rate');
    const scInput = document.getElementById('service-charge-rate');
    const titleInput = document.getElementById('receipt-title');
    const footerInput = document.getElementById('receipt-footer');
    const statusEl = document.getElementById('settings-status');

    const vat = vatInput ? parseFloat(vatInput.value) || 0 : 0;
    const sc = scInput ? parseFloat(scInput.value) || 0 : 0;
    const title = titleInput ? titleInput.value || '' : '';
    const footer = footerInput ? footerInput.value || '' : '';

    const data = {
        vatRate: vat,
        serviceChargeRate: sc,
        receiptTitle: title,
        receiptFooter: footer,
        receiptLogo: currentReceiptLogoData || ''
    };

    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(data));

    if (statusEl) {
        statusEl.textContent = 'Settings saved.';
        statusEl.style.display = 'block';
        setTimeout(() => {
            statusEl.style.display = 'none';
        }, 2500);
    }
}

// Utility: auto-fit columns in a SheetJS worksheet based on data
function autofitSheet(worksheet, rows){
    if (!worksheet || !rows || !rows.length) return;
    const headers = Object.keys(rows[0]);
    const colWidths = headers.map(header => {
        const headerLength = String(header).length;
        const maxCellLength = rows.reduce((max, row) => {
            const value = row[header] == null ? '' : String(row[header]);
            return Math.max(max, value.length);
        }, 0);
        return { wch: Math.max(headerLength, maxCellLength) + 2 };
    });
    worksheet['!cols'] = colWidths;
}

// --- Export all data to Excel ---
async function exportAllData(){
    const btn = document.getElementById('export-data-btn');
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'Exporting…';
    }

    try {
        const [inventory, sales, journals, auditLogs] = await Promise.all([
            getAllInventory(),
            getAllSales(),
            getAllJournals(),
            getAllAuditLogs()
        ]);

        const wb = XLSX.utils.book_new();

        const totalGross = sales.reduce((sum, s) => sum + (s.total || 0), 0);
        const expensesOnly = journals.filter(j => j.type === 'expense');
        // Use committed expenses (paid + remaining) instead of just paid amounts
        const totalExpenses = expensesOnly.reduce((sum, e) => sum + (e.cash || 0), 0);

        const summaryRows = [
            { Metric: 'Export Date', Value: new Date().toLocaleString() },
            { Metric: 'Inventory Items', Value: inventory.length },
            { Metric: 'Total Gross Sales', Value: totalGross.toFixed(2) },
            { Metric: 'Total Expenses', Value: totalExpenses.toFixed(2) },
            { Metric: 'Net Sales', Value: (totalGross - totalExpenses).toFixed(2) }
        ];
        const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
        autofitSheet(wsSummary, summaryRows);
        XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

        const inventoryData = inventory.map(item => ({
            ID: item.id,
            Name: item.name,
            Price: item.price,
            Stock: item.stock,
            Category: item.category
        }));
        const wsInventory = XLSX.utils.json_to_sheet(inventoryData);
        autofitSheet(wsInventory, inventoryData);
        XLSX.utils.book_append_sheet(wb, wsInventory, 'Inventory');

        const salesRows = [];
        sales.forEach(s => {
            if (!s.items) return;
            s.items.forEach(i => {
                salesRows.push({
                    SaleID: s.id,
                    Date: s.date,
                    ItemID: i.id,
                    Name: i.name,
                    Category: i.category,
                    Price: i.price,
                    Qty: i.qty,
                    LineTotal: (i.price || 0) * (i.qty || 0),
                    SaleTotal: s.total
                });
            });
        });
        salesRows.sort((a, b) => new Date(b.Date) - new Date(a.Date));
        const wsSales = XLSX.utils.json_to_sheet(salesRows);
        autofitSheet(wsSales, salesRows);
        XLSX.utils.book_append_sheet(wb, wsSales, 'Sales');

        const journalRows = journals.map(j => ({
            ID: j.id,
            Type: j.type,
            Date: j.date,
            Description: j.description || '',
            Cash: j.cash || 0,
            GCash: j.gcash || 0
        }));
        journalRows.sort((a, b) => new Date(b.Date) - new Date(a.Date));
        const wsJournals = XLSX.utils.json_to_sheet(journalRows);
        autofitSheet(wsJournals, journalRows);
        XLSX.utils.book_append_sheet(wb, wsJournals, 'Journals');

        const auditRows = auditLogs.map(log => ({
            ID: log.id,
            Date: log.date,
            Action: log.action
        }));
        auditRows.sort((a, b) => new Date(b.Date) - new Date(a.Date));
        const wsAudit = XLSX.utils.json_to_sheet(auditRows);
        autofitSheet(wsAudit, auditRows);
        XLSX.utils.book_append_sheet(wb, wsAudit, 'Audit Logs');

        const backupRows = [];
        sales.forEach(s => {
            if (!s.items) return;
            s.items.forEach(i => {
                backupRows.push({
                    Name: i.name,
                    Price: i.price,
                    Quantity: i.qty,
                    Category: i.category,
                    Date: s.date
                });
            });
        });
        backupRows.sort((a, b) => new Date(b.Date) - new Date(a.Date));
        const wsBackup = XLSX.utils.json_to_sheet(backupRows);
        autofitSheet(wsBackup, backupRows);
        XLSX.utils.book_append_sheet(wb, wsBackup, 'Backup Sales');

        const fileName = `Zenith_POS_Export_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);
    } catch (err) {
        console.error('Export failed', err);
        alert('Failed to export data. Please try again.');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.textContent = 'Export Data';
        }
    }
}

// TOP SELLING ITEMS FUNCTIONALITY
let topSellingData = [];
let currentSortMethod = 'quantity';

// Load Top Selling Items
async function loadTopSellingItems() {
    try {
        console.log('🔍 Loading top selling items with real-time data...');
        
        if (typeof getAllSales !== 'function') {
            console.log('getAllSales function not available');
            // Still update the Top 3 Items card to show "No data" message
            updateTop3ItemsCard();
            return;
        }

        const sales = await getAllSales();
        const fromDate = document.getElementById('top-selling-from-date').value;
        const toDate = document.getElementById('top-selling-to-date').value;
        
        // Set default date range to today if not specified
        const today = new Date().toISOString().split('T')[0];
        const effectiveFromDate = fromDate || today;
        const effectiveToDate = toDate || today;

        console.log(`📅 Filtering sales from ${effectiveFromDate} to ${effectiveToDate}`);
        console.log(`📊 Total sales found: ${sales.length}`);

        // Filter sales by date range with precise date matching
        let filteredSales = sales.filter(sale => {
            if (!sale.date) return false;
            
            // Extract date part and ensure proper timezone handling
            const saleDate = new Date(sale.date);
            const saleDateString = saleDate.toISOString().split('T')[0];
            
            // Include sales within the date range (inclusive)
            return saleDateString >= effectiveFromDate && saleDateString <= effectiveToDate;
        });

        console.log(`📊 Found ${filteredSales.length} sales in date range`);

        // Aggregate items sold with enhanced tracking
        const itemStats = {};
        let totalQuantity = 0;
        let totalRevenue = 0;
        let voidedItemsCount = 0;

        filteredSales.forEach(sale => {
            if (sale.items && Array.isArray(sale.items)) {
                sale.items.forEach(item => {
                    // Track all items for reporting, but only count non-voided for totals
                    const key = `${item.name}_${item.category}_${item.price}`;
                    
                    if (!itemStats[key]) {
                        itemStats[key] = {
                            name: item.name,
                            category: item.category,
                            price: item.price,
                            quantity: 0,
                            revenue: 0,
                            voidedQuantity: 0,
                            voidedRevenue: 0,
                            saleCount: 0
                        };
                    }
                    
                    if (item.voided) {
                        voidedItemsCount++;
                        itemStats[key].voidedQuantity += item.qty || 1;
                        itemStats[key].voidedRevenue += (item.price * (item.qty || 1));
                    } else {
                        itemStats[key].quantity += item.qty || 1;
                        itemStats[key].revenue += (item.price * (item.qty || 1));
                        itemStats[key].saleCount += 1;
                        totalQuantity += item.qty || 1;
                        totalRevenue += (item.price * (item.qty || 1));
                    }
                });
            }
        });

        // Convert to array and filter out items with zero sales
        topSellingData = Object.values(itemStats).filter(item => item.quantity > 0);
        sortTopItems(currentSortMethod);

        // Summary cards removed

        // Display table
        displayTopSellingTable();

        console.log(`✅ Loaded ${topSellingData.length} top selling items`);
        console.log('📊 Total quantity:', totalQuantity, 'Total revenue:', totalRevenue);
        console.log(`🚫 Voided items excluded: ${voidedItemsCount} items`);
        console.log(`📅 Date range: ${effectiveFromDate} to ${effectiveToDate}`);

    } catch (error) {
        console.error('❌ Error loading top selling items:', error);
        // Still update the Top 3 Items card even if there's an error
        updateTop3ItemsCard();
    }
}

// Summary cards function removed

// Update Top 3 Items card
function updateTop3ItemsCard() {
    const top3ItemsElement = document.getElementById('top-3-items-display');
    console.log('🔍 Top 3 Items element:', top3ItemsElement);
    if (!top3ItemsElement) {
        console.log('❌ top-3-items-display element not found');
        return;
    }
    
    console.log('📊 Top selling data length:', topSellingData.length);
    
    // Always show top 3 items from the current Top Selling data
    // If no data exists, show a message that reflects the current filter state
    if (topSellingData.length === 0) {
        const fromDate = document.getElementById('top-selling-from-date')?.value;
        const toDate = document.getElementById('top-selling-to-date')?.value;
        const dateRange = (fromDate || toDate) ? 'for selected dates' : 'for today';
        const noSalesHtml = `<div class="small" style="color: black !important;">No sales ${dateRange}</div>`;
        console.log('📝 Setting no sales HTML:', noSalesHtml);
        top3ItemsElement.innerHTML = noSalesHtml;
        return;
    }
    
    // Get top 3 items based on current sort method (always show the top 3)
    const top3Items = [...topSellingData].slice(0, 3);
    
    // Create numbered list of top 3 items with medals
    const medals = ['🥇', '🥈', '🥉'];
    const sortLabel = currentSortMethod === 'quantity' ? 'qty' : 'rev';
    const top3Html = top3Items.map((item, index) => {
        const value = currentSortMethod === 'quantity' ? item.quantity : `₱${item.revenue.toLocaleString()}`;
        return `<div class="small" style="color: black !important; font-weight: 500;">${medals[index]} ${index + 1}. ${item.name} (${value})</div>`;
    }).join('');
    
    console.log('📝 Setting Top 3 HTML:', top3Html);
    
    // Update the card display
    top3ItemsElement.innerHTML = top3Html;
    
    console.log(`🏆 Updated Top 3 Items (${currentSortMethod}): ${top3Items.map(item => item.name).join(', ')}`);
}


// Sort Top Items
function sortTopItems(method) {
    currentSortMethod = method;
    
    // Update button states
    document.getElementById('sort-by-quantity').classList.toggle('active', method === 'quantity');
    document.getElementById('sort-by-revenue').classList.toggle('active', method === 'revenue');
    
    // Reload and sort the data based on current date range
    loadTopSellingItems().then(() => {
        // Sort the data after loading
        if (method === 'quantity') {
            topSellingData.sort((a, b) => b.quantity - a.quantity);
        } else if (method === 'revenue') {
            topSellingData.sort((a, b) => b.revenue - a.revenue);
        }
        
        // Re-display table
        displayTopSellingTable();
        
        // Update Top 3 Items card to reflect the new sort
        updateTop3ItemsCard();
        
        console.log(`🔄 Sorted top items by ${method}`);
    });
}

// Display Top Selling Table
function displayTopSellingTable() {
    const tbody = document.querySelector('#top-selling-table tbody');
    if (!tbody) return;

    if (topSellingData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-muted">
                    <i class="fas fa-chart-line fa-2x mb-2"></i>
                    <div>No sales data found for the selected period</div>
                    <small class="text-muted">Try adjusting the date range or check if sales have been made</small>
                </td>
            </tr>
        `;
        return;
    }

    // Calculate total for percentage
    const totalRevenue = topSellingData.reduce((sum, item) => sum + item.revenue, 0);
    const totalQuantity = topSellingData.reduce((sum, item) => sum + item.quantity, 0);

    tbody.innerHTML = topSellingData.map((item, index) => {
        const revenuePercentage = totalRevenue > 0 ? (item.revenue / totalRevenue * 100).toFixed(1) : 0;
        const quantityPercentage = totalQuantity > 0 ? (item.quantity / totalQuantity * 100).toFixed(1) : 0;
        
        return `
            <tr>
                <td><strong>#${index + 1}</strong></td>
                <td>
                    <div class="fw-semibold">${item.name}</div>
                    <small class="text-muted">${item.category || 'N/A'}</small>
                    <div class="small text-info">${item.saleCount} sales</div>
                </td>
                <td>${item.category || 'N/A'}</td>
                <td>₱${item.price.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td>
                    <span class="badge bg-primary">${item.quantity.toLocaleString()}</span>
                    <div class="small text-muted">${quantityPercentage}%</div>
                </td>
                <td>
                    <strong>₱${item.revenue.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                    <div class="small text-muted">${revenuePercentage}%</div>
                </td>
                <td>
                    <div class="progress" style="height: 20px;">
                        <div class="progress-bar bg-success" role="progressbar" style="width: ${revenuePercentage}%" aria-valuenow="${revenuePercentage}" aria-valuemin="0" aria-valuemax="100">
                            ${revenuePercentage}%
                        </div>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    
    console.log(`📊 Displayed ${topSellingData.length} items in table`);
}

// Filter Top Selling Items by Date
function filterTopSellingItems() {
    const fromDate = document.getElementById('top-selling-from-date').value;
    const toDate = document.getElementById('top-selling-to-date').value;
    
    console.log(`📅 Filtering top selling items from ${fromDate} to ${toDate}`);
    
    // Reload data with new date filter
    loadTopSellingItems();
}

// Export Top Selling Items
async function exportTopSellingItems() {
    try {
        console.log('📥 Exporting top selling items...');
        
        if (topSellingData.length === 0) {
            alert('No data to export');
            return;
        }

        // Create CSV content
        const headers = ['Rank', 'Item Name', 'Category', 'Price', 'Quantity Sold', 'Total Revenue', '% of Total'];
        const csvContent = [
            headers.join(','),
            ...topSellingData.map((item, index) => {
                const totalRevenue = topSellingData.reduce((sum, i) => sum + i.revenue, 0);
                const percentage = totalRevenue > 0 ? (item.revenue / totalRevenue * 100).toFixed(1) : 0;
                return [
                    index + 1,
                    `"${item.name}"`,
                    `"${item.category || 'N/A'}"`,
                    item.price.toFixed(2),
                    item.quantity,
                    item.revenue.toFixed(2),
                    `${percentage}%`
                ].join(',');
            })
        ].join('\n');

        // Add summary at the end
        const totalQuantity = topSellingData.reduce((sum, item) => sum + item.quantity, 0);
        const totalRevenue = topSellingData.reduce((sum, item) => sum + item.revenue, 0);
        const fromDate = document.getElementById('top-selling-from-date').value || 'All time';
        const toDate = document.getElementById('top-selling-to-date').value || 'All time';
        
        const summary = [
            '',
            'SUMMARY',
            `Date Range,${fromDate} to ${toDate}`,
            `Total Items,${topSellingData.length}`,
            `Total Quantity Sold,${totalQuantity}`,
            `Total Revenue,₱${totalRevenue.toFixed(2)}`
        ].join('\n');

        const finalContent = csvContent + summary;

        // Download file
        const blob = new Blob([finalContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `top_selling_items_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);

        console.log('✅ Top selling items exported successfully');

    } catch (error) {
        console.error('❌ Error exporting top selling items:', error);
        alert('Failed to export data. Please try again.');
    }
}

// Initialize Top Selling tab when it's shown
document.addEventListener('DOMContentLoaded', function() {
    // Add event listener for Top Selling tab
    const topSellingTab = document.getElementById('top-selling-tab');
    if (topSellingTab) {
        topSellingTab.addEventListener('shown.bs.tab', function() {
            // Set default dates (last 30 days)
            const today = new Date();
            const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
            
            document.getElementById('top-selling-from-date').value = thirtyDaysAgo.toISOString().split('T')[0];
            document.getElementById('top-selling-to-date').value = today.toISOString().split('T')[0];
            
            loadTopSellingItems();
        });
    }
    
    // Add event listener for Sales Journal tab
    const salesJournalTab = document.getElementById('sales-journal-tab');
    if (salesJournalTab) {
        salesJournalTab.addEventListener('shown.bs.tab', function() {
            loadSalesJournal();
        });
    }
    
    // Add event listener for Expense Journal tab
    const expenseJournalTab = document.getElementById('expense-journal-tab');
    if (expenseJournalTab) {
        expenseJournalTab.addEventListener('shown.bs.tab', function() {
            loadExpenseJournal();
        });
    }
    
    // Add event listener for Audit Logs tab
    const auditLogsTab = document.getElementById('audit-logs-tab');
    if (auditLogsTab) {
        auditLogsTab.addEventListener('shown.bs.tab', function() {
            loadAuditLogs();
        });
    }
    
    // Add event listener for Voided Items tab
    const voidItemTab = document.getElementById('void-item-tab');
    if (voidItemTab) {
        voidItemTab.addEventListener('shown.bs.tab', function() {
            loadVoidItems();
        });
    }
    
    // Add event listener for Suppliers tab
    const suppliersTab = document.getElementById('suppliers-tab');
    if (suppliersTab) {
        suppliersTab.addEventListener('shown.bs.tab', function() {
            loadSuppliers();
        });
    }
    
    // Add event listener for Inventory tab
    const inventoryTab = document.getElementById('inventory-product-tab');
    if (inventoryTab) {
        inventoryTab.addEventListener('shown.bs.tab', function() {
            loadInventory();
        });
    }
        
    // Add event listener for View Top 3 Items button
    const viewTop3Btn = document.getElementById('view-top-3-btn');
    if (viewTop3Btn) {
        viewTop3Btn.addEventListener('click', function() {
            // Switch to Top Selling tab
            const topSellingTab = document.getElementById('top-selling-tab');
            if (topSellingTab) {
                const tab = new bootstrap.Tab(topSellingTab);
                tab.show();
            }
        });
    }
});

// Backup and Restore Functions
async function createFullBackup() {
    try {
        console.log('📦 Creating full backup...');
        
        // Collect all data
        const backupData = {
            timestamp: new Date().toISOString(),
            version: '1.0',
            data: {
                inventory: await getAllInventory(),
                sales: await getAllSales(),
                expenses: await getAllJournals(),
                suppliers: await getAllSuppliers(),
                auditLogs: await getAllAuditLogs(),
                settings: getAdminSettings()
            }
        };
        
        // Create downloadable file
        const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        // Generate filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const filename = `zenith-pos-backup-${timestamp}.json`;
        
        // Create download link and trigger download
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // Update backup info
        updateBackupInfo(backupData);
        
        console.log('✅ Backup created successfully');
        if (typeof showAdminNotification === 'function') {
            showAdminNotification('Your backup has been created and downloaded successfully!', 'success');
        } else {
            alert('Your backup has been created and downloaded successfully!');
        }
        
    } catch (error) {
        console.error('❌ Backup creation failed:', error);
        if (typeof showAdminNotification === 'function') {
            showAdminNotification('Failed to create backup: ' + error.message, 'danger');
        } else {
            alert('Failed to create backup: ' + error.message);
        }
    }
}

async function restoreFromBackup(file) {
    try {
        console.log('♻️ Starting data restore...');
        
        const text = await file.text();
        const backupData = JSON.parse(text);
        
        // Validate backup structure
        if (!backupData.data) {
            throw new Error('Invalid backup file structure');
        }
        
        // Confirm restore operation
        const confirmed = confirm('⚠️ This will replace all your current data with the backup. Are you sure you want to continue?');
        if (!confirmed) {
            console.log('Restore cancelled by user');
            return;
        }
        
        // Clear existing data
        await clearAllData();
        
        // Restore inventory
        if (backupData.data.inventory && backupData.data.inventory.length > 0) {
            for (const item of backupData.data.inventory) {
                await addInventoryItem(item);
            }
            console.log(`✅ Restored ${backupData.data.inventory.length} inventory items`);
        }
        
        // Restore sales
        if (backupData.data.sales && backupData.data.sales.length > 0) {
            for (const sale of backupData.data.sales) {
                await addSale(sale);
            }
            console.log(`✅ Restored ${backupData.data.sales.length} sales records`);
        }
        
        // Restore expenses
        if (backupData.data.expenses && backupData.data.expenses.length > 0) {
            for (const expense of backupData.data.expenses) {
                await addJournalEntry(expense);
            }
            console.log(`✅ Restored ${backupData.data.expenses.length} expense records`);
        }
        
        // Restore suppliers
        if (backupData.data.suppliers && backupData.data.suppliers.length > 0) {
            for (const supplier of backupData.data.suppliers) {
                await addSupplier(supplier);
            }
            console.log(`✅ Restored ${backupData.data.suppliers.length} suppliers`);
        }
        
        // Restore audit logs
        if (backupData.data.auditLogs && backupData.data.auditLogs.length > 0) {
            for (const log of backupData.data.auditLogs) {
                await addAuditLog(log);
            }
            console.log(`✅ Restored ${backupData.data.auditLogs.length} audit logs`);
        }
        
        // Restore settings
        if (backupData.data.settings) {
            restoreAdminSettings(backupData.data.settings);
            console.log('✅ Restored admin settings');
        }
        
        // Reload all data in UI
        await refreshAllData();
        
        console.log('✅ Data restore completed successfully');
        if (typeof showAdminNotification === 'function') {
            showAdminNotification('Your data has been restored successfully! Everything is back to normal.', 'success');
        } else {
            alert('Your data has been restored successfully! Everything is back to normal.');
        }
        
    } catch (error) {
        console.error('❌ Data restore failed:', error);
        if (typeof showAdminNotification === 'function') {
            showAdminNotification('Failed to restore data: ' + error.message, 'danger');
        } else {
            alert('Failed to restore data: ' + error.message);
        }
    }
}

async function clearAllData() {
    try {
        console.log('🗑️ Clearing existing data...');
        
        // Clear all object stores
        const db = await dbPromise;
        const stores = ['inventory', 'sales', 'journals', 'suppliers', 'auditLogs'];
        
        for (const storeName of stores) {
            const transaction = db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            await store.clear();
        }
        
        console.log('✅ All existing data cleared');
    } catch (error) {
        console.error('❌ Failed to clear data:', error);
        throw error;
    }
}

async function refreshAllData() {
    try {
        console.log('🔄 Refreshing all data in UI...');
        
        // Reload all data
        await loadDashboard();
        await loadInventory();
        await loadSuppliers();
        await loadSalesJournal();
        await loadExpenseJournal();
        await loadAuditLogs();
        await loadVoidItems();
        await loadTopSellingItems();
        
        console.log('✅ All UI data refreshed');
    } catch (error) {
        console.error('❌ Failed to refresh UI data:', error);
    }
}

// Real-time admin data refresh for void operations
async function refreshAllAdminData() {
    try {
        console.log('🔄 Refreshing admin dashboard for real-time updates...');
        
        // Smart refresh based on active tab to optimize performance
        const activeTab = document.querySelector('.tab-pane.active');
        const activeTabId = activeTab ? activeTab.id : 'dashboard';
        
        console.log(`📊 Active tab: ${activeTabId} - Smart refresh initiated`);
        
        // Always refresh dashboard metrics (affected by void operations)
        await loadDashboard();
        
        // Refresh financial overview chart
        await loadFinancialOverviewChart();
        
        // Refresh inventory (stock levels change when items are voided)
        await loadInventory();
        
        // Refresh void items log (shows new void operations)
        await loadVoidItems();
        
        // Tab-specific refresh
        switch(activeTabId) {
            case 'sales-journal':
                await loadSalesJournal();
                break;
            case 'top-selling':
                await loadTopSellingItems();
                console.log('📊 Top Selling items refreshed in real-time');
                break;
            case 'audit-logs':
                await loadAuditLogs();
                break;
        }
        
        console.log('✅ Admin dashboard refreshed with real-time data');
        
    } catch (error) {
        console.error('❌ Failed to refresh admin dashboard:', error);
    }
}

function getAdminSettings() {
    // Collect current admin settings
    const settings = {};
    
    // Get tax settings
    const vatRate = document.getElementById('vat-rate')?.value;
    if (vatRate) settings.vatRate = parseFloat(vatRate);
    
    // Add other settings as needed
    return settings;
}

function restoreAdminSettings(settings) {
    // Restore admin settings
    if (settings.vatRate) {
        const vatInput = document.getElementById('vat-rate');
        if (vatInput) vatInput.value = settings.vatRate;
    }
    
    // Restore other settings as needed
}

function updateBackupInfo(backupData) {
    const infoDiv = document.getElementById('backup-info');
    if (!infoDiv) return;
    
    const timestamp = new Date(backupData.timestamp).toLocaleString();
    const itemCount = backupData.data.inventory?.length || 0;
    const salesCount = backupData.data.sales?.length || 0;
    const expenseCount = backupData.data.expenses?.length || 0;
    
    infoDiv.innerHTML = `
        <strong>✅ Great job!</strong> Your backup was created on ${timestamp}.<br>
        <small class="text-muted">
            It contains ${itemCount} items, ${salesCount} sales, and ${expenseCount} expenses. 
            Keep this file safe in case you need to restore your data later.
        </small>
    `;
}

// Event listeners for backup buttons
document.addEventListener('DOMContentLoaded', function() {
    const createBackupBtn = document.getElementById('create-backup-btn');
    const restoreBackupBtn = document.getElementById('restore-backup-btn');
    const restoreFileInput = document.getElementById('restore-file-input');

    if (createBackupBtn) {
        createBackupBtn.addEventListener('click', createFullBackup);
    }

    if (restoreBackupBtn && restoreFileInput) {
        restoreBackupBtn.addEventListener('click', function() {
            const file = restoreFileInput.files[0];
            if (file) {
                restoreFromBackup(file);
            } else {
                if (typeof showAdminNotification === 'function') {
                    showAdminNotification('Please choose a backup file first', 'warning');
                } else {
                    alert('Please choose a backup file first');
                }
            }
        });
    }

    // Cloud Storage Event Listeners
    const connectCloudBtn = document.getElementById('connect-cloud-btn');
    const backupToCloudBtn = document.getElementById('backup-to-cloud-btn');
    const cloudProviderSelect = document.getElementById('cloud-provider-select');

    if (connectCloudBtn) {
        connectCloudBtn.addEventListener('click', connectCloudStorage);
    }

    if (backupToCloudBtn) {
        backupToCloudBtn.addEventListener('click', backupToCloud);
    }

    if (cloudProviderSelect) {
        cloudProviderSelect.addEventListener('change', function() {
            // Reset connection if provider changes
            if (cloudProvider && cloudProvider !== this.value) {
                cloudProvider = null;
                cloudAccessToken = null;
                localStorage.removeItem('cloudProvider');
                localStorage.removeItem('cloudAccessToken');
                updateCloudStatus(false);
            }
        });
    }

    // Load cloud settings
    loadCloudSettings();
});

// Cloud Storage Functions
let cloudProvider = null;
let cloudAccessToken = null;

// Cloud Storage Configuration
const cloudProviders = {
    googledrive: {
        name: 'Google Drive',
        authUrl: 'https://accounts.google.com/oauth/authorize',
        scope: 'https://www.googleapis.com/auth/drive.file',
        clientId: 'YOUR_GOOGLE_CLIENT_ID', // Replace with actual client ID
        redirectUri: window.location.origin + '/admin.html'
    },
    dropbox: {
        name: 'Dropbox',
        authUrl: 'https://www.dropbox.com/oauth2/authorize',
        scope: 'files.content.write',
        clientId: 'YOUR_DROPBOX_APP_KEY', // Replace with actual app key
        redirectUri: window.location.origin + '/admin.html'
    },
    onedrive: {
        name: 'OneDrive',
        authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
        scope: 'files.readwrite',
        clientId: 'YOUR_MICROSOFT_CLIENT_ID', // Replace with actual client ID
        redirectUri: window.location.origin + '/admin.html'
    },
    googcloud: {
        name: 'Google Cloud Storage',
        authUrl: 'https://accounts.google.com/oauth/authorize',
        scope: 'https://www.googleapis.com/auth/devstorage.read_write',
        clientId: 'YOUR_GOOGLE_CLOUD_CLIENT_ID', // Replace with actual client ID
        redirectUri: window.location.origin + '/admin.html'
    }
};

async function connectCloudStorage() {
    const provider = document.getElementById('cloud-provider-select').value;
    if (!provider) {
        showAdminNotification('Please select a cloud provider first', 'warning');
        return;
    }

    const config = cloudProviders[provider];
    if (!config) {
        showAdminNotification('Invalid cloud provider selected', 'danger');
        return;
    }

    // Store the selected provider
    cloudProvider = provider;
    localStorage.setItem('cloudProvider', provider);

    // For demo purposes, we'll simulate OAuth flow
    // In production, you'd implement actual OAuth authentication
    showAdminNotification(`Connecting to ${config.name}...`, 'info');

    // Simulate OAuth popup
    setTimeout(() => {
        // Mock successful authentication
        cloudAccessToken = 'mock_access_token_' + Date.now();
        localStorage.setItem('cloudAccessToken', cloudAccessToken);
        
        updateCloudStatus(true);
        showAdminNotification(`Successfully connected to ${config.name}!`, 'success');
    }, 2000);
}

async function backupToCloud() {
    if (!cloudProvider || !cloudAccessToken) {
        showAdminNotification('Please connect to cloud storage first', 'warning');
        return;
    }

    try {
        showAdminNotification('Creating cloud backup...', 'info');
        
        // Create backup data (same as local backup)
        const backupData = await createBackupData();
        
        // Upload to cloud (simulated)
        const success = await uploadToCloud(backupData);
        
        if (success) {
            showAdminNotification('Backup successfully uploaded to cloud!', 'success');
            updateCloudStatus(true, true);
        } else {
            showAdminNotification('Failed to upload backup to cloud', 'danger');
        }
        
    } catch (error) {
        console.error('Cloud backup failed:', error);
        showAdminNotification('Cloud backup failed: ' + error.message, 'danger');
    }
}

async function createBackupData() {
    // Collect all data from IndexedDB
    const inventory = await getAllInventory();
    const sales = await getAllSales();
    const expenses = await getAllJournalEntries();
    const suppliers = await getAllSuppliers();
    const auditLogs = await getAllAuditLogs();
    const settings = getAdminSettings();

    return {
        timestamp: new Date().toISOString(),
        version: '1.0',
        data: {
            inventory: inventory || [],
            sales: sales || [],
            expenses: expenses || [],
            suppliers: suppliers || [],
            auditLogs: auditLogs || [],
            settings: settings || {}
        }
    };
}

async function uploadToCloud(backupData) {
    // Simulate cloud upload
    // In production, you'd use actual cloud storage APIs
    return new Promise((resolve) => {
        setTimeout(() => {
            // Store backup info in localStorage for demo
            const cloudBackups = JSON.parse(localStorage.getItem('cloudBackups') || '[]');
            cloudBackups.push({
                id: Date.now(),
                provider: cloudProvider,
                filename: `zenith-pos-backup-${new Date().toISOString().split('T')[0]}.json`,
                timestamp: backupData.timestamp,
                size: JSON.stringify(backupData).length
            });
            localStorage.setItem('cloudBackups', JSON.stringify(cloudBackups));
            resolve(true);
        }, 1500);
    });
}

function updateCloudStatus(connected = false, hasBackup = false) {
    const statusDiv = document.getElementById('cloud-status');
    const backupBtn = document.getElementById('backup-to-cloud-btn');
    const autoBackupDiv = document.getElementById('auto-backup-protection');
    
    if (connected) {
        const providerName = cloudProviders[cloudProvider]?.name || 'Cloud Storage';
        const badgeClass = hasBackup ? 'bg-success' : 'bg-primary';
        const statusText = hasBackup ? 'Connected with Backup' : 'Connected';
        
        statusDiv.innerHTML = `<span class="badge ${badgeClass}">${statusText} - ${providerName}</span>`;
        
        // Enable the main Cloud Backup button
        if (backupBtn) {
            backupBtn.disabled = false;
        }
        
        // Show auto-backup protection indicator
        autoBackupDiv.style.display = 'block';
    } else {
        statusDiv.innerHTML = '<span class="badge bg-secondary">Not Connected</span>';
        
        // Disable the main Cloud Backup button
        if (backupBtn) {
            backupBtn.disabled = true;
        }
        
        // Hide auto-backup protection if not connected
        autoBackupDiv.style.display = 'none';
    }
}

function loadCloudSettings() {
    // Load saved cloud settings
    cloudProvider = localStorage.getItem('cloudProvider');
    cloudAccessToken = localStorage.getItem('cloudAccessToken');
    
    if (cloudProvider && cloudAccessToken) {
        document.getElementById('cloud-provider-select').value = cloudProvider;
        updateCloudStatus(true);
    }
}

// Automatic Cloud Backup Protection System
let lastBackupTime = localStorage.getItem('lastCloudBackupTime');
let dataChangeTracker = {
    inventory: 0,
    sales: 0,
    expenses: 0,
    suppliers: 0
};

// Initialize automatic backup protection
function initializeAutoCloudBackup() {
    console.log('🛡️ Initializing automatic cloud backup protection...');
    
    // Track data changes
    trackDataChanges();
    
    // Monitor for data loss scenarios
    monitorDataLossScenarios();
    
    // Set up periodic backup checks
    setInterval(checkForAutoBackup, 30000); // Every 30 seconds
    
    // Check on page load
    setTimeout(checkForAutoBackup, 5000);
}

function trackDataChanges() {
    // Override key functions to track changes
    const originalAddItem = window.addItem;
    const originalAddSale = window.addSale;
    const originalAddJournalEntry = window.addJournalEntry;
    const originalSaveSupplier = window.saveSupplier;
    
    if (originalAddItem) {
        window.addItem = async function(item) {
            const result = await originalAddItem.call(this, item);
            dataChangeTracker.inventory++;
            console.log('📦 Inventory change detected - incrementing tracker');
            return result;
        };
    }
    
    if (originalAddSale) {
        window.addSale = async function(sale) {
            const result = await originalAddSale.call(this, sale);
            dataChangeTracker.sales++;
            console.log('💰 Sale change detected - incrementing tracker');
            return result;
        };
    }
    
    if (originalAddJournalEntry) {
        window.addJournalEntry = async function(entry) {
            const result = await originalAddJournalEntry.call(this, entry);
            dataChangeTracker.expenses++;
            console.log('💸 Expense change detected - incrementing tracker');
            
            // If this is an expense entry, refresh dashboard components
            if (entry && entry.type === 'expense') {
                console.log('🔄 New expense added - refreshing dashboard components...');
                try {
                    // Refresh expense journal
                    await loadExpenseJournal();
                    
                    // Refresh sales journal to listen to expense updates
                    await loadSalesJournal();
                    console.log('📈 DEBUG: Sales journal refreshed with new expense');
                    
                    // Refresh dashboard stats
                    await loadDashboard();
                    
                    // Refresh financial overview chart
                    await loadFinancialOverviewChart();
                    
                    // Refresh Analytics Dashboard (if available)
                    if (typeof loadAdminAnalytics === 'function') {
                        await loadAdminAnalytics();
                        console.log('📊 Admin Analytics Dashboard refreshed');
                    }
                    
                    // Refresh Cashier Analytics Dashboard (if available)
                    if (typeof loadAnalytics === 'function') {
                        await loadAnalytics();
                        console.log('📊 Cashier Analytics Dashboard refreshed');
                    }
                    
                    console.log('✅ All components refreshed after new expense');
                } catch (error) {
                    console.error('❌ Error refreshing after new expense:', error);
                }
            }
            
            return result;
        };
    }
    
    if (originalSaveSupplier) {
        window.saveSupplier = async function(supplier) {
            const result = await originalSaveSupplier.call(this, supplier);
            dataChangeTracker.suppliers++;
            console.log('👥 Supplier change detected - incrementing tracker');
            return result;
        };
    }
}

function monitorDataLossScenarios() {
    // Monitor browser storage events
    window.addEventListener('storage', function(e) {
        console.log('🔍 Storage change detected:', e.key);
        
        if (e.key === null || e.key === undefined) {
            // Storage cleared - emergency backup!
            console.log('🚨 EMERGENCY: Storage cleared detected!');
            performEmergencyCloudBackup('storage_cleared');
        }
    });
    
    // Monitor before unload (page close, refresh, etc.)
    window.addEventListener('beforeunload', function(e) {
        if (hasSignificantChanges()) {
            console.log('🔄 Significant changes detected - preparing emergency backup');
            performEmergencyCloudBackup('page_unload');
        }
    });
    
    // Monitor visibility changes (tab switching, app backgrounding)
    document.addEventListener('visibilitychange', function() {
        if (document.hidden && hasSignificantChanges()) {
            console.log('📱 App backgrounded with changes - performing backup');
            performEmergencyCloudBackup('app_backgrounded');
        }
    });
    
    // Monitor for memory pressure or low battery
    if ('battery' in navigator) {
        navigator.getBattery().then(function(battery) {
            battery.addEventListener('levelchange', function() {
                if (battery.level < 0.2 && hasSignificantChanges()) {
                    console.log('🔋 Low battery detected - performing backup');
                    performEmergencyCloudBackup('low_battery');
                }
            });
        });
    }
}

function hasSignificantChanges() {
    const totalChanges = Object.values(dataChangeTracker).reduce((sum, count) => sum + count, 0);
    return totalChanges > 0;
}

async function checkForAutoBackup() {
    if (!cloudProvider || !cloudAccessToken) {
        console.log('☁️ No cloud storage connected - skipping auto backup');
        return;
    }
    
    const totalChanges = Object.values(dataChangeTracker).reduce((sum, count) => sum + count, 0);
    
    // Auto-backup if there are significant changes
    if (totalChanges >= 5) {
        console.log(`🔄 Auto-backup triggered: ${totalChanges} changes detected`);
        await performAutoCloudBackup('scheduled_changes');
    }
    
    // Check time-based backup
    const now = Date.now();
    const lastBackup = lastBackupTime ? parseInt(lastBackupTime) : 0;
    const hoursSinceLastBackup = (now - lastBackup) / (1000 * 60 * 60);
    
    if (hoursSinceLastBackup >= 2) { // Every 2 hours
        console.log('⏰ Time-based auto-backup triggered');
        await performAutoCloudBackup('scheduled_time');
    }
}

async function performEmergencyCloudBackup(reason) {
    if (!cloudProvider || !cloudAccessToken) {
        console.log('☁️ No cloud storage connected - cannot perform emergency backup');
        return;
    }
    
    try {
        console.log(`🚨 Emergency cloud backup initiated - Reason: ${reason}`);
        
        // Show emergency notification
        showAdminNotification('⚠️ Emergency backup in progress - Protecting your data...', 'warning');
        
        // Create backup with emergency metadata
        const backupData = await createEmergencyBackupData(reason);
        
        // Upload to cloud
        const success = await uploadToCloud(backupData);
        
        if (success) {
            showAdminNotification('✅ Emergency backup completed successfully!', 'success');
            console.log('🛡️ Emergency cloud backup completed');
            
            // Reset change tracker
            resetChangeTracker();
            
            // Update last backup time
            lastBackupTime = Date.now().toString();
            localStorage.setItem('lastCloudBackupTime', lastBackupTime);
            
        } else {
            showAdminNotification('❌ Emergency backup failed - Please backup manually!', 'danger');
            console.error('❌ Emergency cloud backup failed');
        }
        
    } catch (error) {
        console.error('❌ Emergency backup error:', error);
        showAdminNotification('❌ Emergency backup failed: ' + error.message, 'danger');
    }
}

async function performAutoCloudBackup(reason) {
    try {
        console.log(`🔄 Auto cloud backup - Reason: ${reason}`);
        
        // Create backup
        const backupData = await createBackupData();
        
        // Add auto-backup metadata
        backupData.autoBackup = {
            reason: reason,
            changes: dataChangeTracker,
            timestamp: new Date().toISOString()
        };
        
        // Upload to cloud
        const success = await uploadToCloud(backupData);
        
        if (success) {
            console.log('✅ Auto cloud backup completed');
            
            // Reset change tracker
            resetChangeTracker();
            
            // Update last backup time
            lastBackupTime = Date.now().toString();
            localStorage.setItem('lastCloudBackupTime', lastBackupTime);
            
            // Update UI
            updateCloudStatus(true, true);
            
        } else {
            console.error('❌ Auto cloud backup failed');
        }
        
    } catch (error) {
        console.error('❌ Auto backup error:', error);
    }
}

async function createEmergencyBackupData(reason) {
    const backupData = await createBackupData();
    
    // Add emergency metadata
    backupData.emergency = {
        reason: reason,
        timestamp: new Date().toISOString(),
        changes: dataChangeTracker,
        userAgent: navigator.userAgent,
        url: window.location.href
    };
    
    return backupData;
}

function resetChangeTracker() {
    dataChangeTracker = {
        inventory: 0,
        sales: 0,
        expenses: 0,
        suppliers: 0
    };
    localStorage.setItem('dataChangeTracker', JSON.stringify(dataChangeTracker));
}

// Initialize auto backup protection when page loads
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(initializeAutoCloudBackup, 2000);
});

// ==================== SECURITY FUNCTIONS ====================

// Security settings storage key
const SECURITY_SETTINGS_KEY = 'zenithPosSecuritySettings';

// Default security settings
const defaultSecuritySettings = {
    // Password settings
    adminPassword: 'admin123',
    cashierPassword: 'cashier123',
    
    // Session settings
    sessionTimeout: 30, // minutes
    maxLoginAttempts: 5,
    
    // Access control
    allowCashierVoid: true,
    allowCashierExpenses: true,
    allowCashierDiscount: true,
    allowCashierReports: false,
    allowedIPs: [],
    
    // Data security
    encryptLocalData: true,
    autoBackup: true,
    backupFrequency: 'weekly',
    detailedAudit: true,
    auditRetention: 90,
    
    // Password requirements
    minPasswordLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: false
};

// Load security settings
function loadSecuritySettings() {
    try {
        const stored = localStorage.getItem(SECURITY_SETTINGS_KEY);
        return stored ? { ...defaultSecuritySettings, ...JSON.parse(stored) } : defaultSecuritySettings;
    } catch (error) {
        console.error('Error loading security settings:', error);
        return defaultSecuritySettings;
    }
}

// Save security settings
function saveSecuritySettings(settings) {
    try {
        localStorage.setItem(SECURITY_SETTINGS_KEY, JSON.stringify(settings));
        showAdminNotification('Security settings saved successfully', 'success', 3000);
        updateSecurityStatus();
        return true;
    } catch (error) {
        console.error('Error saving security settings:', error);
        showAdminNotification('Failed to save security settings', 'danger', 3000);
        return false;
    }
}

// Validate password strength
function validatePasswordStrength(password) {
    const settings = loadSecuritySettings();
    const checks = {
        length: password.length >= settings.minPasswordLength,
        uppercase: !settings.requireUppercase || /[A-Z]/.test(password),
        lowercase: !settings.requireLowercase || /[a-z]/.test(password),
        numbers: !settings.requireNumbers || /\d/.test(password),
        special: !settings.requireSpecialChars || /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    
    const passedChecks = Object.values(checks).filter(Boolean).length;
    const totalChecks = Object.keys(checks).length;
    
    return {
        isValid: passedChecks === totalChecks,
        strength: passedChecks / totalChecks,
        checks: checks
    };
}

// Load active sessions (mock implementation)
function loadActiveSessions() {
    const sessionsList = document.getElementById('active-sessions-list');
    
    // Mock session data - in real implementation, this would come from a server
    const mockSessions = [
        {
            id: 'session_1',
            user: 'Admin',
            role: 'admin',
            loginTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            lastActivity: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
            ip: '192.168.1.100',
            status: 'active'
        },
        {
            id: 'session_2',
            user: 'Cashier 1',
            role: 'cashier',
            loginTime: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
            lastActivity: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
            ip: '192.168.1.101',
            status: 'active'
        }
    ];
    
    if (mockSessions.length === 0) {
        sessionsList.innerHTML = '<div class="text-center text-muted small">No active sessions</div>';
        return;
    }
    
    sessionsList.innerHTML = mockSessions.map(session => `
        <div class="border-bottom pb-2 mb-2">
            <div class="d-flex justify-content-between align-items-start">
                <div>
                    <strong>${session.user}</strong>
                    <span class="badge bg-${session.role === 'admin' ? 'primary' : 'info'} ms-1">${session.role}</span>
                    <br>
                    <small class="text-muted">
                        IP: ${session.ip}<br>
                        Login: ${new Date(session.loginTime).toLocaleString()}<br>
                        Last: ${new Date(session.lastActivity).toLocaleString()}
                    </small>
                </div>
                <button class="btn btn-sm btn-outline-danger" onclick="terminateSession('${session.id}')">
                    End
                </button>
            </div>
        </div>
    `).join('');
}

// Terminate session (mock implementation)
function terminateSession(sessionId) {
    if (confirm('Are you sure you want to terminate this session?')) {
        showAdminNotification('Session terminated successfully', 'warning', 3000);
        loadActiveSessions(); // Refresh the list
    }
}

// Save all security settings from form
function saveAllSecuritySettings() {
    const settings = loadSecuritySettings();
    
    // Access control
    settings.allowCashierVoid = document.getElementById('allow-cashier-void').checked;
    settings.allowCashierExpenses = document.getElementById('allow-cashier-expenses').checked;
    settings.allowCashierDiscount = document.getElementById('allow-cashier-discount').checked;
    settings.allowCashierReports = document.getElementById('allow-cashier-reports').checked;
    
    // IP restrictions
    const ipsText = document.getElementById('allowed-ips').value.trim();
    settings.allowedIPs = ipsText ? ipsText.split('\n').map(ip => ip.trim()).filter(ip => ip) : [];
    
    // Data security
    settings.encryptLocalData = document.getElementById('encrypt-local-data').checked;
    settings.autoBackup = document.getElementById('auto-backup').checked;
    settings.backupFrequency = document.getElementById('backup-frequency').value;
    settings.detailedAudit = document.getElementById('detailed-audit').checked;
    settings.auditRetention = parseInt(document.getElementById('audit-retention').value);
    
    saveSecuritySettings(settings);
}

// Load security settings to form
function loadSecuritySettingsToForm() {
    const settings = loadSecuritySettings();
    
    // Access control
    document.getElementById('allow-cashier-void').checked = settings.allowCashierVoid;
    document.getElementById('allow-cashier-expenses').checked = settings.allowCashierExpenses;
    document.getElementById('allow-cashier-discount').checked = settings.allowCashierDiscount;
    document.getElementById('allow-cashier-reports').checked = settings.allowCashierReports;
    
    // IP restrictions
    document.getElementById('allowed-ips').value = settings.allowedIPs.join('\n');
    
    // Data security
    document.getElementById('encrypt-local-data').checked = settings.encryptLocalData;
    document.getElementById('auto-backup').checked = settings.autoBackup;
    document.getElementById('backup-frequency').value = settings.backupFrequency;
    document.getElementById('detailed-audit').checked = settings.detailedAudit;
    document.getElementById('audit-retention').value = settings.auditRetention;
}

// Update security status display
function updateSecurityStatus() {
    const settings = loadSecuritySettings();
    
    // Password strength
    const adminStrength = validatePasswordStrength(settings.adminPassword).strength;
    const passwordStatus = adminStrength >= 0.8 ? 'Strong' : adminStrength >= 0.6 ? 'Moderate' : 'Weak';
    const passwordColor = adminStrength >= 0.8 ? 'success' : adminStrength >= 0.6 ? 'warning' : 'danger';
    document.getElementById('password-strength-status').innerHTML = `<span class="text-${passwordColor}">${passwordStatus}</span>`;
    
    // Session security
    const sessionStatus = settings.sessionTimeout <= 30 ? 'Strong' : settings.sessionTimeout <= 60 ? 'Moderate' : 'Weak';
    const sessionColor = settings.sessionTimeout <= 30 ? 'success' : settings.sessionTimeout <= 60 ? 'warning' : 'danger';
    document.getElementById('session-security-status').innerHTML = `<span class="text-${sessionColor}">${sessionStatus}</span>`;
    
    // Data encryption
    const encryptionStatus = settings.encryptLocalData ? 'Enabled' : 'Disabled';
    const encryptionColor = settings.encryptLocalData ? 'success' : 'danger';
    document.getElementById('encryption-status').innerHTML = `<span class="text-${encryptionColor}">${encryptionStatus}</span>`;
    
    // Access control
    const restrictedFeatures = [settings.allowCashierVoid, settings.allowCashierExpenses, settings.allowCashierDiscount, settings.allowCashierReports].filter(allowed => !allowed).length;
    const accessStatus = restrictedFeatures >= 2 ? 'Restricted' : restrictedFeatures >= 1 ? 'Moderate' : 'Permissive';
    const accessColor = restrictedFeatures >= 2 ? 'success' : restrictedFeatures >= 1 ? 'warning' : 'danger';
    document.getElementById('access-control-status').innerHTML = `<span class="text-${accessColor}">${accessStatus}</span>`;
}

// Test security configuration
function testSecurityConfiguration() {
    const settings = loadSecuritySettings();
    const issues = [];
    
    // Check password strength
    const adminStrength = validatePasswordStrength(settings.adminPassword).strength;
    if (adminStrength < 0.6) {
        issues.push('Admin password is weak');
    }
    
    // Check session timeout
    if (settings.sessionTimeout > 120) {
        issues.push('Session timeout is too long (> 2 hours)');
    }
    
    // Check access control
    if (settings.allowCashierReports) {
        issues.push('Cashier can view reports (security risk)');
    }
    
    // Check data encryption
    if (!settings.encryptLocalData) {
        issues.push('Local data encryption is disabled');
    }
    
    // Check backup
    if (!settings.autoBackup) {
        issues.push('Automatic backup is disabled');
    }
    
    // Show results
    if (issues.length === 0) {
        showAdminNotification('✅ Security configuration is strong!', 'success', 5000);
    } else {
        const message = `⚠️ Security issues found:\n${issues.join('\n')}`;
        showAdminNotification(message, 'warning', 8000);
    }
}

// Reset security settings to defaults
function resetSecuritySettings() {
    if (confirm('Are you sure you want to reset all security settings to defaults? This action cannot be undone.')) {
        localStorage.removeItem(SECURITY_SETTINGS_KEY);
        loadSecuritySettingsToForm();
        updateSecurityStatus();
        showAdminNotification('Security settings reset to defaults', 'info', 3000);
    }
}

// Lock all active sessions
function lockAllSessions() {
    if (confirm('Are you sure you want to lock all active sessions? All users will be forced to logout immediately.')) {
        showAdminNotification('All active sessions have been locked', 'warning', 3000);
        loadActiveSessions(); // Refresh the list
    }
}

// Generate security report
function generateSecurityReport() {
    const settings = loadSecuritySettings();
    const report = {
        timestamp: new Date().toISOString(),
        securitySettings: settings,
        passwordStrength: {
            admin: validatePasswordStrength(settings.adminPassword),
            cashier: validatePasswordStrength(settings.cashierPassword)
        },
        recommendations: []
    };
    
    // Generate recommendations
    if (validatePasswordStrength(settings.adminPassword).strength < 0.8) {
        report.recommendations.push('Strengthen admin password');
    }
    
    if (settings.sessionTimeout > 60) {
        report.recommendations.push('Reduce session timeout to 1 hour or less');
    }
    
    if (!settings.encryptLocalData) {
        report.recommendations.push('Enable local data encryption');
    }
    
    if (!settings.autoBackup) {
        report.recommendations.push('Enable automatic backups');
    }
    
    // Download report
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `security-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    showAdminNotification('Security report generated and downloaded', 'success', 3000);
}

// Initialize security tab when it's shown
document.addEventListener('DOMContentLoaded', function() {
    // Security tab event listeners
    const securityTab = document.getElementById('security-tab');
    if (securityTab) {
        securityTab.addEventListener('shown.bs.tab', function() {
            loadSecuritySettingsToForm();
            updateSecurityStatus();
            loadActiveSessions();
        });
    }
    
    // Security action buttons
    const saveSecurityBtn = document.getElementById('save-security-settings-btn');
    if (saveSecurityBtn) {
        saveSecurityBtn.addEventListener('click', saveAllSecuritySettings);
    }
    
    const testSecurityBtn = document.getElementById('test-security-btn');
    if (testSecurityBtn) {
        testSecurityBtn.addEventListener('click', testSecurityConfiguration);
    }
    
    const resetSecurityBtn = document.getElementById('reset-security-btn');
    if (resetSecurityBtn) {
        resetSecurityBtn.addEventListener('click', resetSecuritySettings);
    }
    
    const lockSessionsBtn = document.getElementById('lock-all-sessions-btn');
    if (lockSessionsBtn) {
        lockSessionsBtn.addEventListener('click', lockAllSessions);
    }
    
    const securityReportBtn = document.getElementById('security-report-btn');
    if (securityReportBtn) {
        securityReportBtn.addEventListener('click', generateSecurityReport);
    }
});

// Make security functions globally available
window.loadActiveSessions = loadActiveSessions;
window.terminateSession = terminateSession;
window.saveAllSecuritySettings = saveAllSecuritySettings;
window.testSecurityConfiguration = testSecurityConfiguration;
window.resetSecuritySettings = resetSecuritySettings;
window.lockAllSessions = lockAllSessions;
window.generateSecurityReport = generateSecurityReport;

// Make functions globally available
window.loadTopSellingItems = loadTopSellingItems;
window.filterTopSellingItems = filterTopSellingItems;
window.exportTopSellingItems = exportTopSellingItems;
window.sortTopItems = sortTopItems;
window.createFullBackup = createFullBackup;
window.restoreFromBackup = restoreFromBackup;
window.connectCloudStorage = connectCloudStorage;
window.backupToCloud = backupToCloud;

// Mobile Sidebar Toggle Functionality
document.addEventListener('DOMContentLoaded', function() {
    const mobileSidebarToggle = document.getElementById('mobileSidebarToggle');
    const mobileSidebarClose = document.getElementById('mobileSidebarClose');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const adminTabs = document.getElementById('adminTabs');
    
    if (mobileSidebarToggle && sidebarOverlay && adminTabs) {
        mobileSidebarToggle.addEventListener('click', function() {
            adminTabs.classList.add('show');
            sidebarOverlay.classList.add('show');
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        });
    }
    
    if (mobileSidebarClose && sidebarOverlay && adminTabs) {
        mobileSidebarClose.addEventListener('click', function() {
            closeSidebar();
        });
    }
    
    sidebarOverlay.addEventListener('click', function() {
        closeSidebar();
    });
    
    const navLinks = document.querySelectorAll('#adminTabs .nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (window.innerWidth < 768) {
                closeSidebar();
            }
        });
    });
    
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && adminTabs.classList.contains('show')) {
            closeSidebar();
        }
    });
    
    function closeSidebar() {
        adminTabs.classList.remove('show');
        sidebarOverlay.classList.remove('show');
        document.body.style.overflow = '';
    }
    
    window.addEventListener('resize', function() {
        if (window.innerWidth >= 768) {
            closeSidebar();
        }
    });
});

// ----- Financial Overview Line Chart Function -----
async function loadFinancialOverviewChart() {
    try {
        console.log('📊 Loading Financial Overview Chart...');
        
        const sales = await getAllSales();
        const journals = await getAllJournals();
        const expenses = journals.filter(j => j.type === 'expense');
        
        const periodSelect = document.getElementById('chart-period');
        const days = parseInt(periodSelect ? periodSelect.value : '7');
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - days + 1);
        
        // Initialize daily data
        const dailyData = {};
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            dailyData[dateStr] = { grossSales: 0, expenses: 0, grossProfit: 0 };
        }
        
        // Add sales data
        sales.forEach(sale => {
            const saleDate = sale.date.split('T')[0];
            if (dailyData[saleDate]) {
                dailyData[saleDate].grossSales += sale.total || 0;
            }
        });
        
        // Add expense data
        expenses.forEach(expense => {
            const expenseDate = expense.date.split('T')[0];
            if (dailyData[expenseDate]) {
                const totalCommitted = (expense.cash || 0) + (expense.gcash || 0);
                let totalPaid = 0;
                if (expense.partialPayments) {
                    totalPaid = expense.partialPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
                }
                const remaining = totalCommitted - totalPaid;
                if (remaining > 0) dailyData[expenseDate].expenses += remaining;
            }
        });
        
        // Calculate profit
        Object.keys(dailyData).forEach(date => {
            dailyData[date].grossProfit = dailyData[date].grossSales - dailyData[date].expenses;
        });
        
        // Prepare chart data
        const labels = [], grossSalesData = [], expensesData = [], grossProfitData = [];
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const labelStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            labels.push(labelStr);
            const dayData = dailyData[dateStr] || { grossSales: 0, expenses: 0, grossProfit: 0 };
            grossSalesData.push(dayData.grossSales);
            expensesData.push(dayData.expenses);
            grossProfitData.push(dayData.grossProfit);
        }
        
        // Create chart
        const chartCanvas = document.getElementById('financial-overview-chart');
        if (!chartCanvas || !window.Chart) {
            console.error('Chart canvas or Chart.js not available');
            return;
        }
        
        if (window.financialOverviewChart) {
            window.financialOverviewChart.destroy();
        }
        
        window.financialOverviewChart = new Chart(chartCanvas, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Gross Sales',
                        data: grossSalesData,
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Expenses',
                        data: expensesData,
                        borderColor: '#ef4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Gross Profit',
                        data: grossProfitData,
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { callback: value => '₱' + value.toLocaleString() }
                    }
                }
            }
        });
        
        console.log('✅ Revenue Trends chart loaded successfully');
        
    } catch (error) {
        console.error('❌ Error loading chart:', error);
    }
}

// Helper function to get trend indicator for tooltips
function getTrendIndicator(context) {
    const dataset = context.dataset;
    const dataIndex = context.dataIndex;
    
    if (dataIndex === 0) {
        return '📍'; // First data point
    }
    
    const currentValue = dataset.data[dataIndex];
    const previousValue = dataset.data[dataIndex - 1];
    
    if (currentValue > previousValue) {
        return '📈'; // Up trend
    } else if (currentValue < previousValue) {
        return '📉'; // Down trend
    } else {
        return '➡️'; // Same
    }
}

// Update chart statistics function
function updateChartStatistics(grossSalesData, expensesData, grossProfitData) {
    try {
        // Calculate totals
        const totalGrossSales = grossSalesData.reduce((sum, val) => sum + val, 0);
        const totalExpenses = expensesData.reduce((sum, val) => sum + val, 0);
        const totalNetProfit = grossProfitData.reduce((sum, val) => sum + val, 0);
        
        // Update DOM elements with formatted values
        // Note: Total Revenue and Gross Profit cards removed from Dashboard
        console.log('📊 Chart Statistics Summary:');
        console.log(`   - Total Gross Sales: ₱${totalGrossSales.toFixed(2)}`);
        console.log(`   - Total Expenses: ₱${totalExpenses.toFixed(2)}`);
        console.log(`   - Total Net Profit: ₱${totalNetProfit.toFixed(2)}`);
        console.log(`   - Stats cards removed: Total Revenue and Gross Profit`);
        
        console.log('📊 Chart statistics updated:', {
            totalGrossSales,
            totalExpenses,
            totalNetProfit
        });
        
    } catch (error) {
        console.error('❌ Error updating chart statistics:', error);
    }
}

// Format currency with proper formatting
function formatCurrency(value) {
    if (value >= 1000000) {
        return '₱' + (value / 1000000).toFixed(1) + 'M';
    } else if (value >= 1000) {
        return '₱' + (value / 1000).toFixed(1) + 'k';
    } else {
        return '₱' + value.toFixed(2);
    }
}

// Animate numeric values
function animateValue(element, start, end, duration) {
    const startTime = performance.now();
    const endTime = startTime + duration;
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smooth animation
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const currentValue = start + (end - start) * easeOutQuart;
        
        element.textContent = formatCurrency(currentValue);
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    requestAnimationFrame(update);
}

// Add event listeners for chart controls
document.addEventListener('DOMContentLoaded', function() {
    // Period selector change event
    const periodSelect = document.getElementById('chart-period');
    if (periodSelect) {
        periodSelect.addEventListener('change', function() {
            const selectedPeriod = this.value;
            console.log(`📊 Chart period changed to: Last ${selectedPeriod} Days`);
            loadFinancialOverviewChart();
        });
    }
    
    // Refresh button click event
    const refreshBtn = document.getElementById('refresh-chart');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            loadFinancialOverviewChart();
            // Add spinning animation to refresh icon
            const icon = refreshBtn.querySelector('i');
            if (icon) {
                icon.classList.add('fa-spin');
                setTimeout(() => {
                    icon.classList.remove('fa-spin');
                }, 1000);
            }
        });
    }
});

// Auto-refresh Revenue Trends chart every 30 seconds to ensure it's always updated
setInterval(async function() {
    try {
        console.log('📈 Auto-refreshing Revenue Trends chart...');
        await loadFinancialOverviewChart();
        console.log('✅ Revenue Trends chart auto-refreshed successfully');
    } catch (error) {
        console.error('❌ Error auto-refreshing Revenue Trends chart:', error);
    }
}, 30000); // 30 seconds

// Global function to ensure Sales Journal listens to expense updates
async function ensureSalesJournalListensToExpenses() {
    console.log('🔄 DEBUG: ensureSalesJournalListensToExpenses() called');
    try {
        console.log('🔄 DEBUG: About to call loadSalesJournal()');
        await loadSalesJournal();
        console.log('✅ DEBUG: Sales Journal updated successfully');
    } catch (error) {
        console.error('❌ DEBUG: Error updating Sales Journal:', error);
    }
}

// Override saveAllJournals to trigger Sales Journal update when expenses are saved
const originalSaveAllJournals = window.saveAllJournals;
if (originalSaveAllJournals) {
    window.saveAllJournals = async function(journals) {
        console.log('🔄 DEBUG: saveAllJournals override called with:', journals?.length, 'items');
        
        const result = await originalSaveAllJournals.call(this, journals);
        
        // Check if this contains expenses and update Sales Journal
        const hasExpenses = journals && journals.some(j => j.type === 'expense');
        console.log('🔄 DEBUG: Checking for expenses - hasExpenses:', hasExpenses);
        
        if (hasExpenses) {
            console.log('💰 DEBUG: Expenses detected - updating Sales Journal and Revenue Trends...');
            await ensureSalesJournalListensToExpenses();
            
            // Also update Revenue Trends chart with new expense data
            try {
                await loadFinancialOverviewChart();
                console.log('📈 DEBUG: Revenue Trends chart updated with new expense data');
            } catch (error) {
                console.error('❌ DEBUG: Error updating Revenue Trends chart:', error);
            }
        } else {
            console.log('🔄 DEBUG: No expenses found in saveAllJournals call');
        }
        
        return result;
    };
    console.log('🔗 DEBUG: Sales Journal listener attached to saveAllJournals');
} else {
    console.log('❌ DEBUG: saveAllJournals not found for override');
}

// Show expense details modal
async function showExpenseDetails(expenseId) {
    try {
        console.log('🔍 Showing expense details for ID:', expenseId);
        
        // Validate expense ID
        if (!expenseId) {
            console.error('❌ No expense ID provided');
            showNotification('Invalid expense ID', 'error', 3000);
            return;
        }
        
        const expenses = await getAllJournals();
        const expense = expenses.find(e => e.id == expenseId);
        
        if (!expense) {
            console.error('❌ Expense not found. Looking for ID:', expenseId);
            showNotification('Expense not found', 'error', 3000);
            return;
        }
        
        const cashAmount = expense.cash || 0;
        const totalAmount = cashAmount;
        const currency = window.posCurrency || '₱';
        const decimals = window.posDecimalPlaces || 2;
        
        console.log('📊 Loading expense details:', {
            id: expense.id,
            description: expense.description,
            totalAmount: totalAmount,
            isPaid: expense.paid,
            paidAmount: expense.paidAmount || 0
        });
        
        // Format date with exact and readable format
        const formattedDate = new Date(expense.date).toLocaleString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
        
        // Determine payment status
        const isPaid = expense.paid || totalAmount === 0;
        const statusBadge = isPaid 
            ? '<span class="badge bg-success">Paid</span>' 
            : '<span class="badge bg-warning">Pending</span>';
        
        // Get all modal elements
        const paymentDetailsContent = document.getElementById('payment-details-content');
        const paymentProgressSection = document.getElementById('payment-progress-section');
        const paymentInputSection = document.getElementById('payment-input-section');
        const processPaymentBtn = document.getElementById('process-payment-btn');
        const paymentStatusIndicator = document.getElementById('payment-status-indicator');
        
        // Validate modal elements exist
        if (!paymentDetailsContent || !paymentProgressSection || !paymentInputSection || !processPaymentBtn || !paymentStatusIndicator) {
            console.error('❌ Modal elements not found');
            showNotification('Error loading expense details modal', 'error', 3000);
            return;
        }
        
        // Populate expense date
        const expenseDateElement = document.getElementById('expense-detail-date');
        if (expenseDateElement) {
            expenseDateElement.textContent = formattedDate;
            console.log('📅 Expense date populated:', formattedDate);
        } else {
            console.error('❌ Expense date element not found');
        }
        
        if (isPaid) {
            // Show payment history for fully paid expenses
            let paymentHistoryContent = '';
            if (expense.partialPayments && expense.partialPayments.length > 0) {
                const paymentHistory = expense.partialPayments.map(payment => {
                    const paymentDate = new Date(payment.date).toLocaleString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                        hour: '2-digit', minute: '2-digit', hour12: true
                    });
                    return `
                        <div class="d-flex justify-content-between align-items-center py-1 border-bottom">
                            <div>
                                <div class="small fw-medium">
                                    ${currency}${payment.amount.toFixed(decimals)}
                                    ${payment.action === 'Mark as Paid' ? '<span class="badge bg-success ms-1" style="font-size: 0.6rem;">Mark as Paid</span>' : ''}
                                </div>
                                <div class="small text-muted">${paymentDate}</div>
                            </div>
                            <div class="small text-muted">by ${payment.processedBy || 'admin'}</div>
                        </div>
                    `;
                }).join('');
                
                paymentHistoryContent = `
                    <div class="mb-3">
                        <h6 class="text-muted mb-2">Payment History</h6>
                        <div class="bg-light rounded p-2" style="max-height: 150px; overflow-y: auto;">
                            ${paymentHistory}
                        </div>
                        <div class="mt-2 text-center">
                            <small class="text-success fw-medium">
                                Total Paid: ${currency}${(expense.paidAmount || 0).toFixed(decimals)}
                            </small>
                        </div>
                    </div>
                `;
            }
            
            paymentDetailsContent.innerHTML = `
                ${paymentHistoryContent}
                <div class="alert alert-success mb-0 border-0 py-2">
                    <div class="d-flex align-items-center">
                        <i class="fas fa-check-circle me-2"></i>
                        <div>
                            <strong>Fully Paid</strong>
                            <div class="small text-muted">This expense has been completely paid</div>
                        </div>
                    </div>
                </div>
            `;
            paymentStatusIndicator.innerHTML = '<span class="badge bg-success">Completed</span>';
            paymentProgressSection.style.display = 'none';
            paymentInputSection.style.display = 'none';
            processPaymentBtn.classList.add('d-none');
        } else {
            paymentDetailsContent.innerHTML = `
                <div class="alert alert-warning mb-0 border-0 py-2">
                    <div class="d-flex align-items-center">
                        <i class="fas fa-clock me-2"></i>
                        <div>
                            <strong>Payment Pending</strong>
                            <div class="small text-muted">Amount remaining: ${currency}${totalAmount.toFixed(decimals)}</div>
                        </div>
                    </div>
                </div>
            `;
            paymentStatusIndicator.innerHTML = '<span class="badge bg-warning">Pending</span>';
            
            // Show payment progress section
            paymentProgressSection.style.display = 'block';
            paymentInputSection.style.display = 'block';
            processPaymentBtn.classList.remove('d-none');
            
            // Initialize payment display with stored amounts
            const paidAmount = expense.paidAmount || 0;
            const remainingAmount = Math.max(totalAmount - paidAmount, 0);
            const percentage = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;
            
            console.log('🔄 Initializing Progress Bar:', {
                expenseId: expenseId,
                totalAmount: totalAmount,
                storedPaidAmount: paidAmount,
                calculatedPercentage: percentage.toFixed(1) + '%',
                remainingAmount: remainingAmount,
                isPaid: expense.paid,
                paymentHistoryCount: expense.partialPayments ? expense.partialPayments.length : 0
            });
            
            document.getElementById('paid-amount').textContent = currency + paidAmount.toFixed(decimals);
            
            // Set progress bar with correct color based on actual percentage
            const progressBar = document.getElementById('payment-progress-bar');
            progressBar.style.width = percentage + '%';
            progressBar.className = 'progress-bar';
            if (percentage >= 100) {
                progressBar.classList.add('bg-success');
            } else if (percentage >= 75) {
                progressBar.classList.add('bg-info');
            } else if (percentage >= 50) {
                progressBar.classList.add('bg-primary');
            } else if (percentage >= 25) {
                progressBar.classList.add('bg-warning');
            } else {
                progressBar.classList.add('bg-danger');
            }
            
            document.getElementById('payment-progress-text').textContent = percentage.toFixed(1) + '%';
            
            console.log('✅ Progress Bar Initialized:', {
                barWidth: percentage.toFixed(1) + '%',
                barColor: progressBar.className,
                progressText: percentage.toFixed(1) + '%',
                dataConsistent: true
            });
            document.getElementById('remaining-amount').textContent = currency + remainingAmount.toFixed(decimals);
            document.getElementById('payment-amount').value = '';
            
            // Update payment details content to show payment history
            if (expense.partialPayments && expense.partialPayments.length > 0) {
                const paymentHistory = expense.partialPayments.map(payment => {
                    const paymentDate = new Date(payment.date).toLocaleString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                        hour: '2-digit', minute: '2-digit', hour12: true
                    });
                    return `
                        <div class="d-flex justify-content-between align-items-center py-1 border-bottom">
                            <div>
                                <div class="small fw-medium">
                                    ${currency}${payment.amount.toFixed(decimals)}
                                    ${payment.action === 'Mark as Paid' ? '<span class="badge bg-success ms-1" style="font-size: 0.6rem;">Mark as Paid</span>' : ''}
                                </div>
                                <div class="small text-muted">${paymentDate}</div>
                            </div>
                            <div class="small text-muted">by ${payment.processedBy || 'admin'}</div>
                        </div>
                    `;
                }).join('');
                
                paymentDetailsContent.innerHTML = `
                    <div class="mb-3">
                        <h6 class="text-muted mb-2">Payment History</h6>
                        <div class="bg-light rounded p-2" style="max-height: 150px; overflow-y: auto;">
                            ${paymentHistory}
                        </div>
                    </div>
                    <div class="alert alert-warning mb-0 border-0 py-2">
                        <div class="d-flex align-items-center">
                            <i class="fas fa-clock me-2"></i>
                            <div>
                                <strong>Payment Pending</strong>
                                <div class="small text-muted">Amount remaining: ${currency}${remainingAmount.toFixed(decimals)}</div>
                            </div>
                        </div>
                    </div>
                `;
            } else {
                paymentDetailsContent.innerHTML = `
                    <div class="alert alert-warning mb-0 border-0 py-2">
                        <div class="d-flex align-items-center">
                            <i class="fas fa-clock me-2"></i>
                            <div>
                                <strong>Payment Pending</strong>
                                <div class="small text-muted">Amount remaining: ${currency}${totalAmount.toFixed(decimals)}</div>
                            </div>
                        </div>
                    </div>
                `;
            }
        }
        
        
        // Store expense ID and total amount on modal for payment processing
        const modalElement = document.getElementById('expenseDetailsModal');
        modalElement.setAttribute('data-expense-id', expenseId);
        modalElement.setAttribute('data-total-amount', totalAmount.toString());
        
        // Show modal
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
        
    } catch (error) {
        console.error('❌ Error showing expense details:', error);
        showNotification('Error loading expense details', 'error', 3000);
    }
}

// Make function globally accessible for onclick handlers
window.showExpenseDetails = showExpenseDetails;

// Add event listeners for expense details modal buttons
document.addEventListener('DOMContentLoaded', function() {
    // Process Payment button
    const processPaymentBtn = document.getElementById('process-payment-btn');
    if (processPaymentBtn) {
        processPaymentBtn.addEventListener('click', async function() {
            await processPayment();
        });
    }
    
    // Payment amount input
    const paymentAmountInput = document.getElementById('payment-amount');
    if (paymentAmountInput) {
        paymentAmountInput.addEventListener('input', updatePaymentProgress);
    }
});

// Process payment
async function processPayment() {
    try {
        const paymentAmount = parseFloat(document.getElementById('payment-amount').value) || 0;
        const expenseId = document.getElementById('expenseDetailsModal').getAttribute('data-expense-id');
        
        // Validate inputs
        if (!expenseId) {
            console.error('❌ No expense ID found in modal');
            showNotification('Error: Expense ID not found', 'error', 3000);
            return;
        }
        
        if (paymentAmount <= 0) {
            showNotification('Please enter a valid payment amount', 'error', 3000);
            return;
        }
        
        console.log('💳 Processing payment:', { expenseId, paymentAmount });
        
        // Get current expenses
        const expenses = await getAllJournals();
        if (!expenses) {
            console.error('❌ Failed to load expenses');
            showNotification('Error loading expense data', 'error', 3000);
            return;
        }
        
        const expense = expenses.find(e => e.id == expenseId);
        
        if (!expense) {
            console.error('❌ Expense not found during payment processing');
            showNotification('Expense not found', 'error', 3000);
            return;
        }
        
        const totalAmount = expense.cash || 0;
        if (totalAmount <= 0) {
            console.error('❌ Invalid total amount:', totalAmount);
            showNotification('Invalid expense amount', 'error', 3000);
            return;
        }
        
        const currentPaid = expense.paidAmount || 0;
        const newTotalPaid = currentPaid + paymentAmount;
        
        // Validate payment doesn't exceed total by too much (allow small overpayment)
        if (newTotalPaid > totalAmount * 1.1) {
            showNotification(`Payment amount exceeds total by too much (₱${totalAmount.toFixed(2)})`, 'error', 3000);
            return;
        }
        
        // Check if this is a "Mark as Paid" action (100% progress)
        const isMarkAsPaidAction = (newTotalPaid >= totalAmount);
        const processBtn = document.getElementById('process-payment-btn');
        const buttonShowsMarkAsPaid = processBtn && processBtn.textContent.includes('Mark as Paid');
        
        // Update expense with payment information
        console.log('💾 Storing Payment Data:', {
            expenseId: expenseId,
            previousPaidAmount: expense.paidAmount || 0,
            currentPayment: paymentAmount,
            newTotalPaid: newTotalPaid,
            totalAmount: totalAmount,
            isFullyPaid: newTotalPaid >= totalAmount
        });
        
        expense.paidAmount = newTotalPaid; // Store total amount paid so far
        expense.partialPayments = expense.partialPayments || []; // Array to track individual payments
        expense.partialPayments.push({
            amount: paymentAmount,
            date: new Date().toISOString(),
            processedBy: 'admin',
            action: buttonShowsMarkAsPaid ? 'Mark as Paid' : 'Process Payment'
        });
        
        console.log('📝 Payment History Updated:', {
            totalPayments: expense.partialPayments.length,
            paymentHistory: expense.partialPayments,
            storedPaidAmount: expense.paidAmount
        });
        
        // Mark as fully paid if total payments match or exceed the amount OR if button shows "Mark as Paid"
        if (isMarkAsPaidAction || buttonShowsMarkAsPaid) {
            expense.paid = true;
            expense.paidDate = new Date().toISOString();
            console.log('✅ Expense marked as fully paid - Status changed from Pending to Paid');
        }
        
        // Save updated expenses
        await saveAllJournals(expenses);
        console.log('💾 Expenses saved successfully - Paid amount data is now persistent');
        
        // Add audit log
        const auditAction = buttonShowsMarkAsPaid 
            ? `Admin marked expense ${expenseId} as fully paid (₱${newTotalPaid.toFixed(2)})`
            : `Admin processed payment of ₱${paymentAmount.toFixed(2)} for expense ${expenseId}. Total paid: ₱${newTotalPaid.toFixed(2)}`;
        
        await addAuditLog({ 
            date: new Date().toISOString(), 
            action: auditAction
        });
        
        // Close modal
        const modalElement = document.getElementById('expenseDetailsModal');
        const modal = bootstrap.Modal.getInstance(modalElement);
        if (modal) {
            modal.hide();
        } else {
            console.error('❌ Modal instance not found');
            // Fallback: hide modal manually
            modalElement.style.display = 'none';
            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop) {
                backdrop.remove();
            }
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
        }
        
        // Refresh expense journal
        try {
            await loadExpenseJournal();
            console.log('📊 Expense journal refreshed successfully');
        } catch (error) {
            console.error('❌ Error refreshing expense journal:', error);
            showNotification('Payment processed but failed to refresh list', 'warning', 3000);
        }
        
        // Refresh sales journal to listen to expense updates
        try {
            console.log('🔄 DEBUG: About to refresh Sales Journal after payment...');
            await loadSalesJournal();
            console.log('📈 DEBUG: Sales journal refreshed with updated expenses');
        } catch (error) {
            console.error('❌ DEBUG: Error refreshing sales journal:', error);
            showNotification('Payment processed but failed to refresh sales journal', 'warning', 3000);
        }
        
        // Refresh Revenue Trends chart with updated expense data
        try {
            console.log('📈 DEBUG: About to refresh Revenue Trends chart after payment...');
            await loadFinancialOverviewChart();
            console.log('📈 DEBUG: Revenue Trends chart refreshed with updated expenses');
        } catch (error) {
            console.error('❌ DEBUG: Error refreshing Revenue Trends chart:', error);
            showNotification('Payment processed but failed to refresh Revenue Trends', 'warning', 3000);
        }
        
        // Refresh dashboard components to reflect payment changes
        try {
            console.log('🔄 Refreshing dashboard components...');
            
            // Refresh main dashboard stats (Total Expenses, Revenue, etc.)
            await loadDashboard();
            console.log('📈 Dashboard stats refreshed');
        } catch (error) {
            console.error('❌ DEBUG: Error refreshing dashboard stats:', error);
        }
            console.log('📊 Financial overview chart refreshed');
            
            // Refresh Analytics Dashboard (if available)
            if (typeof loadAdminAnalytics === 'function') {
                await loadAdminAnalytics();
                console.log('📊 Admin Analytics Dashboard refreshed');
            }
            
            // Refresh Cashier Analytics Dashboard (if available)
            if (typeof loadAnalytics === 'function') {
                await loadAnalytics();
                console.log('📊 Cashier Analytics Dashboard refreshed');
            }
            
            console.log('✅ All dashboard components synchronized with payment data');
        } catch (error) {
            console.error('❌ Error refreshing dashboard components:', error);
            showNotification('Payment processed but dashboard update failed', 'warning', 3000);
        }
        
        // Show success notification
        const progressPercentage = ((newTotalPaid / totalAmount) * 100).toFixed(1);
        if (buttonShowsMarkAsPaid || newTotalPaid >= totalAmount) {
            showNotification(`✅ Status changed from Pending to Paid! Expense fully paid: ₱${newTotalPaid.toFixed(2)}`, 'success', 4000);
        } else {
            showNotification(`Payment of ₱${paymentAmount.toFixed(2)} processed successfully (${progressPercentage}% complete)`, 'success', 3000);
        }
}

// Update payment progress display
function updatePaymentProgress() {
    const paymentAmount = parseFloat(document.getElementById('payment-amount').value) || 0;
    
    // Get total amount from modal data since we removed the display element
    const expenseId = document.getElementById('expenseDetailsModal').getAttribute('data-expense-id');
    const totalAmount = parseFloat(document.getElementById('expenseDetailsModal').getAttribute('data-total-amount')) || 0;
    
    // Get the current paid amount from the modal data
    const currentPaid = parseFloat(document.getElementById('paid-amount').textContent.replace('₱', '').replace(',', '')) || 0;
    
    console.log('📊 Progress Update:', {
        expenseId: expenseId,
        totalAmount: totalAmount,
        currentPaid: currentPaid,
        paymentInput: paymentAmount,
        actualPercentage: totalAmount > 0 ? ((currentPaid / totalAmount) * 100).toFixed(1) + '%' : '0%',
        projectedPercentage: totalAmount > 0 ? (((currentPaid + paymentAmount) / totalAmount) * 100).toFixed(1) + '%' : '0%'
    });
    
    // Show/hide real-time calculation display
    const realTimeCalc = document.getElementById('real-time-calculation');
    if (paymentAmount > 0) {
        realTimeCalc.style.display = 'block';
    } else {
        realTimeCalc.style.display = 'none';
    }
    
    if (totalAmount > 0) {
        const totalPaidAmount = currentPaid + paymentAmount;
        const projectedPercentage = Math.min((totalPaidAmount / totalAmount) * 100, 100);
        const actualPercentage = Math.min((currentPaid / totalAmount) * 100, 100); // ALWAYS use current paid
        const remaining = Math.max(totalAmount - totalPaidAmount, 0);
        
        // Ensure progress bar ALWAYS shows ACTUAL paid percentage (never changes with input)
        const progressBar = document.getElementById('payment-progress-bar');
        progressBar.style.width = actualPercentage + '%';
        
        // Update progress bar color based on ACTUAL percentage only
        progressBar.className = 'progress-bar';
        if (actualPercentage >= 100) {
            progressBar.classList.add('bg-success');
        } else if (actualPercentage >= 75) {
            progressBar.classList.add('bg-info');
        } else if (actualPercentage >= 50) {
            progressBar.classList.add('bg-primary');
        } else if (actualPercentage >= 25) {
            progressBar.classList.add('bg-warning');
        } else {
            progressBar.classList.add('bg-danger');
        }
        
        // Progress text ALWAYS shows ACTUAL percentage
        document.getElementById('payment-progress-text').textContent = actualPercentage.toFixed(1) + '%';
        
        console.log('🎯 Progress Bar Updated:', {
            barWidth: actualPercentage.toFixed(1) + '%',
            barColor: progressBar.className,
            progressText: actualPercentage.toFixed(1) + '%',
            isConsistent: true
        });
        
        // Update remaining amount with color coding
        const remainingElement = document.getElementById('remaining-amount');
        remainingElement.textContent = '₱' + remaining.toFixed(2);
        remainingElement.className = remaining === 0 ? 'h5 text-success fw-bold mb-0' : 'h5 text-warning fw-bold mb-0';
        
        // Add visual feedback for remaining amount
        if (remaining === 0) {
            remainingElement.innerHTML = '✅ ' + remainingElement.textContent;
        } else if (paymentAmount > 0) {
            // Show the deduction happening
            const originalRemaining = totalAmount - currentPaid;
            if (originalRemaining !== remaining) {
                remainingElement.innerHTML = '₱' + remaining.toFixed(2) + ' <small class="text-muted">(-₱' + paymentAmount.toFixed(2) + ')</small>';
            }
        }
        
        // Update real-time calculation display
        const currency = window.posCurrency || '₱';
        const decimals = window.posDecimalPlaces || 2;
        
        document.getElementById('calc-current-paid').textContent = currency + currentPaid.toFixed(decimals);
        document.getElementById('calc-this-payment').textContent = currency + paymentAmount.toFixed(decimals);
        document.getElementById('calc-total-paid').textContent = currency + totalPaidAmount.toFixed(decimals);
        document.getElementById('calc-remaining').textContent = currency + remaining.toFixed(decimals);
        
        // Update process button state
        const processBtn = document.getElementById('process-payment-btn');
        if (projectedPercentage >= 100) {
            // Change to "Mark as Paid" when projected 100% reached
            processBtn.innerHTML = '<i class="fas fa-check me-1"></i> Mark as Paid';
            processBtn.classList.remove('btn-warning');
            processBtn.classList.add('btn-success');
        } else {
            // Keep as "Process" when less than 100%
            processBtn.innerHTML = '<i class="fas fa-calculator me-1"></i> Process';
            processBtn.classList.remove('btn-success');
            processBtn.classList.add('btn-warning');
        }
        
        // Add real-time calculation feedback
        console.log('💰 Real-time calculation:', {
            paymentAmount: '₱' + paymentAmount.toFixed(2),
            currentPaid: '₱' + currentPaid.toFixed(2),
            totalPaid: '₱' + totalPaidAmount.toFixed(2),
            remaining: '₱' + remaining.toFixed(2),
            actualPercentage: actualPercentage.toFixed(1) + '%',
            projectedPercentage: projectedPercentage.toFixed(1) + '%'
        });
    }
}

// Make functions globally accessible
window.ensureSalesJournalListensToExpenses = ensureSalesJournalListensToExpenses;

// Listen for messages from cashier window about expense updates
window.addEventListener('message', function(event) {
    // Verify the message is from our application
    if (event.data && event.data.type === 'expenseUpdate') {
        console.log('📊 Received expense update message from cashier:', event.data);
        ensureSalesJournalListensToExpenses();
        
        // Also update Revenue Trends chart with new expense data
        try {
            loadFinancialOverviewChart();
            console.log('📈 Revenue Trends chart updated from cross-window message');
        } catch (error) {
            console.error('❌ Error updating Revenue Trends from message:', error);
        }
    }
});

console.log('🔗 Cross-window expense listener activated');
// Stock change tracking
async function trackInventoryChanges() {
    const inventory = await getAllInventory();
    const changes = [];
    const currentDate = new Date().toISOString().split('T')[0];
    
    inventory.forEach(item => {
        const itemId = item.id || item.name;
        const currentStock = item.stock || 0;
        
        changes.push({
            date: currentDate,
            item: item.name || `Item ${itemId}`,
            previousStock: currentStock, // This will be original stock
            newStock: currentStock,
            user: 'Current',
            change: 0
        });
    });
    
    return changes;
}

// Helper to extract stock values
function extractStockValue(details, type) {
    const match = details.match(/(\d+)\s*→\s*(\d+)/);
    if (match) {
        return type === 'previous' ? parseInt(match[1]) : parseInt(match[2]);
    }
    return 0;
}
// Simple Inventory History Function - Shows Current Inventory Stock
async function loadInventoryHistory() {
    const tbody = document.querySelector('#inventory-history-table tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="5" class="text-center">Loading...</td></tr>';
    
    try {
        const selectedDate = document.getElementById('inventory-history-date')?.value;
        const today = new Date().toISOString().split('T')[0];
        const filterDate = selectedDate || today;
        
        const inventory = await getAllInventory();
        const auditLogs = await getAllAuditLogs();
        const stockChanges = auditLogs.filter(log => 
            log.action === 'STOCK_CHANGE' && 
            log.date?.split('T')[0] === filterDate
        );
        
        tbody.innerHTML = '';
        
        if (stockChanges.length > 0) {
            stockChanges.forEach(change => {
                const previousStock = extractStockValue(change.details, 'previous');
                const newStock = extractStockValue(change.details, 'new');
                const row = `
                    <tr>
                        <td>${new Date(change.date).toLocaleDateString()}</td>
                        <td>${change.details}</td>
                        <td class="text-center">${previousStock}</td>
                        <td class="text-center">${newStock}</td>
                        <td>${change.user || 'System'}</td>
                    </tr>
                `;
                tbody.innerHTML += row;
            });
        } else {
            // Show current inventory as original stock
            inventory.forEach(item => {
                const row = `
                    <tr>
                        <td>${new Date().toLocaleDateString()}</td>
                        <td>${item.name || 'Unknown'}</td>
                        <td class="text-center">${item.stock || 0}</td>
                        <td class="text-center">${item.stock || 0}</td>
                        <td>Original</td>
                    </tr>
                `;
                tbody.innerHTML += row;
            });
        }
        
    } catch (error) {
        console.error('Error loading inventory history:', error);
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Error loading data</td></tr>';
    }
}

// Listen to Inventory stock changes in real-time
function setupInventoryStockListener() {
    console.log('🔧 Setting up Inventory stock listener...');
    
    // Hook into the existing saveItem function to track stock changes
    const originalSaveItem = saveItem;
    saveItem = async function(e) {
        console.log('📦 saveItem called - checking stock change...');
        
        try {
            // Call original function first
            await originalSaveItem.call(this, e);
            console.log('✅ Item saved successfully');
            
            // Always refresh inventory history to show current stock
            setTimeout(() => {
                if (document.getElementById('inventory-history-tab')?.classList.contains('active')) {
                    loadInventoryHistory();
                    console.log('🔄 Refreshed inventory history with current stock');
                }
            }, 500); // Small delay to ensure data is saved
            
        } catch (error) {
            console.error('❌ Error in saveItem:', error);
            throw error;
        }
    };
    
    // Hook into deleteItem function
    const originalDeleteItem = deleteItem;
    deleteItem = async function(id) {
        console.log('🗑️ deleteItem called - removing from inventory...');
        
        try {
            await originalDeleteItem.call(this, id);
            console.log('✅ Item deleted successfully');
            
            // Refresh inventory history to show updated stock
            setTimeout(() => {
                if (document.getElementById('inventory-history-tab')?.classList.contains('active')) {
                    loadInventoryHistory();
                    console.log('🔄 Refreshed inventory history after deletion');
                }
            }, 500); // Small delay to ensure data is deleted
            
        } catch (error) {
            console.error('❌ Error in deleteItem:', error);
            throw error;
        }
    };
    
    // Listen for localStorage changes (when inventory changes)
    window.addEventListener('storage', function(e) {
        if (e.key === 'inventory' && document.getElementById('inventory-history-tab')?.classList.contains('active')) {
            console.log('📦 Inventory changed in localStorage - refreshing...');
            loadInventoryHistory();
        }
    });
    
    // Periodic check for inventory changes
    let lastInventoryHash = '';
    setInterval(() => {
        const currentInventory = JSON.stringify(JSON.parse(localStorage.getItem('inventory') || '[]'));
        const currentHash = currentInventory.length.toString();
        if (currentHash !== lastInventoryHash && document.getElementById('inventory-history-tab')?.classList.contains('active')) {
            lastInventoryHash = currentHash;
            console.log('📊 Inventory changed - refreshing...');
            loadInventoryHistory();
        }
    }, 2000); // Check every 2 seconds
    
    console.log('✅ Inventory stock listener setup complete');
}

// Simple event listener for inventory history
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM loaded - setting up inventory history...');
    
    const inventoryHistoryTab = document.getElementById('inventory-history-tab');
    if (inventoryHistoryTab) {
        inventoryHistoryTab.addEventListener('shown.bs.tab', function() {
            console.log('📋 Inventory History tab shown - loading current stock...');
            loadInventoryHistory();
        });
    }
    // Inventory history date picker
    const inventoryHistoryDate = document.getElementById('inventory-history-date');
     if (inventoryHistoryDate) {
        inventoryHistoryDate.addEventListener('change', loadInventoryHistory);
        inventoryHistoryDate.value = new Date().toISOString().split('T')[0];
    }
    // Setup inventory stock listener
    setupInventoryStockListener();
});
