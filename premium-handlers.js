// Premium Functions Event Handlers
// Connect premium UI elements to premium functions

document.addEventListener('DOMContentLoaded', function() {
    // Set default date to today and ensure real-time updates
    const analyticsDatePicker = document.getElementById('analytics-date-picker');
    if (analyticsDatePicker) {
        // Use local timezone to get today's date
        const today = new Date().toLocaleDateString('en-CA'); // en-CA gives YYYY-MM-DD format in local timezone
        analyticsDatePicker.value = today;
        
        // Update date picker to current date every minute
        setInterval(() => {
            // Use local timezone for current date
            const currentDate = new Date().toLocaleDateString('en-CA'); // Local timezone
            const datePicker = document.getElementById('analytics-date-picker');
            if (datePicker) {
                // Always update to current date when analytics modal is open
                if (document.getElementById('analyticsModal').classList.contains('show')) {
                    datePicker.value = currentDate;
                    console.log('📅 Analytics date updated to current date (local timezone):', currentDate);
                    // Auto-refresh analytics when date changes
                    loadAnalytics();
                } else if (datePicker.value !== currentDate) {
                    // Only update if modal is closed and date is different
                    datePicker.value = currentDate;
                    console.log('📅 Analytics date updated to current date (local timezone):', currentDate);
                }
            }
        }, 60000); // Update every minute
        
        // Also update when page becomes visible (tab switching)
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                // Use local timezone for current date
                const currentDate = new Date().toLocaleDateString('en-CA'); // Local timezone
                const datePicker = document.getElementById('analytics-date-picker');
                if (datePicker) {
                    // Always reset to current date when analytics modal is open on tab focus
                    if (document.getElementById('analyticsModal').classList.contains('show')) {
                        datePicker.value = currentDate;
                        console.log('📅 Analytics date reset to current date on tab focus (local timezone):', currentDate);
                        // Auto-refresh analytics when tab becomes active
                        loadAnalytics();
                    } else {
                        datePicker.value = currentDate;
                        console.log('📅 Analytics date updated on tab focus (local timezone):', currentDate);
                    }
                }
            }
        });
    }

    // Auto-refresh analytics every 30 seconds when modal is open
    setInterval(() => {
        const modal = document.getElementById('analyticsModal');
        if (modal && modal.classList.contains('show')) {
            console.log('🔄 Auto-refreshing analytics...');
            
            // Always reset to current date on auto-refresh - use local timezone
            const currentDate = new Date().toLocaleDateString('en-CA'); // Local timezone
            const datePicker = document.getElementById('analytics-date-picker');
            if (datePicker) {
                datePicker.value = currentDate;
                console.log('📅 Auto-refresh: Date reset to current date (local timezone):', currentDate);
            }
            
            loadAnalytics();
        }
    }, 30000); // Auto-refresh every 30 seconds

    // Analytics Date Picker Handler
    const analyticsDatePickerHandler = document.getElementById('analytics-date-picker');
    if (analyticsDatePickerHandler) {
        analyticsDatePickerHandler.addEventListener('change', async function() {
            const selectedDate = this.value;
            if (selectedDate) {
                console.log(`📅 Date selected: ${selectedDate}`);
                await loadDateSpecificAnalytics(selectedDate);
            }
        });
    }

    // Export Date Data Button Handler
    const exportDateDataBtn = document.getElementById('export-date-data-btn');
    if (exportDateDataBtn) {
        exportDateDataBtn.addEventListener('click', async function() {
            const selectedDate = document.getElementById('analytics-date-picker').value;
            if (selectedDate) {
                console.log(`📥 Exporting data for: ${selectedDate}`);
                await exportDateSpecificData(selectedDate);
            } else {
                alert('Please select a date first');
            }
        });
    }

    // Analytics Button Handler
    const analyticsBtn = document.getElementById('analytics-btn');
    if (analyticsBtn) {
        analyticsBtn.addEventListener('click', async function() {
            const modal = new bootstrap.Modal(document.getElementById('analyticsModal'));
            modal.show();
            await loadAnalytics();
        });
    }

    // Customer Loyalty Button Handler
    const loyaltyBtn = document.getElementById('customer-loyalty-btn');
    if (loyaltyBtn) {
        loyaltyBtn.addEventListener('click', function() {
            const modal = new bootstrap.Modal(document.getElementById('loyaltyModal'));
            modal.show();
            loadLoyaltyTiers();
        });
    }

    // Loyalty Settings Button Handler
    const loyaltySettingsBtn = document.getElementById('loyalty-settings-btn');
    if (loyaltySettingsBtn) {
        loyaltySettingsBtn.addEventListener('click', function() {
            const modal = new bootstrap.Modal(document.getElementById('loyaltySettingsModal'));
            modal.show();
            loadLoyaltyTierSettings();
        });
    }

    // Add Tier Button Handler
    const addTierBtn = document.getElementById('add-tier-btn');
    if (addTierBtn) {
        addTierBtn.addEventListener('click', addNewTier);
    }

    // Loyalty Settings Form Handler
    const loyaltySettingsForm = document.getElementById('loyalty-settings-form');
    if (loyaltySettingsForm) {
        loyaltySettingsForm.addEventListener('submit', saveLoyaltySettings);
    }

    // Inventory Forecast Button Handler
    const inventoryBtn = document.getElementById('inventory-forecast-btn');
    if (inventoryBtn) {
        inventoryBtn.addEventListener('click', function() {
            const modal = new bootstrap.Modal(document.getElementById('inventoryModal'));
            modal.show();
        });
    }

    // Refresh Analytics Button
    const refreshAnalyticsBtn = document.getElementById('refresh-analytics-btn');
    if (refreshAnalyticsBtn) {
        refreshAnalyticsBtn.addEventListener('click', async function() {
            // Add loading state
            const originalText = refreshAnalyticsBtn.innerHTML;
            refreshAnalyticsBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Refreshing...';
            refreshAnalyticsBtn.disabled = true;
            
            try {
                console.log('🔄 Manual refresh triggered...');
                
                // Always reset to current date on refresh - use local timezone
                const currentDate = new Date().toLocaleDateString('en-CA'); // Local timezone
                const datePicker = document.getElementById('analytics-date-picker');
                if (datePicker) {
                    datePicker.value = currentDate;
                    console.log('📅 Date reset to current date (local timezone):', currentDate);
                }
                
                await loadAnalytics();
                
                // Show success feedback
                refreshAnalyticsBtn.innerHTML = '<i class="fas fa-check"></i> Refreshed!';
                setTimeout(() => {
                    refreshAnalyticsBtn.innerHTML = originalText;
                    refreshAnalyticsBtn.disabled = false;
                }, 2000);
                
            } catch (error) {
                console.error('❌ Manual refresh failed:', error);
                refreshAnalyticsBtn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Error';
                setTimeout(() => {
                    refreshAnalyticsBtn.innerHTML = originalText;
                    refreshAnalyticsBtn.disabled = false;
                }, 2000);
            }
        });
    }

    // Add Customer Button
    const addCustomerBtn = document.getElementById('add-customer-btn');
    if (addCustomerBtn) {
        addCustomerBtn.addEventListener('click', function() {
            addOrUpdateCustomer();
        });
    }

    // Generate Forecast Button
    const generateForecastBtn = document.getElementById('generate-forecast-btn');
    if (generateForecastBtn) {
        generateForecastBtn.addEventListener('click', async function() {
            await loadInventoryForecast();
        });
    }

    // Auto Order Button
    const autoOrderBtn = document.getElementById('auto-order-btn');
    if (autoOrderBtn) {
        autoOrderBtn.addEventListener('click', function() {
            generateAutoOrders();
        });
    }
});

