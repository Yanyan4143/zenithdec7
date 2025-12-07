// Admin Premium Functions Event Handlers
// Connect admin premium UI elements to premium functions

document.addEventListener('DOMContentLoaded', function() {
    // Premium Tab Activation Handlers
    const adminAnalyticsTab = document.getElementById('admin-analytics-tab');
    if (adminAnalyticsTab) {
        adminAnalyticsTab.addEventListener('shown.bs.tab', async function() {
            console.log('📊 Analytics tab activated - loading data...');
            await loadAdminAnalytics();
        });
    }

    const employeeManagementTab = document.getElementById('employee-management-tab');
    if (employeeManagementTab) {
        employeeManagementTab.addEventListener('shown.bs.tab', async function() {
            console.log('👥 Employee Management tab activated - loading data...');
            await loadEmployeeManagement();
        });
    }

    const advancedReportsTab = document.getElementById('advanced-reports-tab');
    if (advancedReportsTab) {
        advancedReportsTab.addEventListener('shown.bs.tab', async function() {
            console.log('📈 Reports tab activated - loading data...');
            await loadAdvancedReports();
        });
    }

    const businessIntelligenceTab = document.getElementById('business-intelligence-tab');
    console.log('🔍 Business Intelligence tab element:', businessIntelligenceTab);
    if (businessIntelligenceTab) {
        console.log('✅ Adding event listener to Business Intelligence tab');
        businessIntelligenceTab.addEventListener('shown.bs.tab', async function() {
            console.log('🎯 Business Intelligence tab activated - loading data...');
            await loadBusinessIntelligence();
        });
        
        // Also add a simple click test
        businessIntelligenceTab.addEventListener('click', function() {
            console.log('🖱️ Business Intelligence tab button clicked!');
        });
    } else {
        console.log('❌ Business Intelligence tab element not found!');
    }

    // Refresh Admin Analytics Button
    const refreshAdminAnalyticsBtn = document.getElementById('refresh-admin-analytics-btn');
    if (refreshAdminAnalyticsBtn) {
        refreshAdminAnalyticsBtn.addEventListener('click', async function() {
            await loadAdminAnalytics();
        });
    }

    // Export Report Button Handler
    const exportReportBtn = document.getElementById('export-report-btn');
    if (exportReportBtn) {
        exportReportBtn.addEventListener('click', function() {
            // Placeholder for export functionality
            alert('Export Report functionality will be implemented here. This would allow users to export reports in various formats.');
        });
    }

});

// Manual test function for Business Intelligence tab
window.testBusinessIntelligenceTab = async function() {
    console.log('🧪 Testing Business Intelligence tab...');
    
    // Check if tab element exists
    const tab = document.getElementById('business-intelligence-tab');
    console.log('🔍 Tab element:', tab);
    
    // Check if tab pane exists
    const tabPane = document.getElementById('business-intelligence');
    console.log('🔍 Tab pane:', tabPane);
    
    // Check if adminTabPanel exists
    const adminTabPanel = document.getElementById('adminTabPanel');
    console.log('🔍 Admin Tab Panel:', adminTabPanel);
    
    // Try to activate tab using Bootstrap API
    if (tab && tabPane && adminTabPanel) {
        console.log('✅ All elements found, attempting to activate tab...');
        
        // First, let's try direct manual activation (bypass Bootstrap)
        console.log('🔄 Trying direct manual activation...');
        
        // Hide all other tab panes
        document.querySelectorAll('.tab-pane').forEach(pane => {
            console.log('🔍 Hiding tab pane:', pane.id);
            pane.classList.remove('show', 'active');
        });
        
        // Remove active class from all tab buttons
        document.querySelectorAll('.nav-link').forEach(link => {
            console.log('🔍 Deactivating tab button:', link.id);
            link.classList.remove('active');
            link.setAttribute('aria-selected', 'false');
        });
        
        // Show the business intelligence tab pane
        console.log('✅ Showing business-intelligence tab pane');
        tabPane.classList.add('show', 'active');
        
        // Activate the business intelligence tab button
        console.log('✅ Activating business-intelligence-tab button');
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');
        
        // Verify the tab is visible
        setTimeout(() => {
            console.log('🔍 Tab pane visibility check:');
            console.log('  - Tab pane classes:', tabPane.className);
            console.log('  - Tab pane display style:', window.getComputedStyle(tabPane).display);
            console.log('  - Tab pane visibility:', window.getComputedStyle(tabPane).visibility);
            console.log('  - Tab button classes:', tab.className);
            console.log('  - Admin Tab Panel children:', adminTabPanel.children.length);
            
            // List all tab panes in adminTabPanel
            console.log('🔍 All tab panes in adminTabPanel:');
            Array.from(adminTabPanel.children).forEach((child, index) => {
                console.log(`  ${index}: ${child.id} - classes: ${child.className} - visible: ${window.getComputedStyle(child).display !== 'none'}`);
            });
            
            // Load the data
            loadBusinessIntelligence().then(() => {
                console.log('✅ Business Intelligence tab data loaded');
            }).catch(error => {
                console.error('❌ Failed to load Business Intelligence data:', error);
            });
        }, 100);
        
    } else {
        console.log('❌ Tab elements not found!');
        console.log('🔍 Tab:', tab);
        console.log('🔍 Tab Pane:', tabPane);
        console.log('🔍 Admin Tab Panel:', adminTabPanel);
    }
};

// Simple visibility check for Business Intelligence tab
window.checkTabVisibility = function() {
    console.log('🔍 Checking Business Intelligence tab visibility...');
    
    const tabPane = document.getElementById('business-intelligence');
    const adminTabPanel = document.getElementById('adminTabPanel');
    
    if (!tabPane) {
        console.log('❌ Tab pane not found!');
        return;
    }
    
    if (!adminTabPanel) {
        console.log('❌ Admin Tab Panel not found!');
        return;
    }
    
    console.log('📊 Tab Pane Analysis:');
    console.log('  - Element exists:', !!tabPane);
    console.log('  - In DOM:', document.body.contains(tabPane));
    console.log('  - Parent element:', tabPane.parentElement?.id);
    console.log('  - Classes:', tabPane.className);
    console.log('  - Display style:', window.getComputedStyle(tabPane).display);
    console.log('  - Visibility:', window.getComputedStyle(tabPane).visibility);
    console.log('  - Opacity:', window.getComputedStyle(tabPane).opacity);
    console.log('  - Height:', window.getComputedStyle(tabPane).height);
    console.log('  - Width:', window.getComputedStyle(tabPane).width);
    console.log('  - Position:', window.getComputedStyle(tabPane).position);
    console.log('  - Z-index:', window.getComputedStyle(tabPane).zIndex);
    
    console.log('📊 Admin Tab Panel Analysis:');
    console.log('  - Element exists:', !!adminTabPanel);
    console.log('  - Children count:', adminTabPanel.children.length);
    console.log('  - Display style:', window.getComputedStyle(adminTabPanel).display);
    
    console.log('📊 All Tab Panes:');
    document.querySelectorAll('.tab-pane').forEach((pane, index) => {
        const styles = window.getComputedStyle(pane);
        console.log(`  ${index}: ${pane.id}`);
        console.log(`    - Classes: ${pane.className}`);
        console.log(`    - Display: ${styles.display}`);
        console.log(`    - Visible: ${styles.display !== 'none' && styles.visibility !== 'hidden' && styles.opacity !== '0'}`);
    });
};

