const PRINT_SERVER_URL = 'http://localhost:4000'; // Change to your PC IP+port if needed

function getSession(){
    try {
        // Try secure session management first
        const session = getSecureSession();
        if (session && session.role === 'cashier') {
            return session;
        }
        
        // Fallback to simple session
        const raw = sessionStorage.getItem('session');
        if (!raw) return null;
        const simpleSession = JSON.parse(raw);
        if (!simpleSession || !simpleSession.role || !simpleSession.expiresAt) return null;
        if (Date.now() > simpleSession.expiresAt) return null;
        if (simpleSession.role !== 'cashier') return null;
        
        return simpleSession;
    } catch (error) {
        console.error('Session validation error:', error);
        return null;
    }
}

let cart = [];
let currentSearchTerm = '';
let currentCategoryFilter = 'all';
let pendingAddItem = null;

document.addEventListener('DOMContentLoaded', async function(){
    const session = getSession();
    if (!session || session.role !== 'cashier') {
        window.location.href = 'index.html';
        return;
    }
    if (typeof syncUnsyncedSalesToSupabase === 'function') {
        try {
            await syncUnsyncedSalesToSupabase();
        } catch (err) {
            console.error('Failed to sync unsynced sales to Supabase', err);
        }
    }
    await loadInventory();
    loadCart();
    await loadSalesHistory();
    setupSalesHistorySelection();

    document.getElementById('expense-form').addEventListener('submit', addExpense);
    document.getElementById('checkout-btn').addEventListener('click', checkout);
    document.getElementById('void-btn').addEventListener('click', voidSelected);
    const amountGivenInput = document.getElementById('amount-given');
    if (amountGivenInput) {
        amountGivenInput.addEventListener('input', updateChangeDisplay);
    }
    const doneShiftBtn = document.getElementById('done-shift-btn');
    if (doneShiftBtn) {
        doneShiftBtn.addEventListener('click', doneShift);
    }
    
    const receiptSettingsBtn = document.getElementById('receipt-settings-btn');
    if (receiptSettingsBtn) {
        receiptSettingsBtn.addEventListener('click', openReceiptSettingsModal);
    }
    
    const inventorySearch = document.getElementById('inventory-search');
    const categoryFilter = document.getElementById('inventory-category-filter');
    if (inventorySearch) {
        inventorySearch.addEventListener('input', handleInventorySearch);
    }
    if (categoryFilter) {
        categoryFilter.addEventListener('change', handleInventoryCategoryChange);
    }

    const proceedBtn = document.getElementById('add-to-cart-proceed-btn');
    if (proceedBtn) {
        proceedBtn.addEventListener('click', handleAddToCartProceed);
    }

    const cashierMenuToggle = document.getElementById('cashierMenuToggle');
    const cashierTabs = document.getElementById('cashierTabs');
    if (cashierMenuToggle && cashierTabs) {
        const applyCashierTabsVisibility = () => {
			const isDesktop = window.matchMedia('(min-width: 768px)').matches;
            if (isDesktop) {
                cashierTabs.classList.remove('cashier-tabs-collapsed');
            } else {
                if (!cashierTabs.classList.contains('cashier-tabs-collapsed')) {
                    cashierTabs.classList.add('cashier-tabs-collapsed');
                }
            }
        };

        applyCashierTabsVisibility();

        window.addEventListener('resize', applyCashierTabsVisibility);

        cashierMenuToggle.addEventListener('click', () => {
			const isDesktop = window.matchMedia('(min-width: 768px)').matches;
            if (!isDesktop) {
                cashierTabs.classList.toggle('cashier-tabs-collapsed');
            }
        });

        cashierTabs.addEventListener('click', (event) => {
            const isDesktop = window.matchMedia('(min-width: 768px)').matches;
            if (isDesktop) return;
            const clicked = event.target.closest('.nav-link');
            if (!clicked) return;
            if (!cashierTabs.classList.contains('cashier-tabs-collapsed')) {
                cashierTabs.classList.add('cashier-tabs-collapsed');
            }
        });
    }

    const mobileCartButton = document.getElementById('mobileCartButton');
    if (mobileCartButton && cashierTabs && window.bootstrap && bootstrap.Tab) {
        const mobileCartTabButton = cashierTabs.querySelector('[data-bs-target="#cart"]');
        mobileCartButton.addEventListener('click', () => {
            const isDesktop = window.matchMedia('(min-width: 768px)').matches;
            if (isDesktop) return;
            if (mobileCartTabButton) {
                const tab = new bootstrap.Tab(mobileCartTabButton);
                tab.show();
            }
        });
    }

    // Desktop/Tablet Cart Button functionality
    const desktopCartButton = document.getElementById('desktopCartButton');
    if (desktopCartButton) {
        desktopCartButton.addEventListener('click', (e) => {
            e.preventDefault();
            
            const isDesktop = window.matchMedia('(min-width: 768px)').matches;
            if (!isDesktop) {
                console.log('🖥️ Desktop cart button clicked but not on desktop - ignoring');
                return;
            }
            
            console.log('🛒 Desktop cart button clicked - showing cart tab');
            
            // Animate the cart icon
            const icon = document.getElementById('desktopCartIcon');
            if (icon && typeof animateCartIcon === 'function') {
                animateCartIcon(icon);
            }
            
            // Find and click the cart tab button
            const cartTabButton = document.querySelector('[data-bs-target="#cart"]');
            if (cartTabButton) {
                console.log('📋 Found cart tab button - activating');
                cartTabButton.click();
                
                // Load cart data immediately
                if (typeof loadCart === 'function') {
                    loadCart();
                }
            } else {
                console.error('❌ Cart tab button not found');
            }
        });
    } else {
        console.log('⚠️ Desktop cart button not found');
    }

    const cartTableBody = document.querySelector('#cart-table tbody');
    if (cartTableBody) {
        cartTableBody.addEventListener('click', (e) => {
            const decBtn = e.target.closest('.cart-qty-decrease');
            const incBtn = e.target.closest('.cart-qty-increase');
            if (!decBtn && !incBtn) return;
            const btn = decBtn || incBtn;
            const indexRaw = btn.getAttribute('data-index');
            const index = indexRaw ? parseInt(indexRaw, 10) : NaN;
            if (isNaN(index)) return;
            const delta = decBtn ? -1 : 1;
            changeCartQuantity(index, delta);
        });
    }

    const voidSaleItemBtn = document.getElementById('void-sale-item-btn');
    const voidSaleItemModalConfirm = document.getElementById('void-sale-item-modal-confirm');
    if (voidSaleItemBtn && voidSaleItemModalConfirm) {
        voidSaleItemBtn.addEventListener('click', openVoidSaleItemModal);
        voidSaleItemModalConfirm.addEventListener('click', confirmVoidSaleItemFromModal);
    }
    if (typeof syncUnsyncedSalesToSupabase === 'function') {
        window.addEventListener('online', () => {
            syncUnsyncedSalesToSupabase().catch(err => {
                console.error('Failed to sync unsynced sales to Supabase on online event', err);
            });
        });
    }

    // Set today's date as default for Net Sale and Gross Sale
    const today = new Date().toISOString().split('T')[0];
    const netSaleDateEl = document.getElementById('net-sale-date');
    if (netSaleDateEl) netSaleDateEl.value = today;
    
    const grossSaleDateEl = document.getElementById('gross-sale-date');
    if (grossSaleDateEl) grossSaleDateEl.value = today;
    
    // Add event listeners for Net Sale and Gross Sale tabs
    const netSaleTab = document.querySelector('[data-bs-target="#net-sale"]');
    if (netSaleTab) {
        netSaleTab.addEventListener('shown.bs.tab', () => {
            loadNetSale();
        });
    }
    
    const grossSaleTab = document.querySelector('[data-bs-target="#gross-sale"]');
    if (grossSaleTab) {
        grossSaleTab.addEventListener('shown.bs.tab', () => {
            loadGrossSale();
        });
    }
    
    // Add refresh button listeners
    const refreshNetSaleBtn = document.getElementById('refresh-net-sale-btn');
    if (refreshNetSaleBtn) {
        refreshNetSaleBtn.addEventListener('click', loadNetSale);
    }
    
    const refreshGrossSaleBtn = document.getElementById('refresh-gross-sale-btn');
    if (refreshGrossSaleBtn) {
        refreshGrossSaleBtn.addEventListener('click', loadGrossSale);
    }
    
    // Add date change listeners
    const netSaleDateInput = document.getElementById('net-sale-date');
    if (netSaleDateInput) {
        netSaleDateInput.addEventListener('change', loadNetSale);
    }
    
    const grossSaleDateInput = document.getElementById('gross-sale-date');
    if (grossSaleDateInput) {
        grossSaleDateInput.addEventListener('change', loadGrossSale);
    }
    
    // Analytics event listeners
    const analyticsBtn = document.getElementById('analytics-btn');
    if (analyticsBtn) {
        analyticsBtn.addEventListener('click', () => {
            // Refresh analytics when modal opens
            setTimeout(() => {
                refreshAnalyticsData();
            }, 500);
        });
    }
    
    const refreshAnalyticsBtn = document.getElementById('refresh-analytics-btn');
    if (refreshAnalyticsBtn) {
        refreshAnalyticsBtn.addEventListener('click', refreshAnalyticsData);
    }
    
    const analyticsDatePicker = document.getElementById('analytics-date-picker');
    if (analyticsDatePicker) {
        analyticsDatePicker.addEventListener('change', refreshAnalyticsData);
    }
});

window.logout = ()=>{
    try {
        sessionStorage.removeItem('session');
    } catch (err) {
        console.error('Failed to clear session', err);
    }
    window.location.href='index.html';
};