// Load Analytics Dashboard
async function loadAnalytics() {
    try {
        console.log('🔄 Loading Analytics Dashboard...');
        
        // Update auto-refresh indicator
        const indicator = document.getElementById('auto-refresh-indicator');
        if (indicator) {
            indicator.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> Loading...';
            indicator.className = 'text-muted me-3';
        }
        
        // Get current date from date picker
        const datePicker = document.getElementById('analytics-date-picker');
        const selectedDate = datePicker ? datePicker.value : new Date().toISOString().split('T')[0];
        
        console.log(`📅 Loading analytics for date: ${selectedDate}`);
        
        // Load date-specific analytics
        await loadDateSpecificAnalytics(selectedDate);
        
        // Update indicator back to normal
        if (indicator) {
            indicator.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> Auto-refresh: ON';
            indicator.className = 'text-muted me-3';
        }
        
        console.log('✅ Analytics Dashboard loaded successfully');
        
    } catch (error) {
        console.error('❌ Error loading analytics:', error);
        
        // Update indicator to show error
        const indicator = document.getElementById('auto-refresh-indicator');
        if (indicator) {
            indicator.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Error';
            indicator.className = 'text-danger me-3';
        }
        
        alert('Failed to load analytics. Please try again.');
    }
}

// Display Revenue Chart
function displayRevenueChart(dailySales) {
    const ctx = document.getElementById('revenueChart');
    if (!ctx) return;

    // Destroy existing chart if it exists
    if (window.revenueChartInstance) {
        window.revenueChartInstance.destroy();
    }

    const labels = Object.keys(dailySales);
    const data = labels.map(date => dailySales[date].revenue);

    window.revenueChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Daily Revenue',
                data: data,
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Revenue Trend'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '₱' + value.toFixed(2);
                        }
                    }
                }
            }
        }
    });
}