// Load Admin Analytics Dashboard
async function loadAdminAnalytics() {
    try {
        const period = document.getElementById('admin-analytics-period')?.value || '30days';
        const analytics = await generateAdminAnalytics(period);
        
        if (!analytics) {
            console.error('Failed to load admin analytics');
            return;
        }

        // Display Financial Overview
        displayFinancialOverview(analytics.overview, analytics.financial);
        
        // Display Operations Metrics
        displayOperationsMetrics(analytics.operations);
        
        // Display Inventory Analytics
        displayInventoryAnalytics(analytics.inventory);
        
        // Display Forecasting Data
        displayForecastingData(analytics.forecasting);
        
        // Display Business Alerts
        displayBusinessAlerts(analytics.alerts);
        
    } catch (error) {
        console.error('Error loading admin analytics:', error);
    }
}

// Display Financial Overview
function displayFinancialOverview(overview, financial) {
    const container = document.getElementById('admin-financial-overview');
    if (!container) return;

    const metrics = [
        {
            title: 'Total Revenue',
            value: `₱${overview.totalRevenue.toFixed(2)}`,
            icon: '💰',
            color: 'text-success',
            trend: '+12.5%'
        },
        {
            title: 'Expense',
            value: `₱${overview.totalExpenses.toFixed(2)}`,
            icon: '💸',
            color: 'text-danger',
            trend: '+8.2%'
        },
        {
            title: 'Gross Profit',
            value: `₱${(overview.totalRevenue - financial.costOfGoodsSold).toFixed(2)}`,
            icon: '📊',
            color: 'text-primary',
            trend: `${financial.grossMargin.toFixed(1)}% margin`
        },
        {
            title: 'Net Profit',
            value: `₱${overview.netProfit.toFixed(2)}`,
            icon: '📈',
            color: overview.netProfit >= 0 ? 'text-success' : 'text-danger',
            trend: `${financial.profitMargin.toFixed(1)}% margin`
        },
        {
            title: 'Gross Margin',
            value: `${financial.grossMargin.toFixed(1)}%`,
            icon: '📊',
            color: financial.grossMargin >= 40 ? 'text-success' : 'text-warning',
            trend: '+5.4%'
        },
        {
            title: 'Transactions',
            value: overview.totalTransactions.toLocaleString(),
            icon: '🧾',
            color: 'text-info',
            trend: `Avg: ₱${overview.averageTransactionValue.toFixed(2)}`
        },
        {
            title: 'Items Sold',
            value: overview.totalItemsSold.toLocaleString(),
            icon: '📦',
            color: 'text-primary',
            trend: `${overview.uniqueCustomers} customers`
        }
    ];

    container.innerHTML = `
        <div class="row">
            ${metrics.map(metric => `
                <div class="col-md-6 col-lg-4 mb-3">
                    <div class="card border-0 shadow-sm h-100">
                        <div class="card-body">
                            <div class="d-flex align-items-center">
                                <div class="fs-3 me-3">${metric.icon}</div>
                                <div>
                                    <div class="small text-muted">${metric.title}</div>
                                    <div class="fw-bold ${metric.color}">${metric.value}</div>
                                    <small class="text-muted">${metric.trend}</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Display Operations Metrics
function displayOperationsMetrics(operations) {
    // Display Top Products Chart
    if (operations.topProducts && operations.topProducts.length > 0) {
        displayTopProductsChart(operations.topProducts);
    }
    
    // Display Sales by Hour Chart
    if (operations.salesByHour && operations.salesByHour.length > 0) {
        displaySalesByHourChart(operations.salesByHour);
    }
    
    // Display Category Performance
    if (operations.categoryPerformance && operations.categoryPerformance.length > 0) {
        displayCategoryPerformance(operations.categoryPerformance);
    }
    
    // Display Payment Methods
    if (operations.paymentMethods) {
        displayPaymentMethods(operations.paymentMethods);
    }
}

// Display Top Products Chart
function displayTopProductsChart(topProducts) {
    const canvas = document.getElementById('topProductsChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Destroy existing chart if it exists
    if (canvas.chart) {
        canvas.chart.destroy();
    }
    
    canvas.chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: topProducts.map(p => p.name),
            datasets: [{
                label: 'Revenue',
                data: topProducts.map(p => p.revenue),
                backgroundColor: 'rgba(54, 162, 235, 0.8)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '₱' + value.toLocaleString();
                        }
                    }
                }
            }
        }
    });
}