// Net Sale and Gross Sale functions
async function loadNetSale(selectedDate = null) {
    console.log('🔄 loadNetSale called with date:', selectedDate);
    
    try {
        const targetDate = selectedDate || document.getElementById('net-sale-date')?.value || new Date().toISOString().split('T')[0];
        
        if (typeof getAllSales === 'function' && typeof getAllJournalEntries === 'function') {
            const sales = await getAllSales();
            const expenses = await getAllJournalEntries();
            
            // Filter sales by date
            const dateSales = sales.filter(sale => {
                if (!sale.date) return false;
                const saleDate = new Date(sale.date).toISOString().split('T')[0];
                return saleDate === targetDate;
            });
            
            // Filter expenses by date
            const dateExpenses = expenses.filter(expense => {
                if (!expense.date) return false;
                const expenseDate = new Date(expense.date).toISOString().split('T')[0];
                return expenseDate === targetDate;
            });
            
            // Calculate gross amount
            const grossAmount = dateSales.reduce((sum, sale) => sum + (sale.total || 0), 0);
            
            // Calculate voided items amount
            let voidedAmount = 0;
            dateSales.forEach(sale => {
                if (sale.items) {
                    sale.items.forEach(item => {
                        if (item.voided) {
                            voidedAmount += (item.price * item.qty);
                        }
                    });
                }
            });
            
            // Calculate total expenses
            const totalExpenses = dateExpenses.reduce((sum, expense) => {
                return sum + (expense.cash || 0);
            }, 0);
            
            // Calculate net amount
            const netAmount = grossAmount - totalExpenses - voidedAmount;
            
            // Update UI
            const netSaleAmountEl = document.getElementById('net-sale-amount');
            if (netSaleAmountEl) {
                netSaleAmountEl.textContent = netAmount.toFixed(2);
            }
            
            const netGrossAmountEl = document.getElementById('net-gross-amount');
            if (netGrossAmountEl) {
                netGrossAmountEl.textContent = grossAmount.toFixed(2);
            }
            
            const netExpensesAmountEl = document.getElementById('net-expenses-amount');
            if (netExpensesAmountEl) {
                netExpensesAmountEl.textContent = totalExpenses.toFixed(2);
            }
            
            const netVoidedAmountEl = document.getElementById('net-voided-amount');
            if (netVoidedAmountEl) {
                netVoidedAmountEl.textContent = voidedAmount.toFixed(2);
            }
            
            console.log(`✅ Net Sale calculated for ${targetDate}:`, {
                grossAmount,
                voidedAmount,
                totalExpenses,
                netAmount
            });
            
        } else {
            console.log('getAllSales or getAllJournalEntries function not available');
            // Set default values
            const netSaleAmountEl = document.getElementById('net-sale-amount');
            if (netSaleAmountEl) {
                netSaleAmountEl.textContent = '0.00';
            }
        }
    } catch (error) {
        console.error('❌ Error loading Net Sale:', error);
        const netSaleAmountEl = document.getElementById('net-sale-amount');
        if (netSaleAmountEl) {
            netSaleAmountEl.textContent = '0.00';
        }
    }
}

async function loadGrossSale(selectedDate = null) {
    console.log('🔄 loadGrossSale called with date:', selectedDate);
    
    try {
        const targetDate = selectedDate || document.getElementById('gross-sale-date')?.value || new Date().toISOString().split('T')[0];
        
        if (typeof getAllSales === 'function') {
            const sales = await getAllSales();
            
            // Filter sales by date
            const dateSales = sales.filter(sale => {
                if (!sale.date) return false;
                const saleDate = new Date(sale.date).toISOString().split('T')[0];
                return saleDate === targetDate;
            });
            
            // Calculate gross amount
            const grossAmount = dateSales.reduce((sum, sale) => sum + (sale.total || 0), 0);
            
            // Update UI
            const grossSaleAmountEl = document.getElementById('gross-sale-amount');
            if (grossSaleAmountEl) {
                grossSaleAmountEl.textContent = grossAmount.toFixed(2);
            }
            
            console.log(`✅ Gross Sale calculated for ${targetDate}:`, grossAmount);
            
        } else {
            console.log('getAllSales function not available');
            // Set default value
            const grossSaleAmountEl = document.getElementById('gross-sale-amount');
            if (grossSaleAmountEl) {
                grossSaleAmountEl.textContent = '0.00';
            }
        }
    } catch (error) {
        console.error('❌ Error loading Gross Sale:', error);
        const grossSaleAmountEl = document.getElementById('gross-sale-amount');
        if (grossSaleAmountEl) {
            grossSaleAmountEl.textContent = '0.00';
        }
    }
}