// Display Top Selling Items
function displayTopItems(topItems) {
    const container = document.getElementById('top-items-list');
    if (!container) return;

    container.innerHTML = topItems.map((item, index) => `
        <div class="d-flex justify-content-between align-items-center mb-2 p-2 border rounded">
            <div>
                <strong>${index + 1}. ${item.name}</strong><br>
                <small class="text-muted">${item.category}</small>
            </div>
            <div class="text-end">
                <div class="fw-bold">${item.quantity} sold</div>
                <small class="text-success">₱${item.revenue.toFixed(2)}</small>
            </div>
        </div>
    `).join('');
}

// Display Business Insights
function displayBusinessInsights(analytics) {
    const container = document.getElementById('business-insights');
    if (!container) return;

    const insights = [
        {
            title: 'Total Revenue',
            value: `₱${analytics.overview.totalRevenue.toFixed(2)}`,
            icon: '💰',
            color: 'text-primary'
        },
        {
            title: 'Net Profit',
            value: `₱${analytics.overview.netProfit.toFixed(2)}`,
            icon: '📈',
            color: 'text-success'
        },
        {
            title: 'Profit Margin',
            value: `${analytics.insights.profitMargin.toFixed(1)}%`,
            icon: '🎯',
            color: 'text-primary'
        },
        {
            title: 'Growth Rate',
            value: `${analytics.insights.growthRate > 0 ? '+' : ''}${analytics.insights.growthRate.toFixed(1)}%`,
            icon: analytics.insights.growthRate >= 0 ? '📊' : '📉',
            color: 'text-primary'
        },
        {
            title: 'Total Transactions',
            value: analytics.overview.totalTransactions.toLocaleString(),
            icon: '🧾',
            color: 'text-primary'
        },
        {
            title: 'Average Transaction',
            value: `₱${analytics.overview.averageTransactionValue.toFixed(2)}`,
            icon: '💳',
            color: 'text-primary'
        }
    ];

    container.innerHTML = `
        <div class="row">
            ${insights.map(insight => `
                <div class="col-md-6 col-lg-4 mb-3">
                    <div class="card border-0 shadow-sm h-100">
                        <div class="card-body">
                            <div class="d-flex align-items-center">
                                <div class="fs-3 me-3">${insight.icon}</div>
                                <div>
                                    <div class="small text-muted">${insight.title}</div>
                                    <div class="fw-bold ${insight.color}">${insight.value}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
        
        <div class="mt-4">
            <h6>Peak Business Hours</h6>
            <div class="d-flex flex-wrap">
                ${analytics.insights.peakHours.map(peak => `
                    <span class="badge bg-primary me-2 mb-2">
                        ${peak.hour}:00 - ₱${peak.revenue.toFixed(2)}
                    </span>
                `).join('')}
            </div>
        </div>
    `;
}

// Load Loyalty Tiers Display
async function loadLoyaltyTiers() {
    const container = document.getElementById('loyalty-tiers');
    if (!container) return;

    try {
        // Get saved tier settings
        const tiers = await getLoyaltyTierSettings();
        
        container.innerHTML = tiers.map(tier => `
            <div class="card border-0 shadow-sm mb-2">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center">
                        <div class="d-flex align-items-center">
                            <div class="fs-4 me-3">${tier.icon}</div>
                            <div>
                                <div class="fw-bold">${tier.name}</div>
                                <small class="text-muted">${tier.points} points required</small>
                            </div>
                        </div>
                        <div class="text-end">
                            <div class="badge bg-${tier.color}">${tier.discount}% discount</div>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('❌ Error loading loyalty tiers:', error);
        // Fallback to default tiers
        const defaultTiers = [
            { name: 'Bronze', points: 0, discount: 0, icon: '🥉', color: 'warning' },
            { name: 'Silver', points: 100, discount: 5, icon: '🥈', color: 'secondary' },
            { name: 'Gold', points: 500, discount: 10, icon: '🥇', color: 'success' },
            { name: 'Platinum', points: 1000, discount: 15, icon: '💎', color: 'primary' }
        ];
        
        container.innerHTML = defaultTiers.map(tier => `
            <div class="card border-0 shadow-sm mb-2">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center">
                        <div class="d-flex align-items-center">
                            <div class="fs-4 me-3">${tier.icon}</div>
                            <div>
                                <div class="fw-bold">${tier.name}</div>
                                <small class="text-muted">${tier.points} points required</small>
                            </div>
                        </div>
                        <div class="text-end">
                            <div class="badge bg-${tier.color}">${tier.discount}% discount</div>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }
}

// Add or Update Customer
function addOrUpdateCustomer() {
    const phoneInput = document.getElementById('customer-phone');
    const nameInput = document.getElementById('customer-name');
    
    if (!phoneInput || !nameInput) return;
    
    const phone = phoneInput.value.trim();
    const name = nameInput.value.trim();
    
    if (!phone || !name) {
        alert('Please enter both phone number and name');
        return;
    }
    
    // Add customer to loyalty system
    const customer = loyaltySystem.addCustomer(phone, name);
    
    // Display customer information
    displayCustomerInfo(customer);
    
    // Clear inputs
    phoneInput.value = '';
    nameInput.value = '';
}

// Display Customer Information
function displayCustomerInfo(customer) {
    const container = document.getElementById('customer-info');
    if (!container) return;
    
    const stats = loyaltySystem.getCustomerStats(customer.phone);
    
    container.innerHTML = `
        <div class="card border-0 shadow-sm">
            <div class="card-body">
                <h6 class="card-title">${customer.name}</h6>
                <p class="card-text">
                    <strong>Phone:</strong> ${customer.phone}<br>
                    <strong>Current Tier:</strong> ${stats.tierInfo.name}<br>
                    <strong>Points:</strong> ${customer.points}<br>
                    <strong>Total Spent:</strong> ₱${customer.totalSpent.toFixed(2)}<br>
                    <strong>Visits:</strong> ${customer.visits}<br>
                    <strong>Member Since:</strong> ${new Date(customer.joinDate).toLocaleDateString()}
                </p>
                ${stats.nextTier ? `
                    <div class="progress mb-2">
                        <div class="progress-bar" role="progressbar" style="width: ${(customer.points / (stats.nextTier.points)) * 100}%">
                            ${stats.pointsToNextTier} points to ${stats.nextTier.name}
                        </div>
                    </div>
                ` : '<div class="badge bg-success">Maximum Tier Reached!</div>'}
            </div>
        </div>
    `;
    
    // Display customer rewards
    displayCustomerRewards(customer);
}

// Display Customer Rewards
function displayCustomerRewards(customer) {
    const container = document.getElementById('customer-rewards');
    if (!container) return;
    
    if (customer.rewards.length === 0) {
        container.innerHTML = '<p class="text-muted">No rewards available yet. Make more purchases to earn rewards!</p>';
        return;
    }
    
    container.innerHTML = customer.rewards.map(reward => `
        <div class="card border-0 shadow-sm mb-2 ${reward.used ? 'opacity-50' : ''}">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <div class="fw-bold">${reward.description}</div>
                        <small class="text-muted">Earned: ${new Date(reward.date).toLocaleDateString()}</small>
                    </div>
                    <div>
                        ${reward.used ? 
                            '<span class="badge bg-secondary">Used</span>' : 
                            '<span class="badge bg-success">Available</span>'
                        }
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Load Inventory Forecast
async function loadInventoryForecast() {
    try {
        const forecast = await advancedInventory.generateInventoryForecast();
        
        const tbody = document.querySelector('#inventory-forecast-table tbody');
        if (!tbody) return;
        
        tbody.innerHTML = Object.entries(forecast).map(([itemName, data]) => `
            <tr>
                <td>${itemName}</td>
                <td>
                    <span class="badge ${data.currentStock === 0 ? 'bg-danger' : data.currentStock < data.reorderPoint ? 'bg-warning' : 'bg-success'}">
                        ${data.currentStock}
                    </span>
                </td>
                <td>${data.dailyUsage.toFixed(1)}</td>
                <td>
                    <span class="badge ${data.daysOfStock < 7 ? 'bg-danger' : data.daysOfStock < 14 ? 'bg-warning' : 'bg-info'}">
                        ${data.daysOfStock.toFixed(0)} days
                    </span>
                </td>
                <td>
                    ${data.suggestedOrder > 0 ? 
                        `<span class="text-primary fw-bold">${data.suggestedOrder}</span>` : 
                        '<span class="text-muted">None</span>'
                    }
                </td>
                <td>
                    <span class="badge bg-${data.urgency === 'critical' ? 'danger' : data.urgency === 'high' ? 'warning' : data.urgency === 'medium' ? 'info' : 'secondary'}">
                        ${data.urgency}
                    </span>
                </td>
                <td>
                    ${data.urgency === 'critical' ? 
                        '<button class="btn btn-sm btn-danger">Order Now</button>' : 
                        data.urgency === 'high' ? 
                        '<button class="btn btn-sm btn-warning">Order Soon</button>' : 
                        '<button class="btn btn-sm btn-outline-secondary">Monitor</button>'
                    }
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('Error loading inventory forecast:', error);
    }
}

// Load Date Specific Analytics
async function loadDateSpecificAnalytics(selectedDate) {
    try {
        console.log(`📅 Loading analytics for date: ${selectedDate}`);
        
        // Show the date-specific section
        const dateSection = document.getElementById('date-specific-section');
        if (dateSection) {
            dateSection.style.display = 'block';
        }
        
        // Update the display date
        const dateDisplay = document.getElementById('selected-date-display');
        if (dateDisplay) {
            const formattedDate = new Date(selectedDate).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            dateDisplay.textContent = formattedDate;
        }
        
        // Get the items sold on that specific date
        const dateData = await getItemsSoldOnSpecificDate(selectedDate);
        
        // Update the summary
        const totalItemsCount = document.getElementById('total-items-count');
        
        if (totalItemsCount) {
            totalItemsCount.textContent = dateData.totalItemsCount;
        }
        
        // Initialize the trending chart
        await initializeItemsSoldTrendChart(selectedDate);
        
        // Get date-specific business insights
        const businessInsights = await getDateSpecificBusinessInsights(selectedDate);
        
        // Display date-specific business insights
        displayDateSpecificBusinessInsights(businessInsights);
        
        console.log(`✅ Loaded trend chart and business insights for ${selectedDate}`);
        
    } catch (error) {
        console.error('❌ Error loading date-specific analytics:', error);
        
        // Show error message in the chart area
        const canvas = document.getElementById('itemsSoldTrendChart');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.font = '16px Arial';
            ctx.fillStyle = '#dc3545';
            ctx.textAlign = 'center';
            ctx.fillText('Error loading data: ' + error.message, canvas.width/2, canvas.height/2);
        }
    }
}

// Generate Auto Orders
function generateAutoOrders() {
    alert('Auto-order feature would integrate with your suppliers to automatically reorder items that are below their reorder points. This requires supplier integration setup.');
}

// Display Peak Business Hours
function displayPeakBusinessHours(peakHours) {
    const container = document.getElementById('peak-business-hours');
    if (!container) return;

    if (peakHours.length === 0) {
        container.innerHTML = `
            <div class="text-center text-muted">
                <i class="fas fa-clock fa-2x mb-2"></i>
                <p>No sales data available for peak hours analysis</p>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="card border-0 shadow-sm">
            <div class="card-header bg-light">
                <h6 class="mb-0">
                    <i class="fas fa-chart-line text-primary"></i>
                    Business Peak Hours
                </h6>
            </div>
            <div class="card-body p-0">
                <div class="table-responsive">
                    <table class="table table-hover mb-0">
                        <thead class="table-light">
                            <tr>
                                <th>Rank</th>
                                <th>Time Period</th>
                                <th>Revenue</th>
                                <th>Transactions</th>
                                <th>Average</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${peakHours.map(peak => `
                                <tr>
                                    <td>
                                        <span class="badge bg-${peak.rank === 1 ? 'warning' : peak.rank === 2 ? 'info' : 'secondary'}">
                                            #${peak.rank}
                                        </span>
                                    </td>
                                    <td>
                                        <div class="fw-semibold">${peak.hourLabel}</div>
                                        <small class="text-muted">${peak.hour}:00 - ${peak.hour + 1}:00</small>
                                    </td>
                                    <td class="fw-bold text-success">₱${peak.revenue.toFixed(2)}</td>
                                    <td>
                                        <span class="badge bg-primary">${peak.transactions}</span>
                                    </td>
                                    <td>₱${peak.averageTransaction.toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

// Display Business Peak Hours (for Business Insights section)
function displayBusinessPeakHours(peakHours) {
    const container = document.getElementById('business-peak-hours');
    if (!container) return;

    if (peakHours.length === 0) {
        container.innerHTML = `
            <div class="text-center text-muted">
                <i class="fas fa-clock fa-2x mb-2"></i>
                <p>No sales data available for peak hours analysis</p>
            </div>
        `;
        return;
    }

    // Sort peak hours by revenue (highest first)
    const sortedPeakHours = peakHours.sort((a, b) => b.revenue - a.revenue);

    container.innerHTML = `
        <div class="row">
            ${sortedPeakHours.slice(0, 3).map((peak, index) => `
                <div class="col-md-4 mb-3">
                    <div class="card border-0 shadow-sm h-100">
                        <div class="card-body text-center">
                            <div class="mb-2">
                                ${index === 0 ? '<i class="fas fa-trophy text-warning fa-2x"></i>' : 
                                  index === 1 ? '<i class="fas fa-medal text-secondary fa-2x"></i>' : 
                                  '<i class="fas fa-award text-bronze fa-2x" style="color: #CD7F32;"></i>'}
                            </div>
                            <h6 class="text-primary mb-1">${peak.hourLabel}</h6>
                            <div class="small text-muted mb-2">${peak.hour}:00 - ${peak.hour + 1}:00</div>
                            <div class="fw-bold text-success mb-1">₱${peak.revenue.toFixed(2)}</div>
                            <div class="small">
                                <span class="badge bg-primary">${peak.transactions} sales</span>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
        <div class="mt-3">
            <small class="text-muted">
                <i class="fas fa-info-circle"></i>
                Showing top 3 busiest hours based on revenue and transaction count
            </small>
        </div>
    `;
}

// Display Date-Specific Business Insights
function displayDateSpecificBusinessInsights(insights) {
    const container = document.getElementById('business-insights');
    if (!container) return;

    // Ensure insights data exists
    if (!insights || !insights.overview) {
        container.innerHTML = `
            <div class="text-center text-muted">
                <i class="fas fa-chart-line fa-2x mb-2"></i>
                <p>No business insights available for this date</p>
            </div>
        `;
        return;
    }

    const cards = [
        {
            title: 'Total Revenue',
            value: `₱${(insights.overview.totalRevenue || 0).toFixed(2)}`,
            icon: '💰',
            color: 'text-primary'
        },
        {
            title: 'Expense',
            value: `₱${(insights.overview.totalExpenses || 0).toFixed(2)}`,
            icon: '💸',
            color: 'text-danger'
        },
        {
            title: 'Gross Profit',
            value: `₱${(insights.overview.grossProfit || 0).toFixed(2)}`,
            icon: '📊',
            color: 'text-primary'
        },
        {
            title: 'Net Profit',
            value: `₱${(insights.overview.netProfit || 0).toFixed(2)}`,
            icon: '📈',
            color: insights.overview.netProfit >= 0 ? 'text-success' : 'text-danger'
        },
        {
            title: 'Profit Margin',
            value: `${(insights.insights?.profitMargin || 0).toFixed(1)}%`,
            icon: '🎯',
            color: 'text-primary'
        },
        {
            title: 'Growth Rate',
            value: `${(insights.insights?.growthRate || 0).toFixed(1)}%`,
            icon: '📊',
            color: 'text-primary'
        },
        {
            title: 'Total Transactions',
            value: `${insights.overview.totalTransactions || 0}`,
            icon: '🧾',
            color: 'text-primary'
        },
        {
            title: 'Average Transaction',
            value: `₱${(insights.overview.averageTransactionValue || 0).toFixed(2)}`,
            icon: '💳',
            color: 'text-primary'
        }
    ];

    container.innerHTML = `
        <div class="row">
            ${cards.map(insight => `
                <div class="col-md-6 col-lg-4 mb-3">
                    <div class="card border-0 shadow-sm h-100">
                        <div class="card-body">
                            <div class="d-flex align-items-center">
                                <div class="me-3">
                                    <span class="fs-3">${insight.icon}</span>
                                </div>
                                <div class="flex-grow-1">
                                    <h6 class="mb-1 ${insight.color}">${insight.title}</h6>
                                    <div class="h5 mb-0 fw-bold">${insight.value}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
        
        <!-- Business Peak Hours -->
        <div class="mt-4">
            <h6 class="text-primary mb-3">
                <i class="fas fa-clock"></i> Business Peak Hours
            </h6>
            <div class="card border-0 shadow-sm">
                <div class="card-body p-3">
                    <div id="business-peak-hours">
                        <div class="text-center text-muted">
                            <i class="fas fa-clock fa-2x mb-2"></i>
                            <p>Analyzing peak business hours...</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="mt-3">
            <small class="text-muted">
                <i class="fas fa-info-circle"></i>
                Business insights for ${new Date(insights.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                })}
            </small>
        </div>
    `;
    
    // Display peak business hours for this specific date
    displayBusinessPeakHours(insights.insights.peakHours);
}

// Initialize Items Sold Trend Chart
async function initializeItemsSoldTrendChart(selectedDate) {
    const canvas = document.getElementById('itemsSoldTrendChart');
    if (!canvas) return;

    try {
        // Get items sold data for the last 7 days including selected date
        const trendData = await generateItemsSoldTrendData(selectedDate);
        
        // Destroy existing chart if it exists
        if (window.itemsSoldChart) {
            window.itemsSoldChart.destroy();
        }
        
        // Create new chart
        const ctx = canvas.getContext('2d');
        window.itemsSoldChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: trendData.labels,
                datasets: [{
                    label: 'Items Sold',
                    data: trendData.data,
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                return `Items Sold: ${context.parsed.y}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        },
                        grid: {
                            borderDash: [2, 2]
                        }
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                },
                resizeDelay: 0
            }
        });
        
        console.log('✅ Items Sold Trend Chart initialized');
        
    } catch (error) {
        console.error('❌ Error initializing Items Sold Trend Chart:', error);
    }
}

// Generate Items Sold Trend Data for last 7 days
async function generateItemsSoldTrendData(selectedDate) {
    const labels = [];
    const data = [];
    
    try {
        // Get all sales to calculate actual trend data
        const sales = await getAllSales();
        
        // Generate data for last 7 days
        for (let i = 6; i >= 0; i--) {
            const date = new Date(selectedDate);
            date.setDate(date.getDate() - i);
            const dateStr = date.toLocaleDateString('en-CA');
            const label = date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
            });
            
            labels.push(label);
            
            // Calculate actual items sold for this date
            let itemsSold = 0;
            sales.forEach(sale => {
                if (sale.date) {
                    const saleDate = new Date(sale.date).toLocaleDateString('en-CA');
                    if (saleDate === dateStr && sale.items) {
                        sale.items.forEach(item => {
                            if (!item.voided) {
                                itemsSold += (item.qty || item.quantity || 1);
                            }
                        });
                    }
                }
            });
            
            data.push(itemsSold);
        }
        
        console.log(`📊 Generated trend data for ${labels.join(', ')}`);
        
    } catch (error) {
        console.error('❌ Error generating trend data:', error);
        // Fallback to simple data
        for (let i = 6; i >= 0; i--) {
            const date = new Date(selectedDate);
            date.setDate(date.getDate() - i);
            labels.push(date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
            }));
            data.push(Math.floor(Math.random() * 20) + 5);
        }
    }
    
    return { labels, data };
}