// Display Sales by Hour Chart
function displaySalesByHourChart(salesByHour) {
    const canvas = document.getElementById('salesByHourChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Destroy existing chart if it exists
    if (canvas.chart) {
        canvas.chart.destroy();
    }
    
    canvas.chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: salesByHour.map(h => h.hour + ':00'),
            datasets: [{
                label: 'Sales',
                data: salesByHour.map(h => h.sales),
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 2,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Display Category Performance
function displayCategoryPerformance(categoryPerformance) {
    const container = document.getElementById('categoryPerformance');
    if (!container) return;
    
    container.innerHTML = `
        <div class="list-group list-group-flush">
            ${categoryPerformance.map(cat => `
                <div class="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                        <div class="fw-bold">${cat.name}</div>
                        <small class="text-muted">${cat.itemsSold} items sold</small>
                    </div>
                    <div class="text-end">
                        <div class="fw-bold text-success">₱${cat.revenue.toFixed(2)}</div>
                        <small class="text-muted">${((cat.revenue / cat.totalRevenue) * 100).toFixed(1)}%</small>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Display Payment Methods
function displayPaymentMethods(paymentMethods) {
    const container = document.getElementById('paymentMethods');
    if (!container) return;
    
    const total = paymentMethods.cash + paymentMethods.gcash;
    
    container.innerHTML = `
        <div class="list-group list-group-flush">
            <div class="list-group-item d-flex justify-content-between align-items-center">
                <div>
                    <div class="fw-bold">💵 Cash</div>
                    <small class="text-muted">Physical payments</small>
                </div>
                <div class="text-end">
                    <div class="fw-bold">₱${paymentMethods.cash.toFixed(2)}</div>
                    <small class="text-muted">${total > 0 ? ((paymentMethods.cash / total) * 100).toFixed(1) : 0}%</small>
                </div>
            </div>
            <div class="list-group-item d-flex justify-content-between align-items-center">
                <div>
                    <div class="fw-bold">📱 GCash</div>
                    <small class="text-muted">Digital payments</small>
                </div>
                <div class="text-end">
                    <div class="fw-bold">₱${paymentMethods.gcash.toFixed(2)}</div>
                    <small class="text-muted">${total > 0 ? ((paymentMethods.gcash / total) * 100).toFixed(1) : 0}%</small>
                </div>
            </div>
        </div>
    `;
}

// Load Employee Management
async function loadEmployeeManagement() {
    try {
        console.log('👥 Loading Employee Management data...');
        
        // Get employee data from admin-premium-functions.js
        const employeeManagement = new window.EmployeeManagement();
        const employees = await employeeManagement.getAllEmployees();
        
        displayEmployeeList(employees);
        
    } catch (error) {
        console.error('Error loading employee management:', error);
    }
}

// Display Employee List
function displayEmployeeList(employees) {
    const container = document.getElementById('employee-list');
    if (!container) return;

    if (!employees || employees.length === 0) {
        container.innerHTML = `
            <div class="text-center py-4">
                <div class="fs-1 mb-3">👥</div>
                <h5>No Employees Found</h5>
                <p class="text-muted">Add your first employee to get started.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="table-responsive">
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Position</th>
                        <th>Department</th>
                        <th>Status</th>
                        <th>Performance</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${employees.map(employee => `
                        <tr>
                            <td>
                                <div class="d-flex align-items-center">
                                    <div class="avatar-sm bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-2">
                                        ${employee.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                    </div>
                                    <div>
                                        <div class="fw-bold">${employee.name}</div>
                                        <small class="text-muted">${employee.email}</small>
                                    </div>
                                </div>
                            </td>
                            <td>${employee.position}</td>
                            <td>${employee.department}</td>
                            <td>
                                <span class="badge ${employee.status === 'active' ? 'bg-success' : 'bg-secondary'}">
                                    ${employee.status}
                                </span>
                            </td>
                            <td>
                                <div class="progress" style="height: 8px;">
                                    <div class="progress-bar ${employee.performance >= 80 ? 'bg-success' : employee.performance >= 60 ? 'bg-warning' : 'bg-danger'}" 
                                         style="width: ${employee.performance}%">
                                    </div>
                                </div>
                                <small>${employee.performance}%</small>
                            </td>
                            <td>
                                <button class="btn btn-sm btn-outline-primary" onclick="editEmployee('${employee.id}')">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-danger" onclick="deleteEmployee('${employee.id}')">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// Load Advanced Reports
async function loadAdvancedReports() {
    try {
        console.log('📈 Loading Advanced Reports...');
        
        // Get reports data from admin-premium-functions.js
        const reporting = new window.AdvancedReporting();
        const reports = await reporting.getRecentReports();
        
        displayReportTemplates();
        displayRecentReports(reports);
        
    } catch (error) {
        console.error('Error loading advanced reports:', error);
    }
}

// Display Report Templates
function displayReportTemplates() {
    const container = document.getElementById('report-templates');
    if (!container) return;

    const templates = [
        { id: 'financial', name: 'Financial Summary', icon: '💰', description: 'Revenue, expenses, and profit analysis' },
        { id: 'sales', name: 'Sales Performance', icon: '📊', description: 'Sales trends and product performance' },
        { id: 'inventory', name: 'Inventory Report', icon: '📦', description: 'Stock levels and inventory analysis' },
        { id: 'employee', name: 'Employee Performance', icon: '👥', description: 'Staff productivity and metrics' }
    ];

    container.innerHTML = `
        <div class="row">
            ${templates.map(template => `
                <div class="col-md-6 mb-3">
                    <div class="card border-0 shadow-sm h-100">
                        <div class="card-body">
                            <div class="d-flex align-items-center">
                                <div class="fs-3 me-3">${template.icon}</div>
                                <div class="flex-grow-1">
                                    <h6 class="card-title mb-1">${template.name}</h6>
                                    <small class="text-muted">${template.description}</small>
                                </div>
                            </div>
                            <button class="btn btn-sm btn-primary mt-2" onclick="generateReport('${template.id}')">
                                Generate Report
                            </button>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Display Recent Reports
function displayRecentReports(reports) {
    const container = document.getElementById('recent-reports');
    if (!container) return;

    if (!reports || reports.length === 0) {
        container.innerHTML = `
            <div class="text-center py-4">
                <div class="fs-1 mb-3">📄</div>
                <h5>No Recent Reports</h5>
                <p class="text-muted">Generate your first report to see it here.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="list-group">
            ${reports.map(report => `
                <div class="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                        <div class="fw-bold">${report.name}</div>
                        <small class="text-muted">Generated ${new Date(report.generatedAt).toLocaleString()}</small>
                    </div>
                    <div>
                        <button class="btn btn-sm btn-outline-primary" onclick="viewReport('${report.id}')">
                            <i class="fas fa-eye"></i> View
                        </button>
                        <button class="btn btn-sm btn-outline-success" onclick="downloadReport('${report.id}')">
                            <i class="fas fa-download"></i> Download
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

async function loadBusinessIntelligence() {
    try {
        console.log('🎯 Loading Business Intelligence...');
        
        // Show loading states
        updateIntelligenceLoadingStates(true);
        
        // Call the Business Intelligence function from admin-premium-functions.js
        // This function handles all the data loading and display internally
        await window.loadBusinessIntelligenceData();
        
        // Update real-time metrics (if needed)
        updateRealTimeMetrics();
        
        updateIntelligenceLoadingStates(false);
        console.log('✅ Business Intelligence loaded successfully');
        
    } catch (error) {
        console.error('❌ Error loading Business Intelligence:', error);
        updateIntelligenceLoadingStates(false);
        
        // Display error message
        const containers = ['executive-summary', 'kpi-dashboard', 'operational-insights', 'ai-recommendations'];
        containers.forEach(id => {
            const container = document.getElementById(id);
            if (container) {
                container.innerHTML = `
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        Failed to load Business Intelligence data. Please try again.
                    </div>
                `;
            }
        });
    }
}

// Update intelligence loading states
function updateIntelligenceLoadingStates(loading) {
    const containers = ['executive-summary', 'kpi-dashboard', 'operational-insights', 'ai-recommendations'];
    
    containers.forEach(id => {
        const container = document.getElementById(id);
        if (container) {
            if (loading) {
                container.innerHTML = `
                    <div class="text-center py-4">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                        <div class="mt-2 text-muted">Loading Business Intelligence data...</div>
                    </div>
                `;
            }
        }
    });
}

// Animate numeric values
function animateValue(element, start, end, duration) {
    const startTimestamp = Date.now();
    const step = () => {
        const timestamp = Date.now();
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const value = Math.floor(progress * (end - start) + start);
        element.textContent = `₱${value.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        if (progress < 1) {
            requestAnimationFrame(step);
        }
    };
    requestAnimationFrame(step);
}

// Update real-time metrics
function updateRealTimeMetrics() {
    // Update live revenue with sample data for now
    const liveRevenueEl = document.getElementById('live-revenue');
    if (liveRevenueEl) {
        const revenue = Math.floor(Math.random() * 50000) + 10000;
        liveRevenueEl.textContent = `₱${revenue.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        animateValue(liveRevenueEl, 0, revenue, 2000);
    }
    
    // Update AI performance score
    const aiScoreEl = document.getElementById('ai-performance-score');
    if (aiScoreEl) {
        const score = Math.floor(Math.random() * 30) + 70; // 70-100 range
        aiScoreEl.textContent = `${score}%`;
    }
    
    // Update risk level
    const riskLevelEl = document.getElementById('risk-level');
    if (riskLevelEl) {
        const risks = ['Low', 'Medium', 'High'];
        const risk = risks[Math.floor(Math.random() * risks.length)];
        riskLevelEl.textContent = risk;
        riskLevelEl.className = `risk-${risk.toLowerCase()}`;
    }
    
    // Update growth rate
    const growthRateEl = document.getElementById('growth-rate');
    if (growthRateEl) {
        const growth = (Math.random() * 40) - 10; // -10 to +30 range
        growthRateEl.textContent = `${growth > 0 ? '+' : ''}${growth.toFixed(1)}%`;
    }
}

// Initialize advanced charts
function initializeAdvancedCharts(report) {
    // Revenue Prediction Chart
    initializeRevenuePredictionChart(report);
    
    // Target Gauge Chart
    initializeTargetGaugeChart(report);
    
    // Revenue Distribution Chart
    initializeRevenueDistributionChart(report);
}

// Revenue Prediction Chart
function initializeRevenuePredictionChart(report) {
    const ctx = document.getElementById('revenue-prediction-chart');
    if (!ctx) return;
    
    // Generate predictive data
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const actualData = generateMonthlyRevenueData(report);
    const predictedData = generatePredictedRevenueData(actualData);
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [{
                label: 'Actual Revenue',
                data: actualData,
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4
            }, {
                label: 'Predicted Revenue',
                data: predictedData,
                borderColor: '#764ba2',
                backgroundColor: 'rgba(118, 75, 162, 0.1)',
                borderWidth: 3,
                borderDash: [5, 5],
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ₱' + context.parsed.y.toLocaleString('en-PH');
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '₱' + value.toLocaleString('en-PH');
                        }
                    }
                }
            }
        }
    });
}

// Target Gauge Chart
function initializeTargetGaugeChart(report) {
    const ctx = document.getElementById('target-gauge-chart');
    if (!ctx) return;
    
    const achievement = calculateTargetAchievement(report);
    
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            datasets: [{
                data: [achievement, 100 - achievement],
                backgroundColor: [
                    achievement >= 80 ? '#10b981' : achievement >= 60 ? '#f59e0b' : '#ef4444',
                    '#e5e7eb'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            circumference: 180,
            rotation: -90,
            cutout: '75%',
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    enabled: false
                }
            }
        },
        plugins: [{
            beforeDraw: function(chart) {
                const width = chart.width;
                const height = chart.height;
                const ctx = chart.ctx;
                
                ctx.restore();
                const fontSize = (height / 114).toFixed(2);
                ctx.font = fontSize + "em sans-serif";
                ctx.textBaseline = "middle";
                
                const text = achievement.toFixed(1) + "%";
                const textX = Math.round((width - ctx.measureText(text).width) / 2);
                const textY = height / 2 + 20;
                
                ctx.fillStyle = achievement >= 80 ? '#10b981' : achievement >= 60 ? '#f59e0b' : '#ef4444';
                ctx.fillText(text, textX, textY);
                ctx.save();
            }
        }]
    });
}

// Revenue Distribution Chart
function initializeRevenueDistributionChart(report) {
    const ctx = document.getElementById('revenue-distribution-chart');
    if (!ctx) return;
    
    const categories = generateRevenueCategories(report);
    
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: categories.labels,
            datasets: [{
                data: categories.data,
                backgroundColor: [
                    '#667eea',
                    '#764ba2',
                    '#10b981',
                    '#f59e0b',
                    '#ef4444',
                    '#3b82f6'
                ],
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = '₱' + context.parsed.toLocaleString('en-PH');
                            const percentage = ((context.parsed / categories.data.reduce((a, b) => a + b, 0)) * 100).toFixed(1);
                            return label + ': ' + value + ' (' + percentage + '%)';
                        }
                    }
                }
            }
        }
    });
}