function showCashierNotification(message, type = 'info', duration = 3000){
    const container = document.getElementById('cashier-alert-container');
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

// --- Inventory ---
async function loadInventory(){
    const inventory = await getAllInventory();

    // populate category filter options dynamically from inventory
    const categorySelect = document.getElementById('inventory-category-filter');
    if (categorySelect) {
        const categories = Array.from(new Set(inventory.map(i => i.category).filter(Boolean))).sort();
        const previousValue = categorySelect.value || 'all';
        categorySelect.innerHTML = '<option value="all">All Categories</option>' +
            categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
        if (previousValue && previousValue !== 'all') {
            categorySelect.value = previousValue;
            if (categorySelect.value !== previousValue) {
                currentCategoryFilter = 'all';
                categorySelect.value = 'all';
            }
        }
    }

    // apply search and category filters
    let filtered = inventory;
    if (currentSearchTerm) {
        const term = currentSearchTerm.toLowerCase();
        filtered = filtered.filter(item =>
            (item.name && item.name.toLowerCase().includes(term)) ||
            (item.category && item.category.toLowerCase().includes(term))
        );
    }
    if (currentCategoryFilter && currentCategoryFilter !== 'all') {
        filtered = filtered.filter(item => item.category === currentCategoryFilter);
    }

    const tbody = document.querySelector('#inventory-table tbody');
    tbody.innerHTML='';
    filtered.forEach(item=>{
        const cartItem = cart.find(c=>c.id===item.id);
        const qtyInCart = cartItem ? cartItem.qty : 0;
        const rawLeft = item.stock - qtyInCart;
        const stockLeft = rawLeft < 0 ? 0 : rawLeft;
        const isOut = stockLeft <= 0;
        const isLow = stockLeft > 0 && stockLeft <= 5;
        const cardStatusClass = isOut ? ' inventory-card-out' : (isLow ? ' inventory-card-low' : '');
        const stockLabel = isOut ? ' (Out of stock)' : (isLow ? ' (Low stock)' : '');
        const stockClass = isOut ? 'inventory-card-stock text-danger' : (isLow ? 'inventory-card-stock text-warning' : 'inventory-card-stock');
        const clickableClass = isOut ? '' : ' inventory-card-clickable';
        const cardOnclick = isOut ? '' : ` onclick="handleInventoryTap(${item.id})"`;
        const buttonHtml = isOut
            ? `<button class="btn btn-secondary btn-sm" disabled>Out of stock</button>`
            : `<button class="btn btn-primary btn-sm">Add to Cart</button>`;

        // Hide profit information - only show selling price
        const price = parseFloat(item.price || 0);

        const row = `<tr>
            <td>
                <div class="inventory-card${cardStatusClass}${clickableClass}" data-item-id="${item.id}"${cardOnclick}>
                    <div class="inventory-card-image">
                        <img src="${item.image||''}" alt="${item.name}">
                    </div>
                    <div class="inventory-card-body">
                        <div class="inventory-card-name">${item.name}</div>
                        <div class="inventory-card-meta">
                            <span class="inventory-card-price">₱${price.toFixed(2)}</span>
                            <span class="${stockClass}">Stock: ${stockLeft}${stockLabel}</span>
                            <span class="inventory-card-category">${item.category}</span>
                        </div>
                    </div>
                    <div class="inventory-card-actions">
                        ${buttonHtml}
                    </div>
                </div>
            </td>
        </tr>`;
        tbody.insertAdjacentHTML('beforeend', row);
    });
}

async function handleInventoryTap(id){
    // On mobile/tablet, make a single tap directly add 1 item to the cart.
    // On desktop, keep the existing modal flow for choosing quantity.
    const mq = (typeof window !== 'undefined' && window.matchMedia)
        ? window.matchMedia('(max-width: 991.98px)')
        : null;
    const isMobileOrTablet = mq ? mq.matches : false;

    if (isMobileOrTablet) {
        const inventory = await getAllInventory();
        const invItem = inventory.find(i => i.id === id);
        if (!invItem) {
            showCashierNotification('Item not found in inventory.', 'danger', 4000);
            return;
        }

        const success = await addToCart(invItem.id, invItem.name, invItem.price, invItem.cost || 0, invItem.category, 1);
        if (success) {
            triggerMobileCartAnimationFromItem(id);
        }
    } else {
        openAddToCartPreview(id);
    }
}

function triggerMobileCartAnimationFromItem(id){
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(max-width: 991.98px)');
    if (!mq.matches) return;

    const card = document.querySelector(`.inventory-card[data-item-id="${id}"]`);
    const icon = document.getElementById('mobileCartIcon');
    if (!card || !icon) return;

    const cardRect = card.getBoundingClientRect();
    const iconRect = icon.getBoundingClientRect();

    const flyer = document.createElement('div');
    flyer.className = 'cashier-cart-flyer';
    flyer.style.position = 'fixed';
    flyer.style.width = '20px';
    flyer.style.height = '20px';
    flyer.style.borderRadius = '999px';
    flyer.style.background = '#4f46e5';
    flyer.style.boxShadow = '0 8px 20px rgba(79, 70, 229, 0.5)';
    flyer.style.opacity = '0.9';
    flyer.style.zIndex = '9999';
    flyer.style.left = `${cardRect.left + cardRect.width / 2 - 10}px`;
    flyer.style.top = `${cardRect.top + cardRect.height / 2 - 10}px`;
    flyer.style.transition = 'transform 0.5s ease, left 0.5s ease, top 0.5s ease, opacity 0.5s ease';

    document.body.appendChild(flyer);

    requestAnimationFrame(() => {
        flyer.style.left = `${iconRect.left + iconRect.width / 2 - 10}px`;
        flyer.style.top = `${iconRect.top + iconRect.height / 2 - 10}px`;
        flyer.style.transform = 'scale(0.3)';
        flyer.style.opacity = '0';
    });

    setTimeout(() => {
        if (flyer.parentNode) flyer.parentNode.removeChild(flyer);
    }, 550);
}

// Desktop cart animation function
function triggerDesktopCartAnimationFromItem(id){
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(min-width: 768px)');
    if (!mq.matches) return;

    const card = document.querySelector(`.inventory-card[data-item-id="${id}"]`);
    const icon = document.getElementById('desktopCartIcon');
    if (!card || !icon) return;

    console.log('🚀 Triggering desktop cart animation from item:', id);

    const cardRect = card.getBoundingClientRect();
    const iconRect = icon.getBoundingClientRect();

    // Create flying element
    const flyer = document.createElement('div');
    flyer.className = 'cashier-cart-flyer';
    flyer.style.position = 'fixed';
    flyer.style.width = '24px';
    flyer.style.height = '24px';
    flyer.style.borderRadius = '999px';
    flyer.style.background = 'linear-gradient(135deg, #4f46e5, #7c3aed)';
    flyer.style.boxShadow = '0 8px 25px rgba(79, 70, 229, 0.6)';
    flyer.style.opacity = '0.9';
    flyer.style.zIndex = '10000';
    flyer.style.left = `${cardRect.left + cardRect.width / 2 - 12}px`;
    flyer.style.top = `${cardRect.top + cardRect.height / 2 - 12}px`;
    flyer.style.transition = 'transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94), left 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94), top 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.6s ease';

    document.body.appendChild(flyer);

    // Animate to cart icon
    requestAnimationFrame(() => {
        flyer.style.left = `${iconRect.left + iconRect.width / 2 - 12}px`;
        flyer.style.top = `${iconRect.top + iconRect.height / 2 - 12}px`;
        flyer.style.transform = 'scale(0.2) rotate(360deg)';
        flyer.style.opacity = '0';
    });

    // Create "absorption" effect when flyer reaches cart icon
    setTimeout(() => {
        // Create absorption effect - item goes inside cart
        const absorptionEffect = document.createElement('div');
        absorptionEffect.style.position = 'fixed';
        absorptionEffect.style.left = `${iconRect.left + iconRect.width / 2 - 8}px`;
        absorptionEffect.style.top = `${iconRect.top + iconRect.height / 2 - 8}px`;
        absorptionEffect.style.width = '16px';
        absorptionEffect.style.height = '16px';
        absorptionEffect.style.borderRadius = '50%';
        absorptionEffect.style.background = 'radial-gradient(circle, rgba(79,70,229,0.8) 0%, rgba(79,70,229,0) 70%)';
        absorptionEffect.style.transform = 'scale(0)';
        absorptionEffect.style.opacity = '1';
        absorptionEffect.style.transition = 'transform 0.4s ease-out, opacity 0.4s ease-out';
        absorptionEffect.style.zIndex = '10001';
        absorptionEffect.style.pointerEvents = 'none';
        
        document.body.appendChild(absorptionEffect);
        
        // Animate absorption effect - expand and fade
        requestAnimationFrame(() => {
            absorptionEffect.style.transform = 'scale(3)';
            absorptionEffect.style.opacity = '0';
        });
        
        // Make cart icon "swallow" the item
        icon.style.transition = 'transform 0.3s ease-in-out';
        icon.style.transform = 'scale(1.2)';
        
        setTimeout(() => {
            icon.style.transform = 'scale(1)';
        }, 150);
        
        setTimeout(() => {
            icon.style.transform = 'scale(1.1)';
        }, 300);
        
        setTimeout(() => {
            icon.style.transform = 'scale(1)';
        }, 450);
        
        // Animate the desktop cart icon with random effect after absorption
        setTimeout(() => {
            if (icon && typeof animateCartIcon === 'function') {
                animateCartIcon(icon);
            }
        }, 500);
        
        // Remove absorption effect
        setTimeout(() => {
            if (absorptionEffect.parentNode) absorptionEffect.parentNode.removeChild(absorptionEffect);
        }, 400);
        
        // Remove flyer
        if (flyer.parentNode) flyer.parentNode.removeChild(flyer);
    }, 600);

    console.log('✅ Desktop cart animation completed');
}

function flashInventoryErrorBorder(id){
    const card = document.querySelector(`.inventory-card[data-item-id="${id}"]`);
    if (!card) return;
    card.classList.remove('inventory-card-error');
    // force reflow so the animation can restart
    // eslint-disable-next-line no-unused-expressions
    card.offsetWidth;
    card.classList.add('inventory-card-error');
    setTimeout(() => {
        card.classList.remove('inventory-card-error');
    }, 600);
}

function handleInventorySearch(e){
    currentSearchTerm = e.target.value || '';
    loadInventory();
}

function handleInventoryCategoryChange(e){
    currentCategoryFilter = e.target.value || 'all';
    loadInventory();
}

// --- Cart ---
async function openAddToCartPreview(id){
    const inventory = await getAllInventory();
    const invItem = inventory.find(i => i.id === id);
    if (!invItem) {
        showCashierNotification('Item not found in inventory.', 'danger', 4000);
        return;
    }

    const existing = cart.find(c => c.id === id);
    const qtyInCart = existing ? existing.qty : 0;
    const stockLeft = invItem.stock - qtyInCart;
    if (stockLeft <= 0) {
        flashInventoryErrorBorder(id);
        showCashierNotification('Cannot add. Item is out of stock.', 'warning', 4000);
        return;
    }

    pendingAddItem = {
        id: invItem.id,
        name: invItem.name,
        price: invItem.price,
        category: invItem.category,
        image: invItem.image || '',
        maxQty: stockLeft
    };

    const nameEl = document.getElementById('add-to-cart-name');
    const priceEl = document.getElementById('add-to-cart-price');
    const stockEl = document.getElementById('add-to-cart-stock');
    const imageEl = document.getElementById('add-to-cart-image');
    const qtyInput = document.getElementById('add-to-cart-qty');
    const statusEl = document.getElementById('add-to-cart-status');
    if (nameEl) nameEl.textContent = invItem.name || '';
    if (priceEl) priceEl.textContent = (invItem.price || 0).toFixed(2);
    if (stockEl) stockEl.textContent = stockLeft;
    if (imageEl) {
        if (invItem.image) {
            imageEl.src = invItem.image;
            imageEl.style.display = 'block';
        } else {
            imageEl.src = '';
            imageEl.style.display = 'none';
        }
    }
    if (qtyInput) {
        qtyInput.value = 1;
        qtyInput.min = 1;
        qtyInput.max = stockLeft;
    }

    if (statusEl) {
        if (stockLeft > 0 && stockLeft <= 5) {
            const msg = stockLeft === 1
                ? 'Low stock: only 1 item left.'
                : `Low stock: only ${stockLeft} items left.`;
            statusEl.textContent = msg;
            statusEl.style.display = 'block';
            statusEl.classList.remove('text-danger');
            statusEl.classList.add('text-warning');
        } else {
            statusEl.textContent = '';
            statusEl.style.display = 'none';
        }
    }

    const modalEl = document.getElementById('addToCartModal');
    if (modalEl && window.bootstrap) {
        const modal = new bootstrap.Modal(modalEl);
        modal.show();
    }
}

async function addToCart(id,name,price,cost,category, qty = 1){
    // Re-check inventory from DB to avoid overselling
    const inventory = await getAllInventory();
    const invItem = inventory.find(i=>i.id===id);
    if(!invItem){
        showCashierNotification('Item not found in inventory.', 'danger', 4000);
        return false;
    }

    const existing = cart.find(c=>c.id===id);
    const qtyInCart = existing ? existing.qty : 0;
    const stockLeft = invItem.stock - qtyInCart;
    if(stockLeft <= 0){
        flashInventoryErrorBorder(id);
        showCashierNotification('Cannot add. Item is out of stock.', 'warning', 4000);
        return false;
    }
    if (qty > stockLeft) {
        flashInventoryErrorBorder(id);
        showCashierNotification(`Cannot add ${qty}. Only ${stockLeft} in stock.`, 'warning', 4000);
        return false;
    }

    if(existing) existing.qty += qty;
    else cart.push({id,name,price,cost,category,qty});

    loadCart();
    await loadInventory();
    return true;
}

async function handleAddToCartProceed(){
    if (!pendingAddItem) return;

    const qtyInput = document.getElementById('add-to-cart-qty');
    const raw = qtyInput ? parseInt(qtyInput.value, 10) : 0;
    const qty = isNaN(raw) ? 0 : raw;
    const statusEl = document.getElementById('add-to-cart-status');

    if (statusEl) {
        statusEl.textContent = '';
        statusEl.style.display = 'none';
        statusEl.classList.remove('text-danger');
        statusEl.classList.add('text-warning');
    }

    if (!qty || qty <= 0) {
        if (statusEl) {
            statusEl.textContent = 'Please enter a valid quantity.';
            statusEl.style.display = 'block';
        }
        showCashierNotification('Please enter a valid quantity.', 'warning', 3000);
        return;
    }
    if (qty > pendingAddItem.maxQty) {
        if (statusEl) {
            statusEl.textContent = `Cannot add ${qty}. Only ${pendingAddItem.maxQty} in stock.`;
            statusEl.style.display = 'block';
            statusEl.classList.remove('text-warning');
            statusEl.classList.add('text-danger');
        }
        showCashierNotification(`Cannot add ${qty}. Only ${pendingAddItem.maxQty} in stock.`, 'warning', 4000);
        return;
    }

    const success = await addToCart(pendingAddItem.id, pendingAddItem.name, pendingAddItem.price, pendingAddItem.cost || 0, pendingAddItem.category, qty);

    // Trigger desktop cart animation on successful add
    if (success) {
        triggerDesktopCartAnimationFromItem(pendingAddItem.id);
    }

    const modalEl = document.getElementById('addToCartModal');
    if (modalEl && window.bootstrap) {
        const instance = bootstrap.Modal.getInstance(modalEl);
        if (instance) instance.hide();
    }

    pendingAddItem = null;
}

function updateChangeDisplay(){
    const amountInput = document.getElementById('amount-given');
    const changeSpan = document.getElementById('change-amount');
    const totalEl = document.getElementById('cart-total');
    if (!amountInput || !changeSpan || !totalEl) return;
    const total = parseFloat(totalEl.textContent || '0') || 0;
    const given = parseFloat(amountInput.value || '0') || 0;
    const change = given - total;
    changeSpan.textContent = change > 0 ? change.toFixed(2) : '0.00';
}

function loadCart(){
    const tbody = document.querySelector('#cart-table tbody');
    if (!tbody) return;
    tbody.innerHTML='';
    cart.forEach((c,i)=>{
        const row = `<tr data-index="${i}">
            <td class="text-start">${c.name}</td>
            <td class="text-end">₱${c.price.toFixed(2)}</td>
            <td class="text-center">
                <div class="d-inline-flex align-items-center justify-content-center gap-1">
                    <button type="button" class="btn btn-outline-secondary btn-sm cart-qty-decrease" data-index="${i}">-</button>
                    <span>${c.qty}</span>
                    <button type="button" class="btn btn-outline-secondary btn-sm cart-qty-increase" data-index="${i}">+</button>
                </div>
            </td>
            <td class="text-end">₱${(c.price*c.qty).toFixed(2)}</td>
        </tr>`;
        tbody.insertAdjacentHTML('beforeend', row);
    });
    const total = cart.reduce((sum,c)=>sum+c.price*c.qty,0);
    document.getElementById('cart-total').textContent = total.toFixed(2);
    updateChangeDisplay();
    updateMobileCartBadge();
}

function updateMobileCartBadge(){
    // Update mobile cart badge
    const mobileBadge = document.getElementById('mobileCartCount');
    const count = cart.reduce((sum, c) => sum + (c.qty || 0), 0);
    
    if (mobileBadge) {
        if (count > 0) {
            mobileBadge.textContent = String(count);
            mobileBadge.style.visibility = 'visible';
        } else {
            mobileBadge.textContent = '0';
            mobileBadge.style.visibility = 'hidden';
        }
    }
    
    // Update desktop cart badge
    const desktopBadge = document.getElementById('desktopCartCount');
    if (desktopBadge) {
        if (count > 0) {
            desktopBadge.textContent = String(count);
            desktopBadge.style.visibility = 'visible';
        } else {
            desktopBadge.textContent = '0';
            desktopBadge.style.visibility = 'hidden';
        }
    }
}

// Cart icon animation function with multiple effects
function animateCartIcon(icon) {
    if (!icon) return;
    
    console.log('🎨 Animating cart icon...');
    
    // Randomly choose animation effect
    const animations = ['pulse', 'bounce', 'shake', 'rotate'];
    const randomAnimation = animations[Math.floor(Math.random() * animations.length)];
    
    switch(randomAnimation) {
        case 'pulse':
            animatePulse(icon);
            break;
        case 'bounce':
            animateBounce(icon);
            break;
        case 'shake':
            animateShake(icon);
            break;
        case 'rotate':
            animateRotate(icon);
            break;
    }
}

function animatePulse(icon) {
    icon.style.transition = 'transform 0.15s ease-in-out';
    icon.style.transform = 'scale(1.3)';
    
    setTimeout(() => {
        icon.style.transform = 'scale(1)';
    }, 150);
    
    setTimeout(() => {
        icon.style.transform = 'scale(1.2)';
    }, 300);
    
    setTimeout(() => {
        icon.style.transform = 'scale(1)';
    }, 450);
    
    console.log('💫 Cart icon animated with pulse effect');
}

function animateBounce(icon) {
    icon.style.transition = 'transform 0.2s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
    icon.style.transform = 'translateY(-8px) scale(1.1)';
    
    setTimeout(() => {
        icon.style.transform = 'translateY(0) scale(1)';
    }, 200);
    
    setTimeout(() => {
        icon.style.transform = 'translateY(-4px) scale(1.05)';
    }, 400);
    
    setTimeout(() => {
        icon.style.transform = 'translateY(0) scale(1)';
    }, 600);
    
    console.log('🎾 Cart icon animated with bounce effect');
}

function animateShake(icon) {
    icon.style.transition = 'transform 0.05s ease-in-out';
    let shakes = 0;
    const shakeInterval = setInterval(() => {
        if (shakes % 2 === 0) {
            icon.style.transform = 'translateX(-4px) rotate(-2deg)';
        } else {
            icon.style.transform = 'translateX(4px) rotate(2deg)';
        }
        shakes++;
        
        if (shakes >= 8) {
            clearInterval(shakeInterval);
            icon.style.transform = 'translateX(0) rotate(0)';
        }
    }, 50);
    
    console.log('🫨 Cart icon animated with shake effect');
}

function animateRotate(icon) {
    icon.style.transition = 'transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
    icon.style.transform = 'rotate(360deg) scale(1.2)';
    
    setTimeout(() => {
        icon.style.transform = 'rotate(0) scale(1)';
    }, 300);
    
    console.log('🌀 Cart icon animated with rotate effect');
}

function removeFromCart(index){
    cart.splice(index,1);
    loadCart();
    loadInventory();
}

function changeCartQuantity(index, delta){
    const item = cart[index];
    if (!item) return;
    const currentQty = item.qty || 0;
    const newQty = currentQty + delta;
    if (newQty <= 0) {
        removeFromCart(index);
        return;
    }
    item.qty = newQty;
    loadCart();
    loadInventory();
}

document.addEventListener('DOMContentLoaded', () => {
    const barcodeInput = document.getElementById('barcode-input');
    if (barcodeInput) {
        // Handle barcode input
        barcodeInput.addEventListener('keypress', async (e) => {
            if (e.key === 'Enter') {
                const barcode = barcodeInput.value.trim();
                if (barcode) {
                    await handleBarcodeScan(barcode);
                    barcodeInput.value = '';
                }
            }
        });
        
        // Auto-focus on barcode input if scanner is connected and auto-focus is enabled
        if (window.hardwareManager && window.hardwareManager.devices.scanner.connected && window.hardwareManager.devices.scanner.autoFocus) {
            setInterval(() => {
                if (document.activeElement !== barcodeInput && !isUserTyping()) {
                    barcodeInput.focus();
                }
            }, 2000);
        }
    }
});

// Handle barcode scan
async function handleBarcodeScan(barcode) {
    try {
        // Look up item by barcode in inventory
        const inventory = await getAllInventory();
        const item = inventory.find(i => i.barcode === barcode || i.id === barcode || i.name.toLowerCase().includes(barcode.toLowerCase()));
        
        if (item) {
            if (item.stock > 0) {
                // Add item to cart
                addToCart(item.id, item.name, item.price, item.cost || 0, item.category, 1);
                
                // Play beep if enabled
                if (window.hardwareManager && window.hardwareManager.settings.scannerBeep) {
                    window.hardwareManager.playBeep();
                }
                
                // Update scanner last used
                if (window.hardwareManager) {
                    window.hardwareManager.devices.scanner.lastUsed = new Date().toISOString();
                    window.hardwareManager.saveSettings();
                }
                
                showCashierNotification(`Added: ${item.name}`, 'success', 2000);
            } else {
                showCashierNotification(`Item "${item.name}" is out of stock`, 'warning', 3000);
            }
        } else {
            showCashierNotification(`Item not found for barcode: ${barcode}`, 'warning', 3000);
        }
    } catch (error) {
        console.error('Barcode scan error:', error);
        showCashierNotification('Error processing barcode', 'danger', 3000);
    }
}

// Check if user is actively typing in other inputs
function isUserTyping() {
    const activeElement = document.activeElement;
    return activeElement && (
        activeElement.tagName === 'INPUT' || 
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.contentEditable === 'true'
    ) && activeElement.id !== 'barcode-input';
}

// Manual receipt printing function
async function printReceiptManually() {
    if (!window.hardwareManager || !window.hardwareManager.devices.printer.connected) {
        showCashierNotification('Printer is not connected', 'warning', 3000);
        return;
    }
    
    // Get last sale for receipt printing
    const sales = await getAllSales();
    if (sales.length === 0) {
        showCashierNotification('No sales to print', 'warning', 3000);
        return;
    }
    
    const lastSale = sales[0];
    const receiptData = {
        date: lastSale.date,
        items: lastSale.items || [],
        total: lastSale.total || 0,
        given: lastSale.given || 0,
        change: lastSale.change || 0,
        saleId: lastSale.id || `SALE-${Date.now()}`
    };
    
    window.hardwareManager.printReceipt(receiptData);
}

// Manual cash drawer opening function
function openCashDrawerManually() {
    if (!window.hardwareManager || !window.hardwareManager.devices.cashdrawer.connected) {
        showCashierNotification('Cash drawer is not connected', 'warning', 3000);
        return;
    }
    
    window.hardwareManager.openCashDrawer();
}

// Make functions globally accessible
window.handleBarcodeScan = handleBarcodeScan;
window.printReceiptManually = printReceiptManually;
window.openCashDrawerManually = openCashDrawerManually;

function voidSelected(){
    // Clear the entire current cart (whole transaction before checkout)
    if (cart.length === 0) {
        showCashierNotification('Cart is already empty.', 'warning', 3000);
        return;
    }
    const confirmVoid = confirm('Clear current cart?');
    if (!confirmVoid) return;

    cart = [];
    loadCart();
    loadInventory();
    showCashierNotification('Cart has been cleared.', 'info', 3000);
    
    // Refresh Business Insights and Net Sale/Gross Sale if analytics modal is open
    refreshBusinessInsightsIfOpen();
    
    // Also refresh Net Sale and Gross Sale if they're visible
    refreshNetAndGrossSales();
}

// --- Checkout ---
async function checkout(){
    if(cart.length===0){
        showCashierNotification('Cart is empty.', 'warning', 3000);
        return;
    }

    // Verify inventory has enough stock for each cart item
    const inventory = await getAllInventory();
    for(const c of cart){
        const invItem = inventory.find(i=>i.id===c.id);
        if(!invItem){
            showCashierNotification(`Item "${c.name}" no longer exists in inventory.`, 'danger', 4000);
            return;
        }
        if(c.qty > invItem.stock){
            showCashierNotification(`Cannot checkout. "${c.name}" has only ${invItem.stock} in stock.`, 'warning', 4000);
            return;
        }
    }

    const total = cart.reduce((sum,c)=>sum+c.price*c.qty,0);
    const amountInput = document.getElementById('amount-given');
    let given = 0;
    let change = 0;
    if (amountInput) {
        const raw = parseFloat(amountInput.value || '0') || 0;
        given = raw;
        if (!amountInput.value || given <= 0) {
            showCashierNotification('Please enter the amount given before checkout.', 'warning', 4000);
            return;
        }
        if (given < total) {
            showCashierNotification(`Given amount (₱${given.toFixed(2)}) is less than total (₱${total.toFixed(2)}).`, 'warning', 4000);
            return;
        }
        change = given - total;
    }

    const date = new Date().toISOString();
    
    // Calculate profit for each item and total profit
    const itemsWithProfit = cart.map(c => ({
        id: c.id,
        name: c.name,
        price: c.price,
        cost: c.cost || 0,
        qty: c.qty,
        category: c.category,
        profit: (c.price - (c.cost || 0)) * c.qty
    }));
    
    const totalProfit = itemsWithProfit.reduce((sum, item) => sum + item.profit, 0);
    
    await addSale({ date, items: itemsWithProfit, total, profit: totalProfit, given, change });

    // Apply stock deduction in DB
    for(const c of cart){
        const invItem = inventory.find(i=>i.id===c.id);
        if(invItem){
            invItem.stock -= c.qty;
            await updateInventoryStock(c.id, invItem.stock);
        }
    }

    await addAuditLog({ date, action:'Cashier checked out items'});

    // Try to send the sale to the local print server (optional, non-blocking)
    const salePayload = {
        date,
        total,
        profit: totalProfit,
        given,
        change,
        items: itemsWithProfit
    };
    sendSaleToPrintServer(salePayload).catch(err => {
        console.error('Print server error', err);
    });

    // Build a detailed success message before clearing the cart
    let successMessage = 'Checkout completed successfully.';
    if (given > 0) {
        const itemsSummary = cart.map(c => `${c.qty}× ${c.name}`).join(', ');
        const changeDisplay = change >= 0 ? change.toFixed(2) : '0.00';
        successMessage = `Checkout completed. Paid ₱${given.toFixed(2)}, Total ₱${total.toFixed(2)}, Change ₱${changeDisplay}. Items: ${itemsSummary}`;
    }

    cart=[];
    loadCart();
    if (amountInput) {
        amountInput.value = '';
        updateChangeDisplay();
    }
    await loadInventory();
    await loadSalesHistory();
    
    // Hardware Integration: Auto-open cash drawer and print receipt
    if (window.hardwareManager) {
        // Auto-open cash drawer based on settings
        const autoOpenSetting = window.hardwareManager.settings.autoOpenCashdrawer;
        const shouldOpenDrawer = autoOpenSetting === 'always' || 
                                (autoOpenSetting === 'cash-only' && given > 0);
        
        if (shouldOpenDrawer) {
            setTimeout(() => {
                window.hardwareManager.openCashDrawer();
            }, 1000);
        }
        
        // ALWAYS auto-print receipt when checkout is clicked
        setTimeout(() => {
            const receiptData = {
                date,
                items: cart,
                total,
                given,
                change,
                saleId: `SALE-${Date.now()}`
            };
            window.hardwareManager.printReceipt(receiptData);
        }, 1500);
    }
    
    showCashierNotification(successMessage, 'success', 4000);
}

async function sendSaleToPrintServer(sale){
    if (!PRINT_SERVER_URL) return;
    try {
        const response = await fetch(PRINT_SERVER_URL + '/print-receipt', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ sale })
        });

        if (!response.ok) {
            console.warn('Print server responded with status', response.status);
            showCashierNotification('Checkout saved, but printing failed. Please check the print server.', 'warning', 3500);
        }
    } catch (err) {
        console.error('Failed to reach print server', err);
        showCashierNotification('Checkout saved, but printer is offline or unreachable.', 'warning', 3500);
    }
}

