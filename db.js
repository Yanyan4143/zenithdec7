// db.js - IndexedDB setup and utilities for POS system
let db;

const SUPABASE_URL = 'https://YOUR-PROJECT.ref.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR-ANON-KEY';
let supabaseClient = null;

async function ensureStoragePersistence() {
    if (typeof navigator === 'undefined' || !navigator.storage) {
        console.warn('StorageManager API is not available; IndexedDB persistence cannot be requested.');
        return false;
    }

    try {
        if (navigator.storage.persisted) {
            const alreadyPersisted = await navigator.storage.persisted();
            if (alreadyPersisted) {
                logStorageEstimate();
                console.log('Persistent storage already granted.');
                return true;
            }
        }

        if (!navigator.storage.persist) {
            console.warn('navigator.storage.persist is not supported in this browser.');
            return false;
        }

        const granted = await navigator.storage.persist();
        if (granted) {
            console.log('Persistent storage granted after request.');
            logStorageEstimate();
            return true;
        }

        console.warn('Persistent storage request was denied by the browser.');
        return false;
    } catch (error) {
        console.error('Failed to ensure storage persistence:', error);
        return false;
    }
}

async function logStorageEstimate() {
    if (!navigator.storage || !navigator.storage.estimate) {
        return;
    }

    try {
        const { usage = 0, quota = 0 } = await navigator.storage.estimate();
        const usageMB = (usage / (1024 * 1024)).toFixed(2);
        const quotaMB = quota ? (quota / (1024 * 1024)).toFixed(2) : 'unknown';
        console.log(`IndexedDB usage: ${usageMB} MB / ${quotaMB} MB available.`);
    } catch (error) {
        console.warn('Unable to determine storage usage:', error);
    }
}

const storagePersistencePromise = ensureStoragePersistence();

if (typeof supabase !== 'undefined' &&
    SUPABASE_URL && !SUPABASE_URL.includes('YOUR-PROJECT') &&
    SUPABASE_ANON_KEY && !SUPABASE_ANON_KEY.includes('YOUR-ANON-KEY')) {
    try {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } catch (err) {
        console.error('Failed to initialize Supabase client', err);
        supabaseClient = null;
    }
}

const dbRequest = indexedDB.open('POS', 3);

let dbPromise = new Promise((resolve, reject) => {
    dbRequest.onupgradeneeded = function(event) {
        const db = event.target.result;

        if (!db.objectStoreNames.contains('inventory')) {
            const inventoryStore = db.createObjectStore('inventory', { keyPath: 'id', autoIncrement: true });
            inventoryStore.createIndex('name', 'name', { unique: false });
            inventoryStore.createIndex('category', 'category', { unique: false });
        }

        if (!db.objectStoreNames.contains('sales')) {
            const salesStore = db.createObjectStore('sales', { keyPath: 'id', autoIncrement: true });
            salesStore.createIndex('date', 'date', { unique: false });
        }

        if (!db.objectStoreNames.contains('journals')) {
            const journalsStore = db.createObjectStore('journals', { keyPath: 'id', autoIncrement: true });
            journalsStore.createIndex('date', 'date', { unique: false });
            journalsStore.createIndex('type', 'type', { unique: false });
        }

        if (!db.objectStoreNames.contains('audit_logs')) {
            const auditStore = db.createObjectStore('audit_logs', { keyPath: 'id', autoIncrement: true });
            auditStore.createIndex('date', 'date', { unique: false });
        }

        if (!db.objectStoreNames.contains('suppliers')) {
            const suppliersStore = db.createObjectStore('suppliers', { keyPath: 'id', autoIncrement: true });
            suppliersStore.createIndex('name', 'name', { unique: false });
        }
    };

    dbRequest.onsuccess = function(event) {
        db = event.target.result;
        db.onversionchange = () => {
            console.warn('IndexedDB version changed. Closing old connection.');
            db.close();
        };
        console.log('Database opened successfully');
        storagePersistencePromise.then((persisted) => {
            if (!persisted) {
                console.warn('Persistent storage not granted. Data may be cleared under storage pressure.');
            }
        });
        resolve();
    };

    dbRequest.onerror = function(event) {
        console.error('Database error:', event.target.errorCode);
        reject(event.target.error);
    };
});

// --- Inventory CRUD ---
async function addInventoryItem(item) {
    await dbPromise;
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['inventory'], 'readwrite');
        const store = transaction.objectStore('inventory');
        const request = store.add(item);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