// Load Forecast Analysis
async function loadForecastAnalysis(report) {
    const container = document.getElementById('forecast-analysis');
    if (!container) return;
    
    const forecast = generateForecastData(report);
    
    container.innerHTML = `
        <div class="insight-card">
            <div class="insight-icon info">
                <i class="fas fa-chart-line"></i>
            </div>
            <h6>Next Month Forecast</h6>
            <p class="mb-1"><strong>₱${forecast.nextMonth.toLocaleString('en-PH')}</strong></p>
            <small class="text-muted">Based on current trends</small>
        </div>
        <div class="insight-card">
            <div class="insight-icon success">
                <i class="fas fa-trending-up"></i>
            </div>
            <h6>Growth Projection</h6>
            <p class="mb-1"><strong>+${forecast.growthRate.toFixed(1)}%</strong></p>
            <small class="text-muted">Quarterly projection</small>
        </div>
        <div class="insight-card">
            <div class="insight-icon warning">
                <i class="fas fa-calendar-alt"></i>
            </div>
            <h6>Peak Season</h6>
            <p class="mb-1"><strong>${forecast.peakSeason}</strong></p>
            <small class="text-muted">Highest revenue period</small>
        </div>
    `;
}

// Load Risk Assessment
async function loadRiskAssessment(report) {
    const container = document.getElementById('risk-assessment');
    if (!container) return;
    
    const risks = assessRisks(report);
    
    container.innerHTML = risks.map(risk => `
        <div class="insight-card">
            <div class="insight-icon ${risk.severity}">
                <i class="fas fa-${risk.icon}"></i>
            </div>
            <h6>${risk.title}</h6>
            <p class="mb-1"><strong>${risk.level}</strong></p>
            <small class="text-muted">${risk.description}</small>
        </div>
    `).join('');
}