// --- Done Shift ---
async function doneShift(){
    const confirmShift = confirm('Mark this shift as done?');
    if (!confirmShift) return;

    const date = new Date().toISOString();
    await addAuditLog({ date, action:'Cashier finished shift'});
    showCashierNotification('Shift marked as done and recorded in admin audit logs.', 'info', 3500);
}

// --- Sales History ---
async function openVoidSaleItemModal(){
    const list = document.getElementById('void-sale-item-list');
    const searchInput = document.getElementById('void-sale-search');
    const selectAllCheckbox = document.getElementById('select-all-void-items');
    const selectionCount = document.getElementById('void-selection-count');
    const modalEl = document.getElementById('voidSaleItemModal');
    if (!list || !modalEl) return;

    // Clear previous items and reset selection
    list.innerHTML = '';
    if (selectAllCheckbox) selectAllCheckbox.checked = false;
    if (selectionCount) selectionCount.textContent = '0 items selected';

    const sales = await getAllSales();
    sales.sort((a,b)=> new Date(b.date) - new Date(a.date));

    const entries = [];
    sales.forEach(s => {
        if (!s.items) return;
        const d = s.date ? new Date(s.date) : null;
        const formatted = d && !isNaN(d)
            ? d.toLocaleString(undefined, {
                year: 'numeric', month: 'short', day: '2-digit',
                hour: 'numeric', minute: '2-digit', hour12: true
            })
            : (s.date || '');

        s.items.forEach((i, index) => {
            if (i.voided) return; // Skip already voided items
            const label = `${i.qty}× ${i.name} · ${i.category || ''} · ₱${(i.price || 0).toFixed(2)} · ${formatted}`;
            entries.push({ saleId: s.id, itemIndex: index, label, item: i });
        });
    });

    if (entries.length === 0) {
        showCashierNotification('No sale items available to void.', 'info', 3500);
        return;
    }

    entries.forEach(entry => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'list-group-item list-group-item-action d-flex justify-content-between align-items-center';
        itemDiv.style.cursor = 'pointer';
        
        // Create checkbox for multi-select
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'form-check-input me-2';
        checkbox.dataset.saleId = entry.saleId;
        checkbox.dataset.itemIndex = entry.itemIndex;
        checkbox.dataset.selected = 'false';
        
        // Create label content
        const labelSpan = document.createElement('span');
        labelSpan.className = 'flex-grow-1';
        labelSpan.textContent = entry.label;
        
        // Add price badge
        const priceBadge = document.createElement('span');
        priceBadge.className = 'badge bg-primary ms-2';
        priceBadge.textContent = `₱${((entry.item.price || 0) * (entry.item.qty || 0)).toFixed(2)}`;
        
        itemDiv.appendChild(checkbox);
        itemDiv.appendChild(labelSpan);
        itemDiv.appendChild(priceBadge);
        
        // Add click handler for checkbox
        checkbox.addEventListener('change', () => {
            checkbox.dataset.selected = checkbox.checked ? 'true' : 'false';
            updateVoidSelectionCount();
            updateSelectAllCheckbox();
        });
        
        // Add click handler for row (toggle checkbox)
        itemDiv.addEventListener('click', (e) => {
            if (e.target !== checkbox) {
                checkbox.checked = !checkbox.checked;
                checkbox.dataset.selected = checkbox.checked ? 'true' : 'false';
                updateVoidSelectionCount();
                updateSelectAllCheckbox();
            }
        });
        
        list.appendChild(itemDiv);
    });

    // Add select all functionality
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', () => {
            const checkboxes = list.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach(cb => {
                cb.checked = selectAllCheckbox.checked;
                cb.dataset.selected = selectAllCheckbox.checked ? 'true' : 'false';
            });
            updateVoidSelectionCount();
        });
    }

    if (searchInput) {
        searchInput.value = '';
        searchInput.oninput = () => {
            const term = searchInput.value.toLowerCase();
            Array.from(list.children).forEach(itemDiv => {
                const label = itemDiv.querySelector('span').textContent.toLowerCase();
                itemDiv.style.display = label.includes(term) ? '' : 'none';
            });
        };
    }

    const modal = new bootstrap.Modal(modalEl);
    modal.show();
}