async function getAllInventory() {
    await dbPromise;
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['inventory'], 'readonly');
        const store = transaction.objectStore('inventory');
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function putInventoryItem(item) {
    await dbPromise;
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['inventory'], 'readwrite');
        const store = transaction.objectStore('inventory');
        const request = store.put(item);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

async function deleteInventoryItem(id) {
    await dbPromise;
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['inventory'], 'readwrite');
        const store = transaction.objectStore('inventory');
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

async function updateInventoryStock(id, newStock) {
    await dbPromise;
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['inventory'], 'readwrite');
        const store = transaction.objectStore('inventory');
        const request = store.get(id);
        request.onsuccess = () => {
            const item = request.result;
            if (!item) return reject('Item not found');
            item.stock = newStock;
            const updateReq = store.put(item);
            updateReq.onsuccess = () => resolve();
            updateReq.onerror = () => reject(updateReq.error);
        };
        request.onerror = () => reject(request.error);
    });
}

// --- Sales ---
function supabaseInsertSale(storedSale) {
    if (!supabaseClient) return;
    (async () => {
        try {
            const { error } = await supabaseClient.from('sales').insert({
                local_id: storedSale.id,
                date: storedSale.date,
                total: storedSale.total,
                items: storedSale.items
            });
            if (error) {
                console.error('Supabase insert error for sales', error);
                return;
            }
            try {
                const updated = Object.assign({}, storedSale, { synced: true });
                await updateSale(updated);
            } catch (err) {
                console.error('Failed to mark sale as synced locally', err);
            }
        } catch (err) {
            console.error('Supabase insert failed for sales', err);
        }
    })();
}

async function addSale(sale) {
    await dbPromise;
    const localSale = Object.assign({}, sale, { synced: false });
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['sales'], 'readwrite');
        const store = transaction.objectStore('sales');
        const request = store.add(localSale);
        request.onsuccess = () => {
            const id = request.result;
            const storedSale = Object.assign({}, localSale, { id });
            supabaseInsertSale(storedSale);
            resolve();
        };
        request.onerror = () => reject(request.error);
    });
}

async function getAllSales() {
    await dbPromise;
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['sales'], 'readonly');
        const store = transaction.objectStore('sales');
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// Update an existing sale record (used when voiding individual sale lines)
async function updateSale(sale) {
    await dbPromise;
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['sales'], 'readwrite');
        const store = transaction.objectStore('sales');
        const request = store.put(sale);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

// Delete a sale record entirely (if all its items have been voided)
async function deleteSale(id) {
    await dbPromise;
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['sales'], 'readwrite');
        const store = transaction.objectStore('sales');
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

// --- Journals ---
async function addJournalEntry(entry) {
    await dbPromise;
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['journals'], 'readwrite');
        const store = transaction.objectStore('journals');
        const request = store.add(entry);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

async function getAllJournals() {
    await dbPromise;
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['journals'], 'readonly');
        const store = transaction.objectStore('journals');
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// --- Audit Logs ---
async function addAuditLog(log) {
    await dbPromise;
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['audit_logs'], 'readwrite');
        const store = transaction.objectStore('audit_logs');
        const request = store.add(log);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

async function getAllAuditLogs() {
    await dbPromise;
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['audit_logs'], 'readonly');
        const store = transaction.objectStore('audit_logs');
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function deleteAuditLog(id) {
    await dbPromise;
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['audit_logs'], 'readwrite');
        const store = transaction.objectStore('audit_logs');
        const request = store.delete(id);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// --- Suppliers ---
async function addSupplierRecord(supplier) {
    await dbPromise;
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['suppliers'], 'readwrite');
        const store = transaction.objectStore('suppliers');
        const request = store.add(supplier);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

async function getAllSuppliers() {
    await dbPromise;
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['suppliers'], 'readonly');
        const store = transaction.objectStore('suppliers');
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function updateSupplierRecord(supplier) {
    await dbPromise;
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['suppliers'], 'readwrite');
        const store = transaction.objectStore('suppliers');
        const request = store.put(supplier);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

async function deleteSupplierRecord(id) {
    await dbPromise;
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['suppliers'], 'readwrite');
        const store = transaction.objectStore('suppliers');
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

// --- Clear all core POS data (inventory, sales, journals, audit logs, suppliers) ---
async function clearAllData(){
    await dbPromise;
    return new Promise((resolve, reject) => {
        try {
            const storeNames = ['inventory','sales','journals','audit_logs','suppliers'];
            const transaction = db.transaction(storeNames, 'readwrite');
            storeNames.forEach(name => {
                if (transaction.objectStore(name)) {
                    transaction.objectStore(name).clear();
                }
            });
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        } catch (err) {
            reject(err);
        }
    });
}