// Load Performance Score
async function loadPerformanceScore(report) {
    const container = document.getElementById('performance-score');
    if (!container) return;
    
    const score = calculateOverallPerformance(report);
    
    container.innerHTML = `
        <div class="text-center">
            <div class="ai-score-badge mb-3">
                Overall Score: ${score.overall}%
            </div>
            <div class="row">
                <div class="col-6">
                    <small class="text-muted">Revenue</small>
                    <div class="progress mb-2" style="height: 8px;">
                        <div class="progress-bar bg-success" style="width: ${score.revenue}%"></div>
                    </div>
                    <small>${score.revenue}%</small>
                </div>
                <div class="col-6">
                    <small class="text-muted">Operations</small>
                    <div class="progress mb-2" style="height: 8px;">
                        <div class="progress-bar bg-info" style="width: ${score.operations}%"></div>
                    </div>
                    <small>${score.operations}%</small>
                </div>
                <div class="col-6">
                    <small class="text-muted">Efficiency</small>
                    <div class="progress mb-2" style="height: 8px;">
                        <div class="progress-bar bg-warning" style="width: ${score.efficiency}%"></div>
                    </div>
                    <small>${score.efficiency}%</small>
                </div>
                <div class="col-6">
                    <small class="text-muted">Growth</small>
                    <div class="progress mb-2" style="height: 8px;">
                        <div class="progress-bar bg-primary" style="width: ${score.growth}%"></div>
                    </div>
                    <small>${score.growth}%</small>
                </div>
            </div>
        </div>
    `;
}

// Load Real-time Activity
async function loadRealTimeActivity() {
    const container = document.getElementById('activity-feed');
    if (!container) return;
    
    // Generate sample activity data
    const activities = generateRealTimeActivities();
    
    container.innerHTML = activities.map(activity => `
        <div class="activity-item ${activity.type}">
            <div class="d-flex justify-content-between align-items-start">
                <div>
                    <strong>${activity.title}</strong>
                    <p class="mb-1 small">${activity.description}</p>
                    <small class="text-muted">${activity.time}</small>
                </div>
                <i class="fas fa-${activity.icon} text-${activity.type}"></i>
            </div>
        </div>
    `).join('');
}

// Helper functions
function updateIntelligenceLoadingStates(loading) {
    const elements = ['executive-summary', 'kpi-dashboard', 'operational-insights', 'ai-recommendations'];
    
    elements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            if (loading) {
                element.innerHTML = '<div class="text-center"><i class="fas fa-spinner fa-spin me-2"></i>Loading...</div>';
            }
        }
    });
}

function animateValue(element, start, end, duration) {
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const current = Math.floor(start + (end - start) * progress);
        element.textContent = `₱${current.toLocaleString('en-PH')}`;
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    requestAnimationFrame(update);
}

// Data generation functions
function calculateAIScore(report) {
    let score = 75; // Base score
    
    if (report.financialMetrics?.profitMargin > 20) score += 10;
    if (report.operationalMetrics?.inventoryAlerts?.critical === 0) score += 5;
    if (report.recommendations?.length > 5) score += 5;
    if (report.financialMetrics?.totalRevenue > 10000) score += 5;
    
    return Math.min(score, 100);
}

function assessRiskLevel(report) {
    const risks = assessRisks(report);
    const highRisks = risks.filter(r => r.level === 'High').length;
    
    if (highRisks >= 2) return 'High';
    if (highRisks >= 1) return 'Medium';
    return 'Low';
}

function calculateGrowthRate(report) {
    // Simulate growth rate calculation
    return 12.5 + Math.random() * 10 - 5; // Between 7.5% and 17.5%
}

function generateMonthlyRevenueData(report) {
    const baseRevenue = report.financialMetrics?.totalRevenue || 10000;
    return Array.from({length: 12}, (_, i) => {
        const seasonal = 1 + 0.3 * Math.sin((i / 12) * 2 * Math.PI);
        const random = 0.8 + Math.random() * 0.4;
        return Math.floor(baseRevenue * seasonal * random / 12);
    });
}

function generatePredictedRevenueData(actualData) {
    return actualData.map((value, index) => {
        const growth = 1.05 + (index * 0.01); // 5% growth + monthly acceleration
        return Math.floor(value * growth);
    });
}

function generateRevenueCategories(report) {
    return {
        labels: ['Beverages', 'Food', 'Snacks', 'Merchandise', 'Services', 'Other'],
        data: [35, 25, 15, 10, 10, 5].map(v => v * 100 + Math.random() * 1000)
    };
}

function calculateTargetAchievement(report) {
    const target = 50000; // Monthly target
    const actual = report.financialMetrics?.totalRevenue || 25000;
    return Math.min((actual / target) * 100, 100);
}

function generateForecastData(report) {
    const currentRevenue = report.financialMetrics?.totalRevenue || 25000;
    return {
        nextMonth: Math.floor(currentRevenue * (1.05 + Math.random() * 0.1)),
        growthRate: 5 + Math.random() * 10,
        peakSeason: ['December', 'June', 'March'][Math.floor(Math.random() * 3)]
    };
}

function assessRisks(report) {
    return [
        {
            title: 'Inventory Risk',
            level: report.operationalMetrics?.inventoryAlerts?.critical > 0 ? 'Medium' : 'Low',
            severity: 'warning',
            icon: 'exclamation-triangle',
            description: 'Stock levels need attention'
        },
        {
            title: 'Revenue Risk',
            level: report.financialMetrics?.profitMargin < 15 ? 'High' : 'Low',
            severity: report.financialMetrics?.profitMargin < 15 ? 'danger' : 'success',
            icon: 'chart-line',
            description: 'Profit margins analysis'
        },
        {
            title: 'Operational Risk',
            level: 'Low',
            severity: 'success',
            icon: 'cogs',
            description: 'Operations running smoothly'
        }
    ];
}