// Update selection count display
function updateVoidSelectionCount() {
    const list = document.getElementById('void-sale-item-list');
    const selectionCount = document.getElementById('void-selection-count');
    if (!list || !selectionCount) return;
    
    const checkboxes = list.querySelectorAll('input[type="checkbox"]:checked');
    const count = checkboxes.length;
    selectionCount.textContent = `${count} item${count !== 1 ? 's' : ''} selected`;
}

// Update select all checkbox state
function updateSelectAllCheckbox() {
    const list = document.getElementById('void-sale-item-list');
    const selectAllCheckbox = document.getElementById('select-all-void-items');
    if (!list || !selectAllCheckbox) return;
    
    const checkboxes = list.querySelectorAll('input[type="checkbox"]');
    const checkedBoxes = list.querySelectorAll('input[type="checkbox"]:checked');
    
    if (checkboxes.length === 0) {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = false;
    } else if (checkedBoxes.length === checkboxes.length) {
        selectAllCheckbox.checked = true;
        selectAllCheckbox.indeterminate = false;
    } else if (checkedBoxes.length > 0) {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = true;
    } else {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = false;
    }
}

async function confirmVoidSaleItemFromModal(){
    const list = document.getElementById('void-sale-item-list');
    const modalEl = document.getElementById('voidSaleItemModal');
    if (!list) return;

    const selectedCheckboxes = list.querySelectorAll('input[type="checkbox"]:checked');
    if (selectedCheckboxes.length === 0) {
        showCashierNotification('Please select at least one item to void.', 'warning', 3000);
        return;
    }

    // Get selected items data
    const selectedItems = [];
    selectedCheckboxes.forEach(checkbox => {
        const saleId = parseInt(checkbox.dataset.saleId, 10);
        const itemIndex = parseInt(checkbox.dataset.itemIndex, 10);
        if (!isNaN(saleId) && !isNaN(itemIndex)) {
            selectedItems.push({ saleId, itemIndex });
        }
    });

    if (selectedItems.length === 0) {
        showCashierNotification('Invalid selection.', 'danger', 3000);
        return;
    }

    // Highlight selected rows in the table
    const tbody = document.querySelector('#sales-history-table tbody');
    if (tbody) {
        Array.from(tbody.querySelectorAll('tr')).forEach(r => r.classList.remove('table-active'));
        selectedItems.forEach(({ saleId, itemIndex }) => {
            const row = tbody.querySelector(`tr[data-sale-id="${saleId}"][data-item-index="${itemIndex}"]`);
            if (row) {
                row.classList.add('table-active');
            }
        });
    }

    if (modalEl && window.bootstrap) {
        const instance = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
        instance.hide();
    }

    await handleVoidMultipleSaleItems(selectedItems);
}

async function handleVoidMultipleSaleItems(selectedItems){
    if (!selectedItems || selectedItems.length === 0) {
        showCashierNotification('No items selected for voiding.', 'warning', 3500);
        return;
    }

    // Confirm void operation
    const confirmVoid = confirm(`Void ${selectedItems.length} selected item${selectedItems.length !== 1 ? 's' : ''}?\n\nThis will:\n• Auto-return quantities to inventory\n• Reverse sales data\n• Update analytics\n• Record audit logs`);
    if (!confirmVoid) return;

    let reason = prompt('Reason for void (optional):', '');
    if (reason === null) {
        return; // User cancelled
    }
    reason = reason.trim();

    const voidDate = new Date().toISOString();
    const results = {
        successful: [],
        failed: [],
        totalRestocked: 0,
        totalValue: 0
    };

    try {
        // Process each selected item
        for (const { saleId, itemIndex } of selectedItems) {
            try {
                const result = await voidSingleSaleItem(saleId, itemIndex, reason, voidDate);
                if (result.success) {
                    results.successful.push(result);
                    results.totalRestocked += result.quantityRestocked;
                    results.totalValue += result.totalValue;
                } else {
                    results.failed.push(result);
                }
            } catch (error) {
                console.error(`Failed to void item (Sale ID: ${saleId}, Item Index: ${itemIndex}):`, error);
                results.failed.push({
                    saleId,
                    itemIndex,
                    error: error.message
                });
            }
        }

        // Refresh all relevant data
        await Promise.all([
            loadInventory(),
            loadSalesHistory(),
            refreshNetAndGrossSales(),
            refreshBusinessInsightsIfOpen()
        ]);

        // Show comprehensive result notification
        const successCount = results.successful.length;
        const failCount = results.failed.length;
        
        if (failCount === 0) {
            // All successful
            const when = new Date(voidDate).toLocaleString();
            const reasonPart = reason ? ` Reason: ${reason}.` : '';
            showCashierNotification(
                `Successfully voided ${successCount} item${successCount !== 1 ? 's' : ''}. ` +
                `Restocked: ${results.totalRestocked} units. ` +
                `Value: ₱${results.totalValue.toFixed(2)}. ` +
                `Time: ${when}.${reasonPart}`, 
                'success', 6000
            );
        } else if (successCount > 0) {
            // Partial success
            showCashierNotification(
                `Partially completed: ${successCount} item${successCount !== 1 ? 's' : ''} voided successfully, ` +
                `${failCount} failed. Restocked: ${results.totalRestocked} units. ` +
                `Value: ₱${results.totalValue.toFixed(2)}.`, 
                'warning', 6000
            );
        } else {
            // All failed
            showCashierNotification(
                `Failed to void all ${failCount} selected items. Please try again.`,
                'danger', 4000
            );
        }

        // Trigger admin panel updates for successful voids
        if (results.successful.length > 0) {
            triggerAdminVoidSync({
                action: 'multiple_items_voided',
                items: results.successful,
                reason: reason,
                date: voidDate,
                totalItems: results.successful.length,
                totalValue: results.totalValue
            });
        }

    } catch (error) {
        console.error('Failed to void multiple items:', error);
        showCashierNotification('Failed to void items. Please try again.', 'danger', 4000);
    }
}