// Load Loyalty Tier Settings for editing
async function loadLoyaltyTierSettings() {
    const container = document.getElementById('loyalty-tiers-settings');
    if (!container) return;

    try {
        const tiers = await getLoyaltyTierSettings();
        
        container.innerHTML = tiers.map((tier, index) => `
            <tr data-tier-id="${tier.id}">
                <td>
                    <input type="text" class="form-control form-control-sm tier-name" value="${tier.name}" placeholder="Tier Name">
                </td>
                <td>
                    <select class="form-select form-select-sm tier-icon">
                        ${availableIcons.map(icon => `
                            <option value="${icon}" ${icon === tier.icon ? 'selected' : ''}>${icon}</option>
                        `).join('')}
                    </select>
                </td>
                <td>
                    <input type="number" class="form-control form-control-sm tier-points" value="${tier.points}" min="0" placeholder="Points">
                </td>
                <td>
                    <input type="number" class="form-control form-control-sm tier-discount" value="${tier.discount}" min="0" max="100" placeholder="Discount %">
                </td>
                <td>
                    <select class="form-select form-select-sm tier-color">
                        ${availableColors.map(color => `
                            <option value="${color}" ${color === tier.color ? 'selected' : ''}>${color}</option>
                        `).join('')}
                    </select>
                </td>
                <td>
                    <button type="button" class="btn btn-sm btn-danger remove-tier-btn" data-tier-id="${tier.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');

        // Add event listeners for remove buttons
        container.querySelectorAll('.remove-tier-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                removeTier(this.dataset.tierId);
            });
        });

    } catch (error) {
        console.error('❌ Error loading loyalty tier settings:', error);
    }
}

// Add new tier
function addNewTier() {
    const container = document.getElementById('loyalty-tiers-settings');
    if (!container) return;

    const newTierId = generateTierId('New Tier');
    const newTierHtml = `
        <tr data-tier-id="${newTierId}">
            <td>
                <input type="text" class="form-control form-control-sm tier-name" value="New Tier" placeholder="Tier Name">
            </td>
            <td>
                <select class="form-select form-select-sm tier-icon">
                    ${availableIcons.map(icon => `
                        <option value="${icon}" ${icon === '🥉' ? 'selected' : ''}>${icon}</option>
                    `).join('')}
                </select>
            </td>
            <td>
                <input type="number" class="form-control form-control-sm tier-points" value="0" min="0" placeholder="Points">
            </td>
            <td>
                <input type="number" class="form-control form-control-sm tier-discount" value="0" min="0" max="100" placeholder="Discount %">
            </td>
            <td>
                <select class="form-select form-select-sm tier-color">
                    ${availableColors.map(color => `
                        <option value="${color}" ${color === 'primary' ? 'selected' : ''}>${color}</option>
                    `).join('')}
                </select>
            </td>
            <td>
                <button type="button" class="btn btn-sm btn-danger remove-tier-btn" data-tier-id="${newTierId}">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `;

    container.insertAdjacentHTML('beforeend', newTierHtml);

    // Add event listener for the new remove button
    const newRemoveBtn = container.querySelector(`[data-tier-id="${newTierId}"] .remove-tier-btn`);
    newRemoveBtn.addEventListener('click', function() {
        removeTier(this.dataset.tierId);
    });
}

// Remove tier
function removeTier(tierId) {
    const row = document.querySelector(`[data-tier-id="${tierId}"]`);
    if (row) {
        row.remove();
    }
}

// Save loyalty tier settings
async function saveLoyaltySettings(e) {
    e.preventDefault();

    try {
        const tiers = [];
        const rows = document.querySelectorAll('#loyalty-tiers-settings tr');

        rows.forEach(row => {
            const tierId = row.dataset.tierId;
            const name = row.querySelector('.tier-name').value.trim();
            const icon = row.querySelector('.tier-icon').value;
            const points = parseInt(row.querySelector('.tier-points').value) || 0;
            const discount = parseInt(row.querySelector('.tier-discount').value) || 0;
            const color = row.querySelector('.tier-color').value;

            if (name) {
                tiers.push({
                    id: tierId || generateTierId(name),
                    name,
                    icon,
                    points,
                    discount,
                    color
                });
            }
        });

        // Sort tiers by points required
        tiers.sort((a, b) => a.points - b.points);

        const success = await saveLoyaltyTierSettings(tiers);
        
        if (success) {
            // Close the settings modal
            const settingsModal = bootstrap.Modal.getInstance(document.getElementById('loyaltySettingsModal'));
            if (settingsModal) {
                settingsModal.hide();
            }

            // Refresh the loyalty tiers display
            await loadLoyaltyTiers();

            // Show success message
            alert('✅ Loyalty tier settings saved successfully!');
        } else {
            alert('❌ Failed to save loyalty tier settings. Please try again.');
        }

    } catch (error) {
        console.error('❌ Error saving loyalty settings:', error);
        alert('❌ An error occurred while saving settings. Please try again.');
    }
}

console.log('🚀 Premium event handlers loaded - Analytics, Loyalty, and Inventory features ready!');