function calculateOverallPerformance(report) {
    return {
        overall: Math.floor(75 + Math.random() * 20),
        revenue: Math.floor(70 + Math.random() * 25),
        operations: Math.floor(80 + Math.random() * 15),
        efficiency: Math.floor(75 + Math.random() * 20),
        growth: Math.floor(70 + Math.random() * 25)
    };
}

function generateRealTimeActivities() {
    const activities = [
        { type: 'success', title: 'New Sale', description: 'Order #1234 completed', icon: 'check-circle', time: '2 minutes ago' },
        { type: 'info', title: 'Inventory Update', description: 'Stock levels refreshed', icon: 'sync', time: '5 minutes ago' },
        { type: 'warning', title: 'Low Stock Alert', description: 'Coca Cola running low', icon: 'exclamation-triangle', time: '8 minutes ago' },
        { type: 'success', title: 'Payment Received', description: 'GCash payment processed', icon: 'credit-card', time: '12 minutes ago' },
        { type: 'info', title: 'Report Generated', description: 'Daily sales report ready', icon: 'file-alt', time: '15 minutes ago' }
    ];
    
    return activities.slice(0, 3 + Math.floor(Math.random() * 3));
}

// Additional global functions
window.generatePredictiveReport = async function() {
    console.log('🔮 Generating predictive report...');
    // Implementation for predictive report generation
    alert('Predictive report generation feature coming soon!');
};

window.exportIntelligenceReport = async function() {
    console.log('📥 Exporting intelligence report...');
    // Implementation for report export
    alert('Intelligence report export feature coming soon!');
};