// Helper function to void a single sale item
async function voidSingleSaleItem(saleId, itemIndex, reason, voidDate) {
    const sales = await getAllSales();
    const sale = sales.find(s => s.id === saleId);
    if (!sale || !sale.items || !sale.items[itemIndex]) {
        throw new Error('Sale item not found');
    }

    const lineItem = sale.items[itemIndex];
    if (lineItem.voided) {
        throw new Error('Item already voided');
    }

    // Auto-return stock to inventory
    const inventory = await getAllInventory();
    const invItem = inventory.find(i => i.id === lineItem.id);
    let quantityRestocked = 0;
    
    if (invItem) {
        quantityRestocked = lineItem.qty || 0;
        const newStock = (invItem.stock || 0) + quantityRestocked;
        await updateInventoryStock(invItem.id, newStock);
    }

    // Mark the line item as voided
    sale.items[itemIndex] = Object.assign({}, lineItem, {
        voided: true,
        voidReason: reason,
        voidDate
    });

    await updateSale(sale);

    // Record audit log
    await addAuditLog({
        date: voidDate,
        action: `Cashier voided sale item: ${lineItem.qty}× ${lineItem.name} (reason: ${reason || 'n/a'})`
    });

    return {
        success: true,
        saleId,
        itemIndex,
        itemName: lineItem.name,
        quantity: lineItem.qty,
        quantityRestocked,
        totalValue: (lineItem.price || 0) * (lineItem.qty || 0),
        reason
    };
}

// Trigger real-time admin panel update via storage event
function triggerAdminVoidSync(voidData) {
    try {
        // Use localStorage to trigger storage events in other tabs (including admin panel)
        const syncKey = 'void_operation_sync';
        const syncData = {
            ...voidData,
            timestamp: Date.now(),
            source: 'cashier'
        };
        
        localStorage.setItem(syncKey, JSON.stringify(syncData));
        
        // Remove after a short delay to allow other tabs to process
        setTimeout(() => {
            localStorage.removeItem(syncKey);
        }, 1000);
        
        console.log('📡 Triggered admin void sync:', voidData);
        
    } catch (error) {
        console.error('❌ Failed to trigger admin void sync:', error);
    }
}

// Refresh Business Insights if analytics modal is open
function refreshBusinessInsightsIfOpen() {
    try {
        // Check if analytics modal is open
        const analyticsModal = document.getElementById('analyticsModal');
        if (analyticsModal && analyticsModal.classList.contains('show')) {
            console.log('🔄 Refreshing Business Insights after operation...');
            
            // Get the current selected date
            const selectedDate = document.getElementById('analytics-date-picker')?.value;
            if (selectedDate && typeof loadDateSpecificAnalytics === 'function') {
                // Refresh the analytics for the current date
                loadDateSpecificAnalytics(selectedDate);
                console.log('✅ Business Insights refreshed automatically');
            } else {
                // Refresh analytics without date filter
                refreshAnalyticsData();
            }
        }
    } catch (error) {
        console.error('❌ Error refreshing Business Insights:', error);
    }
}

// Calculate Net Profit for analytics
async function calculateAnalyticsNetProfit(selectedDate = null) {
    try {
        const sales = await getAllSales();
        const expenses = await getAllJournalEntries(); // Get expenses
        const inventory = await getAllInventory(); // Get inventory to fetch actual costs
        let totalProfit = 0;
        let totalGross = 0;
        let totalCosts = 0;
        let totalExpenses = 0;
        
        // Calculate REMAINING expenses for the selected date (committed - paid)
        console.log('🔍 calculateAnalyticsNetProfit: Calculating REMAINING expenses (committed - paid)');
        console.log(`   - Selected Date: ${selectedDate}`);
        
        expenses.forEach(expense => {
            if (expense.type === 'expense') {
                const expenseDate = new Date(expense.date).toISOString().split('T')[0];
                
                // Filter by selected date if provided
                if (selectedDate && expenseDate !== selectedDate) return;
                
                // Calculate total committed amount
                const totalCommitted = (expense.cash || 0) + (expense.gcash || 0);
                
                // Calculate total paid amount
                let totalPaid = 0;
                if (expense.partialPayments && expense.partialPayments.length > 0) {
                    totalPaid = expense.partialPayments.reduce((sum, payment) => sum + payment.amount, 0);
                } else if (expense.paidAmount > 0) {
                    totalPaid = expense.paidAmount;
                }
                
                // Calculate remaining amount (committed - paid)
                const remainingAmount = totalCommitted - totalPaid;
                
                if (remainingAmount > 0) {
                    console.log(`   - Adding remaining expense: ₱${remainingAmount} for "${expense.description}" (committed: ₱${totalCommitted}, paid: ₱${totalPaid})`);
                    totalExpenses += remainingAmount;
                } else {
                    console.log(`   - Skipping fully paid expense: "${expense.description}" (committed: ₱${totalCommitted}, paid: ₱${totalPaid}, remaining: ₱${remainingAmount})`);
                }
            }
        });
        
        console.log(`   - Total REMAINING Expenses: ₱${totalExpenses.toFixed(2)}`);
        
        sales.forEach(sale => {
            const saleDate = new Date(sale.date).toISOString().split('T')[0];
            
            // Filter by selected date if provided
            if (selectedDate && saleDate !== selectedDate) return;
            
            // Calculate gross, costs, and profit for this sale
            const saleGross = sale.items.reduce((sum, item) => {
                if (!item.voided) {
                    return sum + (item.price * item.qty);
                }
                return sum;
            }, 0);
            
            const saleCosts = sale.items.reduce((sum, item) => {
                if (!item.voided) {
                    // Get actual cost from inventory
                    const inventoryItem = inventory.find(inv => inv.id === item.id);
                    const actualCost = inventoryItem ? (inventoryItem.cost || 0) : (item.cost || 0);
                    return sum + (actualCost * item.qty);
                }
                return sum;
            }, 0);
            
            const saleProfit = saleGross - saleCosts;
            
            totalGross += saleGross;
            totalCosts += saleCosts;
            totalProfit += saleProfit;
        });
        
        console.log(`💰 Analytics Net Profit Calculation for ${selectedDate || 'all dates'}:`);
        console.log(`   - Gross Sales: ₱${totalGross.toFixed(2)}`);
        console.log(`   - Total Costs: ₱${totalCosts.toFixed(2)}`);
        console.log(`   - Total Remaining Expenses: ₱${totalExpenses.toFixed(2)}`);
        console.log(`   - Net Profit Formula: Sales - Cost - Expenses`);
        console.log(`   - Net Profit: ₱${totalGross.toFixed(2)} - ₱${totalCosts.toFixed(2)} - ₱${totalExpenses.toFixed(2)} = ₱${totalProfit.toFixed(2)}`);
        console.log(`   - Profit Margin: ${(totalGross > 0 ? (totalProfit / totalGross * 100) : 0).toFixed(1)}%`);
        console.log(`   - Net Profit updates automatically when expenses change`);
        
        return {
            profit: totalProfit,
            gross: totalGross,
            costs: totalCosts,
            expenses: totalExpenses,
            margin: totalGross > 0 ? (totalProfit / totalGross * 100) : 0
        };
    } catch (error) {
        console.error('Error calculating analytics net profit:', error);
        return { profit: 0, gross: 0, costs: 0, expenses: 0, margin: 0 };
    }
}

// Refresh analytics data with Net Profit
async function refreshAnalyticsData() {
    try {
        const selectedDate = document.getElementById('analytics-date-picker')?.value;
        const analytics = await calculateAnalyticsNetProfit(selectedDate);
        
        // Update analytics display
        const netProfitEl = document.getElementById('analytics-net-profit');
        const totalExpensesEl = document.getElementById('analytics-total-expenses');
        const grossSalesEl = document.getElementById('analytics-gross-sales');
        const totalCostsEl = document.getElementById('analytics-total-costs');
        const grossProfitEl = document.getElementById('analytics-gross-profit');
        const profitMarginEl = document.getElementById('analytics-profit-margin');
        
        // Calculate Gross Profit = Total Sales - Cost
        const grossProfit = analytics.gross - analytics.costs;
        
        // Calculate Net Profit = Sales - Cost - Expenses (YOUR FORMULA)
        const netProfit = analytics.gross - analytics.costs - analytics.expenses;
        
        if (netProfitEl) netProfitEl.textContent = netProfit.toFixed(2);
        if (totalExpensesEl) totalExpensesEl.textContent = analytics.expenses.toFixed(2);
        if (grossSalesEl) grossSalesEl.textContent = analytics.gross.toFixed(2);
        if (totalCostsEl) totalCostsEl.textContent = analytics.costs.toFixed(2);
        if (grossProfitEl) grossProfitEl.textContent = grossProfit.toFixed(2);
        if (profitMarginEl) profitMarginEl.textContent = analytics.margin.toFixed(1);
        
        console.log('✅ Analytics data refreshed with Net Profit and Remaining Expenses:');
        console.log(`   - Net Profit Card: ₱${netProfit.toFixed(2)} (Sales - Cost - Expenses)`);
        console.log(`   - Formula: ₱${analytics.gross.toFixed(2)} - ₱${analytics.costs.toFixed(2)} - ₱${analytics.expenses.toFixed(2)} = ₱${netProfit.toFixed(2)}`);
        console.log(`   - Expense Card now shows: ₱${analytics.expenses.toFixed(2)} (committed - paid = remaining)`);
        console.log(`   - Net Profit updates automatically when expenses change`);
    } catch (error) {
        console.error('❌ Error refreshing analytics data:', error);
    }
}

// Refresh Net Sale and Gross Sale calculations
async function refreshNetAndGrossSales() {
    try {
        console.log('🔄 Refreshing Net Sale and Gross Sale calculations...');
        
        // Get current selected dates
        const grossDate = document.getElementById('gross-sale-date')?.value || new Date().toISOString().split('T')[0];
        const netDate = document.getElementById('net-sale-date')?.value || new Date().toISOString().split('T')[0];
        
        console.log(`📅 Refreshing - Gross Sale: ${grossDate}, Net Sale: ${netDate}`);
        
        // Refresh Gross Sale if function exists
        if (typeof loadGrossSale === 'function') {
            await loadGrossSale(grossDate);
            console.log('✅ Gross Sale refreshed');
        }
        
        // Refresh Net Sale if function exists
        if (typeof loadNetSale === 'function') {
            await loadNetSale(netDate);
            console.log('✅ Net Sale refreshed');
        }
        
        console.log('✅ Net Sale and Gross Sale calculations updated');
        
    } catch (error) {
        console.error('❌ Error refreshing Net Sale and Gross Sale:', error);
    }
}