// Additional functions for complete functionality
async function putSale(sale) {
    await dbPromise;
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['sales'], 'readwrite');
        const store = transaction.objectStore('sales');
        const request = store.put(sale);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function putJournalEntry(entry) {
    await dbPromise;
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['journals'], 'readwrite');
        const store = transaction.objectStore('journals');
        const request = store.put(entry);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// Save all journals (for bulk updates)
async function saveAllJournals(journals) {
    await dbPromise;
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['journals'], 'readwrite');
        const store = transaction.objectStore('journals');
        
        // Clear existing entries
        const clearRequest = store.clear();
        clearRequest.onsuccess = () => {
            // Add all updated entries
            let completed = 0;
            const total = journals.length;
            
            if (total === 0) {
                resolve();
                return;
            }
            
            journals.forEach(journal => {
                const addRequest = store.add(journal);
                addRequest.onsuccess = () => {
                    completed++;
                    if (completed === total) {
                        resolve();
                    }
                };
                addRequest.onerror = () => reject(addRequest.error);
            });
        };
        clearRequest.onerror = () => reject(clearRequest.error);
    });
}

async function getAllJournalEntries() {
    return await getAllJournals();
}

async function syncUnsyncedSalesToSupabase() {
    try {
        if (!supabaseClient) {
            console.log('Supabase not available - skipping sales sync');
            return;
        }
        
        const sales = await getAllSales();
        const unsyncedSales = sales.filter(sale => !sale.synced);
        
        if (unsyncedSales.length === 0) {
            console.log('No unsynced sales to sync');
            return;
        }
        
        console.log(`Syncing ${unsyncedSales.length} unsynced sales to Supabase...`);
        
        for (const sale of unsyncedSales) {
            try {
                await syncSaleToSupabase(sale);
                // Mark as synced
                sale.synced = true;
                await putSale(sale);
            } catch (error) {
                console.error('Failed to sync sale:', sale.id, error);
            }
        }
        
        console.log('✅ Sales sync completed');
    } catch (error) {
        console.error('❌ Sales sync failed:', error);
    }
}

async function syncUnsyncedExpensesToSupabase() {
    try {
        if (!supabaseClient) {
            console.log('Supabase not available - skipping expenses sync');
            return;
        }
        
        const expenses = await getAllJournalEntries();
        const unsyncedExpenses = expenses.filter(entry => entry.type === 'expense' && !entry.synced);
        
        if (unsyncedExpenses.length === 0) {
            console.log('No unsynced expenses to sync');
            return;
        }
        
        console.log(`Syncing ${unsyncedExpenses.length} unsynced expenses to Supabase...`);
        
        for (const expense of unsyncedExpenses) {
            try {
                await syncJournalEntryToSupabase(expense);
                // Mark as synced
                expense.synced = true;
                await putJournalEntry(expense);
            } catch (error) {
                console.error('Failed to sync expense:', expense.id, error);
            }
        }
        
        console.log('✅ Expenses sync completed');
    } catch (error) {
        console.error('❌ Expenses sync failed:', error);
    }
}

// Critical missing functions for Supabase sync
async function syncSaleToSupabase(sale) {
    try {
        if (!supabaseClient) {
            console.log('Supabase not available - skipping sale sync');
            return;
        }
        
        const { error } = await supabaseClient
            .from('sales')
            .insert([{
                id: sale.id,
                date: sale.date,
                items: sale.items,
                total: sale.total,
                given: sale.given,
                change: sale.change,
                created_at: new Date().toISOString()
            }]);
            
        if (error) {
            console.error('Failed to sync sale to Supabase:', error);
            throw error;
        }
        
        console.log('✅ Sale synced to Supabase:', sale.id);
    } catch (error) {
        console.error('❌ Sale sync failed:', error);
        throw error;
    }
}

async function syncJournalEntryToSupabase(entry) {
    try {
        if (!supabaseClient) {
            console.log('Supabase not available - skipping journal entry sync');
            return;
        }
        
        const { error } = await supabaseClient
            .from('journals')
            .insert([{
                id: entry.id,
                date: entry.date,
                type: entry.type,
                description: entry.description,
                cash: entry.cash,
                created_at: new Date().toISOString()
            }]);
            
        if (error) {
            console.error('Failed to sync journal entry to Supabase:', error);
            throw error;
        }
        
        console.log('✅ Journal entry synced to Supabase:', entry.id);
    } catch (error) {
        console.error('❌ Journal entry sync failed:', error);
        throw error;
    }
}