// Display KPI Dashboard
function displayKPIDashboard(financialMetrics) {
    const container = document.getElementById('kpi-dashboard');
    if (!container) return;

    console.log('📊 KPI Dashboard data received:', financialMetrics);

    // Extract values from nested structure with safety checks
    const revenue = typeof financialMetrics.revenue?.current === 'number' ? financialMetrics.revenue.current : 
                   parseFloat(financialMetrics.revenue?.current) || 0;
    const profitMargin = typeof financialMetrics.margin?.current === 'number' ? financialMetrics.margin.current : 
                        parseFloat(financialMetrics.margin?.current) || 0;
    const averageTransaction = revenue > 0 && typeof financialMetrics.transactions?.current === 'number' ? 
                              revenue / financialMetrics.transactions.current : 0;
    const revenuePerTransaction = averageTransaction; // Same as average transaction

    console.log('💰 Processed values:', { revenue, profitMargin, averageTransaction, revenuePerTransaction });

    container.innerHTML = `
        <div class="card border-0 shadow-sm">
            <div class="card-body">
                <h5 class="card-title mb-3">Key Performance Indicators</h5>
                <div class="row">
                    <div class="col-md-3">
                        <div class="text-center">
                            <div class="fs-2 mb-2">💰</div>
                            <div class="fw-bold text-success">₱${revenue.toFixed(2)}</div>
                            <small class="text-muted">Total Revenue</small>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="text-center">
                            <div class="fs-2 mb-2">📈</div>
                            <div class="fw-bold text-primary">${(profitMargin * 100).toFixed(1)}%</div>
                            <small class="text-muted">Profit Margin</small>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="text-center">
                            <div class="fs-2 mb-2">💳</div>
                            <div class="fw-bold text-info">₱${averageTransaction.toFixed(2)}</div>
                            <small class="text-muted">Avg Transaction</small>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="text-center">
                            <div class="fs-2 mb-2">🎯</div>
                            <div class="fw-bold text-warning">₱${revenuePerTransaction.toFixed(2)}</div>
                            <small class="text-muted">Revenue per Transaction</small>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Display Operational Insights
function displayOperationalInsights(operationalMetrics) {
    const container = document.getElementById('operational-insights');
    if (!container) return;

    console.log('🔍 Operational Insights data:', operationalMetrics);
    console.log('📊 Peak Hours:', operationalMetrics.peakHours);
    console.log('⚠️ Inventory Alerts:', operationalMetrics.inventoryAlerts);

    container.innerHTML = `
        <div class="card border-0 shadow-sm">
            <div class="card-body">
                <h5 class="card-title mb-3">Operational Insights</h5>
                <div class="row">
                    <div class="col-md-6">
                        <h6>Peak Sales Hours</h6>
                        ${operationalMetrics.peakHours && operationalMetrics.peakHours.length > 0 ? operationalMetrics.peakHours.slice(0, 3).map(hour => {
                            const sales = hour.sales || 0;
                            const maxSales = Math.max(...operationalMetrics.peakHours.filter(h => h.sales).map(h => h.sales)) || 1;
                            return `
                                <div class="d-flex justify-content-between align-items-center mb-2">
                                    <span>${hour.hour || 'N/A'}:00</span>
                                    <div class="progress" style="width: 100px; height: 6px;">
                                        <div class="progress-bar bg-primary" style="width: ${(sales / maxSales) * 100}%"></div>
                                    </div>
                                    <span class="ms-2">₱${(typeof sales === 'number' ? sales : 0).toFixed(2)}</span>
                                </div>
                            `;
                        }).join('') : '<p class="text-muted">No peak hours data available</p>'}
                    </div>
                    <div class="col-md-6">
                        <h6>Inventory Alerts</h6>
                        <div class="mb-3">
                            <div class="d-flex justify-content-between">
                                <span>Critical Items:</span>
                                <span class="badge bg-danger">${operationalMetrics.inventoryAlerts?.critical || 0}</span>
                            </div>
                        </div>
                        <div class="mb-3">
                            <div class="d-flex justify-content-between">
                                <span>Low Stock Items:</span>
                                <span class="badge bg-warning">${operationalMetrics.inventoryAlerts?.low || 0}</span>
                            </div>
                        </div>
                        <div class="mb-3">
                            <div class="d-flex justify-content-between">
                                <span>Total Alerts:</span>
                                <span class="badge bg-info">${operationalMetrics.inventoryAlerts?.total || 0}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Display AI Recommendations
function displayAIRecommendations(recommendations) {
    const container = document.getElementById('ai-recommendations');
    if (!container) return;

    if (!recommendations || recommendations.length === 0) {
        container.innerHTML = `
            <div class="card border-0 shadow-sm">
                <div class="card-body text-center py-4">
                    <div class="fs-1 mb-3">🤖</div>
                    <h5>No Recommendations</h5>
                    <p class="text-muted">Your business is performing well! No specific recommendations at this time.</p>
                </div>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="list-group">
            ${recommendations.map(rec => `
                <div class="list-group-item">
                    <div class="d-flex align-items-start">
                        <div class="fs-3 me-3">🤖</div>
                        <div class="flex-grow-1">
                            <div class="fw-bold">${rec.title}</div>
                            <div class="small text-muted">${rec.description}</div>
                            <div class="mt-2">
                                <span class="badge bg-${rec.priority === 'critical' ? 'danger' : rec.priority === 'high' ? 'warning' : 'info'}">${rec.priority}</span>
                                <span class="badge bg-primary ms-1">${rec.type}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Add Employee Button Handler
const addEmployeeBtn = document.getElementById('add-employee-btn');
if (addEmployeeBtn) {
    addEmployeeBtn.addEventListener('click', function() {
        // Placeholder for add employee functionality
        alert('Add Employee functionality will be implemented here. This would open a modal to add new employees.');
    });
}

// Generate Report Button Handler  
const generateReportBtn = document.getElementById('generate-report-btn');
if (generateReportBtn) {
    generateReportBtn.addEventListener('click', async function() {
        // Placeholder for generate report functionality
        alert('Generate Report functionality will be implemented here. This would allow users to generate custom reports.');
    });
}


// Display Inventory Analytics
function displayInventoryAnalytics(inventory) {
    const container = document.getElementById('admin-inventory-analytics');
    if (!container) return;

    const metrics = [
        {
            title: 'Total Items',
            value: inventory.totalItems.toLocaleString(),
            icon: '📦',
            color: 'text-primary'
        },
        {
            title: 'Low Stock Items',
            value: inventory.lowStockItems,
            icon: '⚠️',
            color: inventory.lowStockItems > 0 ? 'text-warning' : 'text-success'
        },
        {
            title: 'Out of Stock',
            value: inventory.outOfStockItems,
            icon: '🚫',
            color: inventory.outOfStockItems > 0 ? 'text-danger' : 'text-success'
        },
        {
            title: 'Total Value',
            value: `₱${inventory.totalInventoryValue.toFixed(2)}`,
            icon: '💰',
            color: 'text-success'
        },
        {
            title: 'Turnover Rate',
            value: inventory.inventoryTurnover.toFixed(2),
            icon: '🔄',
            color: inventory.inventoryTurnover >= 4 ? 'text-success' : 'text-warning'
        }
    ];

    container.innerHTML = `
        <div class="row">
            ${metrics.map(metric => `
                <div class="col-md-6 col-lg-4 mb-3">
                    <div class="card border-0 shadow-sm h-100">
                        <div class="card-body text-center">
                            <div class="fs-2">${metric.icon}</div>
                            <div class="small text-muted">${metric.title}</div>
                            <div class="fw-bold ${metric.color}">${metric.value}</div>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Display Forecasting Data
function displayForecastingData(forecasting) {
    const container = document.getElementById('admin-forecasting');
    if (!container) return;

    container.innerHTML = `
        <div class="row">
            <div class="col-md-6">
                <div class="card border-0 shadow-sm mb-3">
                    <div class="card-body">
                        <h6>Next Month Revenue Forecast</h6>
                        <div class="h3 text-primary">₱${forecasting.nextMonthRevenue.toFixed(2)}</div>
                        <small class="text-muted">Based on current trends</small>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="card border-0 shadow-sm mb-3">
                    <div class="card-body">
                        <h6>Yearly Projection</h6>
                        <div class="h3 text-success">₱${forecasting.yearlyProjection.toFixed(2)}</div>
                        <small class="text-muted">Annual revenue estimate</small>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="card border-0 shadow-sm">
            <div class="card-body">
                <h6>Growth Forecast</h6>
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <div class="fw-bold">Current: ₱${forecasting.growthForecast.current.toFixed(2)}</div>
                        <div class="fw-bold">Projected: ₱${forecasting.growthForecast.projected.toFixed(2)}</div>
                    </div>
                    <div class="text-end">
                        <div class="badge ${forecasting.growthForecast.growthRate >= 0 ? 'bg-success' : 'bg-danger'}">
                            ${forecasting.growthForecast.growthRate >= 0 ? '+' : ''}${forecasting.growthForecast.growthRate.toFixed(1)}%
                        </div>
                        <div class="small text-muted">Confidence: ${forecasting.growthForecast.confidence}</div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Display Business Alerts
function displayBusinessAlerts(alerts) {
    const container = document.getElementById('admin-business-alerts');
    if (!container) return;

    if (alerts.length === 0) {
        container.innerHTML = '<div class="alert alert-success">No business alerts at this time. All systems operating normally!</div>';
        return;
    }

    container.innerHTML = alerts.map(alert => `
        <div class="alert alert-${alert.type === 'critical' ? 'danger' : alert.type === 'warning' ? 'warning' : 'info'} d-flex align-items-center">
            <div class="me-3">
                <strong>${alert.title}</strong>
                <div class="small">${alert.message}</div>
                ${alert.items ? `<div class="small text-muted">Items: ${alert.items.slice(0, 3).join(', ')}${alert.items.length > 3 ? '...' : ''}</div>` : ''}
            </div>
            <div class="ms-auto">
                <button class="btn btn-sm btn-outline-${alert.type === 'critical' ? 'danger' : alert.type === 'warning' ? 'warning' : 'info'}">
                    ${alert.action}
                </button>
            </div>
        </div>
    `).join('');
}

// Load Employee Management
function loadEmployeeManagement() {
    displayEmployeeList();
    displayPerformanceMetrics();
    displayEmployeeSchedule();
}

// Display Employee List
function displayEmployeeList() {
    const container = document.getElementById('employee-list');
    if (!container) return;

    const employees = employeeManagement.getAllEmployees();
    
    container.innerHTML = `
        <div class="table-responsive">
            <table class="table table-sm">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Position</th>
                        <th>Department</th>
                        <th>Status</th>
                        <th>Hire Date</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${employees.map(employee => `
                        <tr>
                            <td>${employee.name}</td>
                            <td>${employee.position}</td>
                            <td>${employee.department}</td>
                            <td>
                                <span class="badge bg-${employee.status === 'active' ? 'success' : 'secondary'}">
                                    ${employee.status}
                                </span>
                            </td>
                            <td>${new Date(employee.hireDate).toLocaleDateString()}</td>
                            <td>
                                <button class="btn btn-sm btn-outline-primary" onclick="viewEmployeeDetails('${employee.id}')">
                                    View
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// Display Performance Metrics
function displayPerformanceMetrics() {
    const container = document.getElementById('performance-metrics');
    if (!container) return;

    // This would show aggregated performance data for all employees
    container.innerHTML = `
        <div class="row">
            <div class="col-md-3">
                <div class="card border-0 shadow-sm text-center">
                    <div class="card-body">
                        <div class="h4 text-primary">12</div>
                        <div class="small text-muted">Total Employees</div>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card border-0 shadow-sm text-center">
                    <div class="h4 text-success">95%</div>
                    <div class="small text-muted">Attendance Rate</div>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card border-0 shadow-sm text-center">
                    <div class="h4 text-info">4.5</div>
                    <div class="small text-muted">Avg Performance Score</div>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card border-0 shadow-sm text-center">
                    <div class="h4 text-warning">2</div>
                    <div class="small text-muted">Need Training</div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Display Employee Schedule
function displayEmployeeSchedule() {
    const container = document.getElementById('employee-schedule');
    if (!container) return;

    // This would show the current week's schedule
    container.innerHTML = `
        <div class="card border-0 shadow-sm">
            <div class="card-body">
                <h6>This Week's Schedule</h6>
                <div class="table-responsive">
                    <table class="table table-sm">
                        <thead>
                            <tr>
                                <th>Employee</th>
                                <th>Mon</th>
                                <th>Tue</th>
                                <th>Wed</th>
                                <th>Thu</th>
                                <th>Fri</th>
                                <th>Sat</th>
                                <th>Sun</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>John Doe</td>
                                <td><span class="badge bg-success">9-5</span></td>
                                <td><span class="badge bg-success">9-5</span></td>
                                <td><span class="badge bg-success">9-5</span></td>
                                <td><span class="badge bg-success">9-5</span></td>
                                <td><span class="badge bg-success">9-5</span></td>
                                <td><span class="badge bg-secondary">Off</span></td>
                                <td><span class="badge bg-secondary">Off</span></td>
                            </tr>
                            <tr>
                                <td>Jane Smith</td>
                                <td><span class="badge bg-warning">2-10</span></td>
                                <td><span class="badge bg-secondary">Off</span></td>
                                <td><span class="badge bg-warning">2-10</span></td>
                                <td><span class="badge bg-warning">2-10</span></td>
                                <td><span class="badge bg-warning">2-10</span></td>
                                <td><span class="badge bg-warning">2-10</span></td>
                                <td><span class="badge bg-secondary">Off</span></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

// Load Advanced Reports
function loadAdvancedReports() {
    displayReportTemplates();
    displayRecentReports();
}

// Display Report Templates
function displayReportTemplates() {
    const container = document.getElementById('report-templates');
    if (!container) return;

    const templates = [
        { id: 'financial-summary', name: 'Financial Summary', description: 'Complete financial overview' },
        { id: 'sales-performance', name: 'Sales Performance', description: 'Detailed sales analysis' },
        { id: 'inventory-report', name: 'Inventory Report', description: 'Stock status and movements' },
        { id: 'employee-performance', name: 'Employee Performance', description: 'Staff productivity metrics' }
    ];

    container.innerHTML = templates.map(template => `
        <div class="col-md-6 mb-3">
            <div class="card border-0 shadow-sm h-100">
                <div class="card-body">
                    <h6>${template.name}</h6>
                    <p class="small text-muted">${template.description}</p>
                    <button class="btn btn-sm btn-primary" onclick="generateReportFromTemplate('${template.id}')">
                        Generate Report
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Display Recent Reports
function displayRecentReports() {
    const container = document.getElementById('recent-reports');
    if (!container) return;

    // This would show recently generated reports
    container.innerHTML = `
        <div class="list-group">
            <div class="list-group-item">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <h6 class="mb-1">Financial Summary - November 2025</h6>
                        <small class="text-muted">Generated 2 hours ago</small>
                    </div>
                    <div>
                        <button class="btn btn-sm btn-outline-primary">View</button>
                        <button class="btn btn-sm btn-outline-secondary">Export</button>
                    </div>
                </div>
            </div>
            <div class="list-group-item">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <h6 class="mb-1">Sales Performance - Last 30 Days</h6>
                        <small class="text-muted">Generated yesterday</small>
                    </div>
                    <div>
                        <button class="btn btn-sm btn-outline-primary">View</button>
                        <button class="btn btn-sm btn-outline-secondary">Export</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Display Recommendations
function displayRecommendations(recommendations) {
    const container = document.getElementById('recommendations');
    if (!container) return;

    if (recommendations.length === 0) {
        container.innerHTML = '<div class="alert alert-info">No recommendations at this time. Business is performing well!</div>';
        return;
    }

    container.innerHTML = recommendations.map(rec => `
        <div class="alert alert-${rec.priority === 'high' ? 'danger' : rec.priority === 'medium' ? 'warning' : 'info'}">
            <h6>${rec.title}</h6>
            <p class="mb-2">${rec.description}</p>
            <small class="text-muted">Priority: ${rec.priority}</small>
        </div>
    `).join('');
}

// Helper Functions
function addNewEmployee() {
    // This would open a modal to add a new employee
    alert('Employee addition form would open here');
}

function viewEmployeeDetails(employeeId) {
    // This would show detailed employee information
    alert(`Viewing details for employee: ${employeeId}`);
}

async function generateCustomReport() {
    const templateId = document.getElementById('report-template-select')?.value;
    const startDate = document.getElementById('report-start-date')?.value;
    const endDate = document.getElementById('report-end-date')?.value;
    
    if (!templateId || !startDate || !endDate) {
        alert('Please select a template and date range');
        return;
    }
    
    try {
        const report = await advancedReporting.generateReport(templateId, { startDate, endDate });
        console.log('Report generated:', report);
        alert('Report generated successfully!');
    } catch (error) {
        console.error('Failed to generate report:', error);
        alert('Failed to generate report');
    }
}

function generateReportFromTemplate(templateId) {
    // This would generate a report from the selected template
    alert(`Generating report from template: ${templateId}`);
}

function exportCurrentReport() {
    const format = document.getElementById('export-format')?.value || 'json';
    alert(`Exporting report in ${format} format`);
}

console.log('🚀 Admin premium event handlers loaded - Advanced Analytics, Employee Management, and Reporting ready!');