async function loadSalesHistory(){
    const sales = await getAllSales();
    sales.sort((a,b)=> new Date(b.date) - new Date(a.date));
    const tbody = document.querySelector('#sales-history-table tbody');
    if (!tbody) return;
    tbody.innerHTML='';
    sales.forEach(s=>{
        if (!s.items) return;
        s.items.forEach((i, index)=>{
            const d = s.date ? new Date(s.date) : null;
            let dateCellHtml = s.date || '';
            if (d && !isNaN(d)) {
                const datePart = d.toLocaleDateString(undefined, {
                    year: 'numeric', month: 'short', day: '2-digit'
                });
                const timePart = d.toLocaleTimeString(undefined, {
                    hour: 'numeric', minute: '2-digit', hour12: true
                });
                dateCellHtml = `<span class="sales-date-main">${datePart}</span><span class="sales-date-sub">${timePart}</span>`;
            }

            const paidDisplay = (typeof s.given === 'number' && !isNaN(s.given))
                ? s.given.toFixed(2)
                : '-';
            const changeDisplay = (typeof s.change === 'number' && !isNaN(s.change))
                ? s.change.toFixed(2)
                : '-';

            const isVoided = !!i.voided;
            const nameCell = isVoided
                ? `${i.name} <span class="badge bg-secondary ms-1">VOIDED</span>`
                : i.name;
            const rowClass = isVoided ? 'sales-history-voided' : '';

            const row = `
                <tr class="${rowClass}" data-sale-id="${s.id}" data-item-index="${index}">
                    <td>${nameCell}</td>
                    <td>${i.price}</td>
                    <td>${i.qty}</td>
                    <td>${i.category}</td>
                    <td>${paidDisplay}</td>
                    <td>${changeDisplay}</td>
                    <td class="sales-history-date">${dateCellHtml}</td>
                </tr>`;
            tbody.insertAdjacentHTML('beforeend', row);
        });
    });
}

function setupSalesHistorySelection(){
    const tbody = document.querySelector('#sales-history-table tbody');
    if (!tbody) return;
    tbody.addEventListener('click', (e)=>{
        const row = e.target.closest('tr');
        if (!row) return;
        Array.from(tbody.querySelectorAll('tr')).forEach(r=>r.classList.remove('table-active'));
        row.classList.add('table-active');
    });
}

// --- Expenses ---
async function addExpense(e){
    e.preventDefault();
    const description = document.getElementById('expense-desc').value;
    const cash = parseFloat(document.getElementById('expense-cash').value) || 0;
    const date = new Date().toISOString();
    await addJournalEntry({ type:'expense', date, description, cash });
    await addAuditLog({ date, action:`Cashier added expense: ${description}` });
    e.target.reset();
    showCashierNotification('Expense added successfully.', 'success', 3000);
    
    // Refresh Business Insights if analytics modal is open
    refreshBusinessInsightsIfOpen();
    
    // Also refresh Net Sale and Gross Sale (Net Sale is affected by expenses)
    refreshNetAndGrossSales();
    
    // Send message to admin window about expense update
    try {
        if (window.opener) {
            window.opener.postMessage({
                type: 'expenseUpdate',
                action: 'addExpense',
                description: description,
                amount: cash,
                date: date
            }, '*');
            console.log('📊 Sent expense update message to admin window');
        }
    } catch (error) {
        console.error('❌ Error sending message to admin window:', error);
    }
    
    // Refresh Admin Sales Journal to listen to expense updates
    if (window.opener && window.opener.ensureSalesJournalListensToExpenses) {
        try {
            await window.opener.ensureSalesJournalListensToExpenses();
            console.log('📈 Admin Sales Journal refreshed from cashier expense addition');
        } catch (error) {
            console.error('❌ Error refreshing admin Sales Journal from cashier:', error);
        }
    }
    
    // Also try direct refresh if function is available in same window
    if (window.ensureSalesJournalListensToExpenses) {
        try {
            await window.ensureSalesJournalListensToExpenses();
            console.log('📈 Sales Journal refreshed from cashier expense addition');
        } catch (error) {
            console.error('❌ Error refreshing Sales Journal from cashier:', error);
        }
    }
}

// --- Receipt Settings ---
let receiptSettings = {
    brandName: '',
    address: '',
    phone: '',
    brandIcon: '',
    vatEnabled: false,
    vatRate: 12,
    vatType: 'inclusive',
    headerText: 'Thank you for your purchase!',
    footerText: 'Please come again!',
    theme: 'classic'
};

// Load receipt settings from localStorage
function loadReceiptSettings() {
    try {
        const saved = localStorage.getItem('receiptSettings');
        if (saved) {
            receiptSettings = { ...receiptSettings, ...JSON.parse(saved) };
        }
    } catch (error) {
        console.log('No saved receipt settings found, using defaults');
    }
}

// Save receipt settings to localStorage
function saveReceiptSettings() {
    try {
        localStorage.setItem('receiptSettings', JSON.stringify(receiptSettings));
        console.log('Receipt settings saved successfully');
    } catch (error) {
        console.error('Failed to save receipt settings:', error);
    }
}

// Open receipt settings modal
function openReceiptSettingsModal() {
    loadReceiptSettings();
    
    // Populate form fields
    document.getElementById('receipt-brand-name').value = receiptSettings.brandName || '';
    document.getElementById('receipt-address').value = receiptSettings.address || '';
    document.getElementById('receipt-phone').value = receiptSettings.phone || '';
    document.getElementById('receipt-brand-icon').value = receiptSettings.brandIcon || '';
    document.getElementById('receipt-vat-enabled').checked = receiptSettings.vatEnabled || false;
    document.getElementById('receipt-vat-rate').value = receiptSettings.vatRate || 12;
    document.getElementById('receipt-vat-type').value = receiptSettings.vatType || 'inclusive';
    document.getElementById('receipt-header-text').value = receiptSettings.headerText || 'Thank you for your purchase!';
    document.getElementById('receipt-footer-text').value = receiptSettings.footerText || 'Please come again!';
    document.getElementById('receipt-theme').value = receiptSettings.theme || 'classic';
    
    // Update preview
    updateReceiptPreview();
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('receiptSettingsModal'));
    modal.show();
}

// Update receipt preview
function updateReceiptPreview() {
    const settings = getCurrentFormSettings();
    const preview = document.getElementById('receipt-preview');
    
    if (!preview) return;
    
    const logoHtml = settings.brandIcon ? 
        `<img src="${settings.brandIcon}" style="height: 40px; max-width: 150px; object-fit: contain;" alt="Logo">` :
        `<div style="height: 40px; width: 40px; background: #ddd; margin: 0 auto; display: flex; align-items: center; justify-content: center; border-radius: 4px;">🏢</div>`;
    
    const brandInfo = settings.brandName ? 
        `<strong>${settings.brandName}</strong>${settings.address ? `<br><small>${settings.address}</small>` : ''}${settings.phone ? `<br><small>Phone: ${settings.phone}</small>` : ''}` :
        `<strong>Your Business Name</strong><br><small>Business Address</small><br><small>Phone: Contact Number</small>`;
    
    const headerText = settings.headerText || 'Thank you for your purchase!';
    const footerText = settings.footerText || 'Please come again!';
    
    preview.innerHTML = `
        <div class="text-center mb-3">
            ${logoHtml}
            ${brandInfo}
        </div>
        <hr>
        <div class="mb-2">
            <strong>Receipt #123</strong><br>
            <small>Date: November 28, 2025 09:32 AM</small>
        </div>
        ${settings.vatEnabled ? `<div class="mb-2"><small>VAT Rate: ${settings.vatRate}% (${settings.vatType})</small></div>` : ''}
        <hr>
        <div class="mb-2">
            <div style="display: flex; justify-content: space-between;">
                <span>Sample Item x1</span>
                <span>₱100.00</span>
            </div>
            ${settings.vatEnabled && settings.vatType === 'exclusive' ? `
            <div style="display: flex; justify-content: space-between;">
                <span>VAT (${settings.vatRate}%)</span>
                <span>₱${(100 * settings.vatRate / 100).toFixed(2)}</span>
            </div>` : ''}
        </div>
        <hr>
        <div style="display: flex; justify-content: space-between; font-weight: bold;">
            <span>Total:</span>
            <span>₱${settings.vatEnabled && settings.vatType === 'exclusive' ? (100 * (1 + settings.vatRate / 100)).toFixed(2) : '100.00'}</span>
        </div>
        <hr>
        <div class="text-center">
            <small>${headerText}</small><br>
            <small>${footerText}</small>
        </div>
    `;
}

// Get current form settings
function getCurrentFormSettings() {
    return {
        brandName: document.getElementById('receipt-brand-name')?.value || '',
        address: document.getElementById('receipt-address')?.value || '',
        phone: document.getElementById('receipt-phone')?.value || '',
        brandIcon: document.getElementById('receipt-brand-icon')?.value || '',
        vatEnabled: document.getElementById('receipt-vat-enabled')?.checked || false,
        vatRate: parseFloat(document.getElementById('receipt-vat-rate')?.value) || 12,
        vatType: document.getElementById('receipt-vat-type')?.value || 'inclusive',
        headerText: document.getElementById('receipt-header-text')?.value || 'Thank you for your purchase!',
        footerText: document.getElementById('receipt-footer-text')?.value || 'Please come again!',
        theme: document.getElementById('receipt-theme')?.value || 'classic'
    };
}

// Handle receipt settings form submission
document.addEventListener('DOMContentLoaded', function() {
    // Add receipt settings form handler
    const receiptSettingsForm = document.getElementById('receipt-settings-form');
    if (receiptSettingsForm) {
        receiptSettingsForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Update settings
            const settings = getCurrentFormSettings();
            receiptSettings = { ...receiptSettings, ...settings };
            
            // Save to localStorage
            saveReceiptSettings();
            
            // Show success message
            showCashierNotification('Receipt settings saved successfully!', 'success', 3000);
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('receiptSettingsModal'));
            if (modal) {
                modal.hide();
            }
        });
    }
    
    // Add real-time preview updates
    const formInputs = [
        'receipt-brand-name', 'receipt-address', 'receipt-phone', 
        'receipt-brand-icon', 'receipt-vat-enabled', 'receipt-vat-rate',
        'receipt-vat-type', 'receipt-header-text', 'receipt-footer-text',
        'receipt-theme'
    ];
    
    formInputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', updateReceiptPreview);
            element.addEventListener('change', updateReceiptPreview);
        }
    });
    
    // Test receipt button
    const testReceiptBtn = document.getElementById('test-receipt-btn');
    if (testReceiptBtn) {
        testReceiptBtn.addEventListener('click', function() {
            console.log('Testing receipt with current settings:', receiptSettings);
            showCashierNotification('Test receipt functionality would be implemented here', 'info', 3000);
        });
    }
    
    // Reset receipt button
    const resetReceiptBtn = document.getElementById('reset-receipt-btn');
    if (resetReceiptBtn) {
        resetReceiptBtn.addEventListener('click', function() {
            if (confirm('Reset all receipt settings to default values?')) {
                // Reset to defaults
                receiptSettings = {
                    brandName: '',
                    address: '',
                    phone: '',
                    brandIcon: '',
                    vatEnabled: false,
                    vatRate: 12,
                    vatType: 'inclusive',
                    headerText: 'Thank you for your purchase!',
                    footerText: 'Please come again!',
                    theme: 'classic'
                };
                
                // Save defaults
                saveReceiptSettings();
                
                // Update form
                document.getElementById('receipt-brand-name').value = '';
                document.getElementById('receipt-address').value = '';
                document.getElementById('receipt-phone').value = '';
                document.getElementById('receipt-brand-icon').value = '';
                document.getElementById('receipt-vat-enabled').checked = false;
                document.getElementById('receipt-vat-rate').value = 12;
                document.getElementById('receipt-vat-type').value = 'inclusive';
                document.getElementById('receipt-header-text').value = 'Thank you for your purchase!';
                document.getElementById('receipt-footer-text').value = 'Please come again!';
                document.getElementById('receipt-theme').value = 'classic';
                
                // Update preview
                updateReceiptPreview();
                
                showCashierNotification('Receipt settings reset to default', 'info', 3000);
            }
        });
    }
    
    // Handle logo upload
    const logoUpload = document.getElementById('receipt-logo-upload');
    if (logoUpload) {
        logoUpload.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                if (file.size > 2 * 1024 * 1024) {
                    showCashierNotification('Logo file must be less than 2MB', 'error', 3000);
                    e.target.value = '';
                    return;
                }
                
                const reader = new FileReader();
                reader.onload = function(e) {
                    document.getElementById('receipt-brand-icon').value = e.target.result;
                    updateReceiptPreview();
                };
                reader.readAsDataURL(file);
            }
        });
    }
});

// Expense List functionality
async function loadExpenseList(selectedDate = null) {
    try {
        const targetDate = selectedDate || document.getElementById('expense-list-date')?.value || new Date().toISOString().split('T')[0];
        console.log('📋 Loading expense list for:', targetDate);
        
        const expenses = await getAllJournals();
        const filteredExpenses = expenses.filter(expense => {
            if (!expense.date || expense.type !== 'expense') return false;
            const expenseDate = new Date(expense.date).toISOString().split('T')[0];
            return expenseDate === targetDate;
        });
        
        // Sort by date (newest first)
        filteredExpenses.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        const tbody = document.querySelector('#expense-list-table tbody');
        tbody.innerHTML = '';
        
        if (filteredExpenses.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center text-muted py-4">
                        <i class="fas fa-receipt fa-2x mb-2 d-block"></i>
                        No expenses found for ${targetDate}
                    </td>
                </tr>
            `;
            document.getElementById('expense-list-summary').textContent = `No expenses found for ${targetDate}`;
            return;
        }
        
        let totalAmount = 0;
        const currency = window.posCurrency || '₱';
        const decimals = window.posDecimalPlaces || 2;
        
        filteredExpenses.forEach(expense => {
            const cashAmount = expense.cash || 0;
            const expenseTotal = cashAmount;
            totalAmount += expenseTotal;
            
            const formattedDate = new Date(expense.date).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            }).replace(',', '');
            
            // Determine payment status
            const isPaid = expense.paid || expenseTotal === 0; // Consider 0 amount as paid
            const statusBadge = isPaid 
                ? '<span class="badge bg-success me-2">Paid</span>' 
                : '<span class="badge bg-warning me-2">Pending</span>';
            
            // Create description and separate amount columns
            const descriptionText = `
                <div class="description-text fw-medium" style="font-size: 0.9rem; line-height: 1.4;">
                    <span title="${expense.description || 'No description'}">${expense.description || 'No description'}</span>
                </div>
            `;
            
            const row = `
                <tr class="expense-row" data-expense-id="${expense.id}" style="border-bottom: 1px solid #f1f3f5;">
                    <td class="small" style="width: 200px; vertical-align: middle; padding: 1.25rem 1rem; background: #ffffff;">
                        <div class="date-display" style="font-size: 0.85rem; line-height: 1.5; color: #6c757d; white-space: nowrap; font-weight: 500;">
                            ${formattedDate}
                        </div>
                    </td>
                    <td class="small" style="vertical-align: middle; padding: 1.25rem 1.5rem 1.25rem 1rem; background: #ffffff;">
                        <div class="description-text fw-medium" style="font-size: 0.95rem; line-height: 1.6; color: #212529;">
                            <span title="${expense.description || 'No description'}">${expense.description || 'No description'}</span>
                        </div>
                    </td>
                    <td class="small text-end" style="width: 140px; vertical-align: middle; padding: 1.25rem 1rem; background: #ffffff;">
                        <strong style="font-size: 0.9rem; font-weight: 600; color: #495057;">${currency}${cashAmount.toFixed(decimals)}</strong>
                    </td>
                    <td class="small text-center" style="width: 120px; vertical-align: middle; padding: 1.25rem 1rem; background: #ffffff;">
                        <button type="button" class="btn btn-outline-primary btn-sm" onclick="showExpenseDetails('${expense.id}')" style="font-size: 0.8rem; padding: 0.25rem 0.5rem;">
                            <i class="fas fa-eye" style="font-size: 0.7rem;"></i> View
                        </button>
                    </td>
                    <td class="small text-center" style="width: 120px; vertical-align: middle; padding: 1.25rem 1rem; background: #ffffff;">
                        ${statusBadge}
                    </td>
                </tr>
            `;
            
            console.log('🔍 Generated row for expense:', {
                id: expense.id,
                idType: typeof expense.id,
                description: expense.description,
                buttonOnclick: `showExpenseDetails('${expense.id}')`
            });
            tbody.insertAdjacentHTML('beforeend', row);
        });
        
        // Update summary
        document.getElementById('expense-list-summary').textContent = 
            `${filteredExpenses.length} expenses totaling ${currency}${totalAmount.toFixed(decimals)} for ${targetDate}`;
        
        console.log(`✅ Loaded ${filteredExpenses.length} expenses for ${targetDate}`);
        
        // Send message to admin window about expense list update
        try {
            if (window.opener) {
                window.opener.postMessage({
                    type: 'expenseUpdate',
                    action: 'loadExpenseList',
                    date: targetDate,
                    count: filteredExpenses.length,
                    total: totalAmount
                }, '*');
                console.log('📊 Sent expense list update message to admin window');
            }
        } catch (error) {
            console.error('❌ Error sending expense list message to admin window:', error);
        }
        
        // Refresh Admin Sales Journal to listen to expense updates
        if (window.opener && window.opener.ensureSalesJournalListensToExpenses) {
            try {
                await window.opener.ensureSalesJournalListensToExpenses();
                console.log('📈 Admin Sales Journal refreshed from cashier expense list load');
            } catch (error) {
                console.error('❌ Error refreshing admin Sales Journal from cashier list:', error);
            }
        }
        
        // Also try direct refresh if function is available in same window
        if (window.ensureSalesJournalListensToExpenses) {
            try {
                await window.ensureSalesJournalListensToExpenses();
                console.log('📈 Sales Journal refreshed from cashier expense list load');
            } catch (error) {
                console.error('❌ Error refreshing Sales Journal from cashier list:', error);
            }
        }
        
    } catch (error) {
        console.error('❌ Error loading expense list:', error);
        const tbody = document.querySelector('#expense-list-table tbody');
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center text-danger py-4">
                    <i class="fas fa-exclamation-triangle fa-2x mb-2 d-block"></i>
                    Error loading expenses: ${error.message}
                </td>
            </tr>
        `;
    }
}

// Show expense details modal
async function showExpenseDetails(expenseId) {
    try {
        console.log('🔍 Showing expense details for ID:', expenseId);
        console.log('🔍 Type of expenseId:', typeof expenseId);
        console.log('🔍 All expenses available:');
        
        const expenses = await getAllJournals();
        console.log('🔍 Total expenses found:', expenses.length);
        
        // Debug: Show first few expenses to verify data structure
        if (expenses.length > 0) {
            console.log('🔍 Sample expense structure:', expenses[0]);
            console.log('🔍 Sample expense IDs:', expenses.slice(0, 3).map(e => ({ id: e.id, type: typeof e.id })));
        }
        
        const expense = expenses.find(e => e.id == expenseId); // Use == for loose comparison
        
        console.log('🔍 Found expense:', expense);
        
        if (!expense) {
            console.error('❌ Expense not found. Looking for ID:', expenseId, 'in expenses:', expenses.map(e => e.id));
            showCashierNotification('Expense not found', 'error', 3000);
            return;
        }
        
        const cashAmount = expense.cash || 0;
        const totalAmount = cashAmount;
        const currency = window.posCurrency || '₱';
        const decimals = window.posDecimalPlaces || 2;
        
        // Format date
        const formattedDate = new Date(expense.date).toLocaleString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
        
        // Determine payment status
        const isPaid = expense.paid || totalAmount === 0;
        const statusBadge = isPaid 
            ? '<span class="badge bg-success">Paid</span>' 
            : '<span class="badge bg-warning">Pending</span>';
        
        // Populate modal fields
        document.getElementById('expense-detail-date').textContent = formattedDate;
        document.getElementById('expense-detail-status').innerHTML = statusBadge;
        document.getElementById('expense-detail-description').textContent = expense.description || 'No description';
        document.getElementById('expense-detail-cash').textContent = currency + cashAmount.toFixed(decimals);
        document.getElementById('expense-detail-total').textContent = currency + totalAmount.toFixed(decimals);
        
        // Show payment details
        const paymentDetailsContent = document.getElementById('payment-details-content');
        
        // Hide payment progress section since payment functionality is removed
        const paymentProgressSection = document.getElementById('payment-progress-section');
        if (paymentProgressSection) {
            paymentProgressSection.style.display = 'none';
        }
                
        if (isPaid) {
            paymentDetailsContent.innerHTML = `
                <div class="alert alert-success mb-0">
                    <i class="fas fa-check-circle me-2"></i>
                    <strong>Fully Paid</strong><br>
                    This expense has been completely paid for.
                </div>
            `;
        } else {
            paymentDetailsContent.innerHTML = `
                <div class="alert alert-warning mb-0">
                    <i class="fas fa-clock me-2"></i>
                    <strong>Payment Pending</strong><br>
                    Amount remaining: ${currency}${totalAmount.toFixed(decimals)}
                </div>
            `;
        }
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('expenseDetailsModal'));
        modal.show();
        
    } catch (error) {
        console.error('❌ Error showing expense details:', error);
        showCashierNotification('Error loading expense details', 'error', 3000);
    }
}

// Make function globally accessible for onclick handlers
window.showExpenseDetails = showExpenseDetails;

// Event listeners for Expense List
document.addEventListener('DOMContentLoaded', function() {
    // Expense List date picker
    const expenseListDate = document.getElementById('expense-list-date');
    if (expenseListDate) {
        // Set default date to today
        expenseListDate.value = new Date().toISOString().split('T')[0];
        
        // Add change listener
        expenseListDate.addEventListener('change', function() {
            loadExpenseList(this.value);
        });
    }
    
    // Refresh Expense List button
    const refreshExpenseListBtn = document.getElementById('refresh-expense-list-btn');
    if (refreshExpenseListBtn) {
        refreshExpenseListBtn.addEventListener('click', function() {
            const selectedDate = document.getElementById('expense-list-date')?.value;
            loadExpenseList(selectedDate);
        });
    }
    
    // Auto-load expense list when tab is activated
    const expenseListTab = document.getElementById('expense-list-tab');
    if (expenseListTab) {
        expenseListTab.addEventListener('shown.bs.tab', function() {
            const selectedDate = document.getElementById('expense-list-date')?.value || new Date().toISOString().split('T')[0];
            loadExpenseList(selectedDate);
        });
    }
    
});
