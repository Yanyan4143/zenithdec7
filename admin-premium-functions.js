// Admin Premium Functions for ZenithLabs POS System
// Advanced administrative features for business management

// ==================== ADMIN ANALYTICS & REPORTING ====================

/**
 * Generate comprehensive admin analytics dashboard
 * Provides advanced business insights and reporting
 */
async function generateAdminAnalytics(dateRange = '30days') {
    try {
        const sales = await getAllSales();
        const expenses = await getAllJournalEntries();
        const inventory = await getAllInventory();
        
        // Filter by date range
        const endDate = new Date();
        const startDate = new Date();
        
        switch(dateRange) {
            case 'today':
                startDate.setHours(0, 0, 0, 0);
                break;
            case '7days':
                startDate.setDate(endDate.getDate() - 7);
                break;
            case '30days':
                startDate.setDate(endDate.getDate() - 30);
                break;
            case '90days':
                startDate.setDate(endDate.getDate() - 90);
                break;
            case 'year':
                startDate.setFullYear(endDate.getFullYear() - 1);
                break;
        }
        
        const filteredSales = sales.filter(sale => new Date(sale.date) >= startDate);
        
        // NEW: Filter expenses by PAYMENT dates instead of expense dates
        const filteredExpensesByPaymentDate = [];
        expenses.filter(exp => exp.type === 'expense').forEach(expense => {
            // Check if expense has paid amounts within the date range
            if (expense.partialPayments && expense.partialPayments.length > 0) {
                expense.partialPayments.forEach(payment => {
                    const paymentDate = new Date(payment.date);
                    if (paymentDate >= startDate && paymentDate <= endDate) {
                        filteredExpensesByPaymentDate.push({
                            ...expense,
                            paymentAmount: payment.amount,
                            paymentDate: payment.date,
                            originalExpenseDate: expense.date
                        });
                    }
                });
            } else if (expense.paidAmount > 0) {
                // For expenses without partial payments but with paidAmount, use the expense date as payment date
                const expenseDate = new Date(expense.date);
                if (expenseDate >= startDate && expenseDate <= endDate) {
                    filteredExpensesByPaymentDate.push({
                        ...expense,
                        paymentAmount: expense.paidAmount,
                        paymentDate: expense.date,
                        originalExpenseDate: expense.date
                    });
                }
            }
        });
        
        console.log('🔍 Analytics Expense Filtering:', {
            dateRange: dateRange,
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0],
            totalExpenses: expenses.filter(exp => exp.type === 'expense').length,
            filteredExpensesByPaymentDate: filteredExpensesByPaymentDate.length,
            expenses: filteredExpensesByPaymentDate.map(e => ({
                description: e.description,
                paymentAmount: e.paymentAmount,
                paymentDate: e.paymentDate,
                originalExpenseDate: e.originalExpenseDate
            }))
        });
        
        // Calculate comprehensive metrics
        const totalExpensesAmount = filteredExpensesByPaymentDate.reduce((sum, exp) => sum + (exp.paymentAmount || 0), 0);
        
        console.log('💰 ADMIN ANALYTICS EXPENSE CALCULATION:');
        console.log(`   - Date Range: ${dateRange}`);
        console.log(`   - Expenses by Payment Date: ${filteredExpensesByPaymentDate.length}`);
        console.log(`   - Payment Amounts: [${filteredExpensesByPaymentDate.map(e => `₱${e.paymentAmount}`).join(', ')}]`);
        console.log(`   - Total Expenses for Analytics: ₱${totalExpensesAmount.toFixed(2)}`);
        console.log(`📈 ADMIN ANALYTICS DASHBOARD WILL SHOW:`);
        console.log(`   - Expense Card: ₱${totalExpensesAmount.toFixed(2)}`);
        console.log(`   - Based on payments from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);
        
        const analytics = {
            overview: {
                totalRevenue: filteredSales.reduce((sum, sale) => sum + sale.total, 0),
                totalExpenses: totalExpensesAmount, // CHANGED: Use payment amounts from payment dates
                netProfit: 0,
                totalTransactions: filteredSales.length,
                averageTransactionValue: 0,
                totalItemsSold: 0,
                uniqueCustomers: new Set(filteredSales.map(sale => sale.customerId || 'guest')).size
            },
            financial: {
                grossMargin: 0,
                profitMargin: 0,
                operatingExpenses: 0,
                costOfGoodsSold: 0,
                revenueGrowth: 0,
                expenseGrowth: 0
            },
            operations: {
                topProducts: getTopProducts(filteredSales),
                categoryPerformance: calculateCategoryPerformance(filteredSales),
                salesByHour: calculateSalesByHour(filteredSales),
                salesByDay: calculateSalesByDay(filteredSales),
                paymentMethods: analyzePaymentMethods(filteredSales)
            },
            inventory: {
                totalItems: inventory.length,
                lowStockItems: inventory.filter(item => item.stock <= item.reorderPoint).length,
                outOfStockItems: inventory.filter(item => item.stock === 0).length,
                totalInventoryValue: calculateInventoryValue(inventory),
                inventoryTurnover: calculateInventoryTurnover(filteredSales, inventory)
            },
            forecasting: {
                nextMonthRevenue: predictNextMonthRevenue(filteredSales),
                yearlyProjection: projectYearlyRevenue(filteredSales),
                seasonalTrends: analyzeSeasonalTrends(sales),
                growthForecast: calculateGrowthForecast(filteredSales)
            },
            alerts: generateBusinessAlerts(filteredSales, filteredExpensesByPaymentDate, inventory)
        };
        
        // Calculate derived metrics
        analytics.overview.netProfit = analytics.overview.totalRevenue - analytics.overview.totalExpenses;
        analytics.overview.averageTransactionValue = analytics.overview.totalRevenue / analytics.overview.totalTransactions || 0;
        analytics.overview.totalItemsSold = calculateTotalItemsSold(filteredSales);
        
        // Calculate operating expenses from payment date filtered expenses
        analytics.financial.operatingExpenses = filteredExpensesByPaymentDate.reduce((sum, exp) => sum + (exp.paymentAmount || 0), 0);
        
        // Calculate cost of goods sold from sales
        analytics.financial.costOfGoodsSold = calculateCostOfGoodsSold(filteredSales, inventory);
        
        analytics.financial.grossMargin = ((analytics.overview.totalRevenue - analytics.financial.costOfGoodsSold) / analytics.overview.totalRevenue * 100) || 0;
        analytics.financial.profitMargin = (analytics.overview.netProfit / analytics.overview.totalRevenue * 100) || 0;
        
        return analytics;
    } catch (error) {
        console.error('Failed to generate admin analytics:', error);
        return null;
    }
}

/**
 * Get top performing products
 */
function getTopProducts(sales) {
    const productStats = {};
    
    sales.forEach(sale => {
        if (sale.items) {
            sale.items.forEach(item => {
                if (!productStats[item.name]) {
                    productStats[item.name] = {
                        quantity: 0,
                        revenue: 0,
                        category: item.category || 'Uncategorized',
                        price: item.price
                    };
                }
                productStats[item.name].quantity += item.qty;
                productStats[item.name].revenue += item.price * item.qty;
            });
        }
    });
    
    return Object.entries(productStats)
        .sort(([,a], [,b]) => b.revenue - a.revenue)
        .slice(0, 20)
        .map(([name, stats]) => ({ name, ...stats }));
}

/**
 * Calculate category performance
 */
function calculateCategoryPerformance(sales) {
    const categoryStats = {};
    
    sales.forEach(sale => {
        if (sale.items) {
            sale.items.forEach(item => {
                const category = item.category || 'Uncategorized';
                if (!categoryStats[category]) {
                    categoryStats[category] = { revenue: 0, quantity: 0, items: 0 };
                }
                categoryStats[category].revenue += item.price * item.qty;
                categoryStats[category].quantity += item.qty;
                categoryStats[category].items += 1;
            });
        }
    });
    
    return Object.entries(categoryStats)
        .sort(([,a], [,b]) => b.revenue - a.revenue)
        .map(([name, stats]) => ({ name, ...stats }));
}

/**
 * Calculate sales by hour
 */
function calculateSalesByHour(sales) {
    const hourlySales = Array(24).fill(0);
    const hourlyTransactions = Array(24).fill(0);
    
    sales.forEach(sale => {
        const hour = new Date(sale.date).getHours();
        hourlySales[hour] += sale.total;
        hourlyTransactions[hour] += 1;
    });
    
    return hourlySales.map((revenue, hour) => ({
        hour,
        revenue,
        transactions: hourlyTransactions[hour],
        averageTransaction: hourlyTransactions[hour] > 0 ? revenue / hourlyTransactions[hour] : 0
    }));
}

/**
 * Calculate sales by day of week
 */
function calculateSalesByDay(sales) {
    const dailySales = Array(7).fill(0);
    const dailyTransactions = Array(7).fill(0);
    
    sales.forEach(sale => {
        const day = new Date(sale.date).getDay();
        dailySales[day] += sale.total;
        dailyTransactions[day] += 1;
    });
    
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    return dailySales.map((revenue, index) => ({
        day: dayNames[index],
        dayIndex: index,
        revenue,
        transactions: dailyTransactions[index],
        averageTransaction: dailyTransactions[index] > 0 ? revenue / dailyTransactions[index] : 0
    }));
}

/**
 * Analyze payment methods
 */
function analyzePaymentMethods(sales) {
    const paymentStats = { cash: 0, gcash: 0, mixed: 0, transactions: { cash: 0, gcash: 0, mixed: 0 } };
    
    sales.forEach(sale => {
        if (sale.given > 0 && (sale.cash || sale.gcash)) {
            if (sale.cash > 0 && sale.gcash > 0) {
                paymentStats.mixed += sale.total;
                paymentStats.transactions.mixed += 1;
            } else if (sale.cash > 0) {
                paymentStats.cash += sale.total;
                paymentStats.transactions.cash += 1;
            } else {
                paymentStats.gcash += sale.total;
                paymentStats.transactions.gcash += 1;
            }
        }
    });
    
    return paymentStats;
}

/**
 * Calculate total items sold
 */
function calculateTotalItemsSold(sales) {
    return sales.reduce((total, sale) => {
        if (sale.items) {
            return total + sale.items.reduce((itemTotal, item) => itemTotal + item.qty, 0);
        }
        return total;
    }, 0);
}

/**
 * Calculate inventory value
 */
function calculateInventoryValue(inventory) {
    return inventory.reduce((total, item) => total + (item.price * item.stock), 0);
}

/**
 * Calculate inventory turnover
 */
function calculateInventoryTurnover(sales, inventory) {
    const totalCost = inventory.reduce((total, item) => total + (item.cost * item.stock), 0);
    const cogs = sales.reduce((total, sale) => {
        if (sale.items) {
            return total + sale.items.reduce((itemTotal, item) => itemTotal + (item.cost * item.qty), 0);
        }
        return total;
    }, 0);
    
    return totalCost > 0 ? cogs / totalCost : 0;
}

/**
 * Predict next month revenue
 */
function predictNextMonthRevenue(sales) {
    if (sales.length < 30) return 0;
    
        const recentSales = sales.slice(-30);
        const dailyAverage = recentSales.reduce((sum, sale) => sum + sale.total, 0) / 30;
        const trend = calculateGrowthRate(recentSales, '30days') / 100;
        
        return Math.round(dailyAverage * 30 * (1 + trend) * 100) / 100;
}

/**
 * Project yearly revenue
 */
function projectYearlyRevenue(sales) {
    if (sales.length < 90) return 0;
    
    const recentSales = sales.slice(-90);
    const monthlyAverage = recentSales.reduce((sum, sale) => sum + sale.total, 0) / 3;
    
    return Math.round(monthlyAverage * 12 * 100) / 100;
}

/**
 * Analyze seasonal trends
 */
function analyzeSeasonalTrends(sales) {
    const monthlyData = {};
    
    sales.forEach(sale => {
        const month = new Date(sale.date).getMonth();
        if (!monthlyData[month]) {
            monthlyData[month] = { revenue: 0, transactions: 0 };
        }
        monthlyData[month].revenue += sale.total;
        monthlyData[month].transactions += 1;
    });
    
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    return Object.entries(monthlyData).map(([month, data]) => ({
        month: monthNames[parseInt(month)],
        revenue: data.revenue,
        transactions: data.transactions
    }));
}

/**
 * Calculate growth forecast
 */
function calculateGrowthForecast(sales) {
    if (sales.length < 60) return { current: 0, projected: 0, confidence: 'low' };
    
    const recentSales = sales.slice(-30);
    const previousSales = sales.slice(-60, -30);
    
    const recentRevenue = recentSales.reduce((sum, sale) => sum + sale.total, 0);
    const previousRevenue = previousSales.reduce((sum, sale) => sum + sale.total, 0);
    
    const growthRate = previousRevenue > 0 ? ((recentRevenue - previousRevenue) / previousRevenue * 100) : 0;
    
    return {
        current: recentRevenue,
        projected: recentRevenue * (1 + growthRate / 100),
        growthRate,
        confidence: sales.length >= 90 ? 'high' : 'medium'
    };
}

/**
 * Calculate growth rate
 */
function calculateGrowthRate(sales, period) {
    if (sales.length < 2) return 0;
    
    const sortedSales = sales.sort((a, b) => new Date(a.date) - new Date(b.date));
    const firstPeriod = sortedSales.slice(0, Math.floor(sortedSales.length / 2));
    const secondPeriod = sortedSales.slice(Math.floor(sortedSales.length / 2));
    
    const firstRevenue = firstPeriod.reduce((sum, sale) => sum + sale.total, 0);
    const secondRevenue = secondPeriod.reduce((sum, sale) => sum + sale.total, 0);
    
    return firstRevenue > 0 ? ((secondRevenue - firstRevenue) / firstRevenue * 100) : 0;
}

/**
 * Generate business alerts
 */
function generateBusinessAlerts(sales, expenses, inventory) {
    const alerts = [];
    
    // Inventory alerts
    const outOfStock = inventory.filter(item => item.stock === 0);
    if (outOfStock.length > 0) {
        alerts.push({
            type: 'critical',
            title: 'Out of Stock Items',
            message: `${outOfStock.length} items are out of stock`,
            action: 'Reorder immediately',
            items: outOfStock.map(item => item.name)
        });
    }
    
    const lowStock = inventory.filter(item => item.stock > 0 && item.stock <= item.reorderPoint);
    if (lowStock.length > 0) {
        alerts.push({
            type: 'warning',
            title: 'Low Stock Items',
            message: `${lowStock.length} items need reordering`,
            action: 'Review inventory',
            items: lowStock.map(item => item.name)
        });
    }
    
    // Financial alerts
    const recentRevenue = sales.slice(-7).reduce((sum, sale) => sum + sale.total, 0);
    const previousRevenue = sales.slice(-14, -7).reduce((sum, sale) => sum + sale.total, 0);
    
    if (recentRevenue < previousRevenue * 0.8) {
        alerts.push({
            type: 'warning',
            title: 'Revenue Decline',
            message: 'Revenue has decreased by more than 20% compared to last week',
            action: 'Review sales strategy'
        });
    }
    
    // Expense alerts
    const recentExpenses = expenses.slice(-7).reduce((sum, exp) => sum + (exp.cash + exp.gcash), 0);
    const weeklyAverage = expenses.slice(-30).reduce((sum, exp) => sum + (exp.cash + exp.gcash), 0) / 4;
    
    if (recentExpenses > weeklyAverage * 1.5) {
        alerts.push({
            type: 'warning',
            title: 'High Expenses',
            message: 'This week\'s expenses are 50% higher than average',
            action: 'Review expense reports'
        });
    }
    
    return alerts;
}

// ==================== EMPLOYEE MANAGEMENT ====================

/**
 * Employee management system
 */
class EmployeeManagement {
    constructor() {
        this.employees = new Map();
        this.performance = new Map();
        this.schedules = new Map();
    }
    
    /**
     * Add new employee
     */
    addEmployee(employee) {
        const employeeData = {
            id: employee.id || Date.now().toString(),
            name: employee.name,
            email: employee.email,
            phone: employee.phone,
            position: employee.position,
            department: employee.department,
            hireDate: employee.hireDate || new Date().toISOString(),
            salary: employee.salary,
            status: employee.status || 'active',
            permissions: employee.permissions || [],
            createdAt: new Date().toISOString()
        };
        
        this.employees.set(employeeData.id, employeeData);
        return employeeData;
    }
    
    /**
     * Update employee information
     */
    updateEmployee(id, updates) {
        const employee = this.employees.get(id);
        if (!employee) return null;
        
        Object.assign(employee, updates, { updatedAt: new Date().toISOString() });
        return employee;
    }
    
    /**
     * Get employee by ID
     */
    getEmployee(id) {
        return this.employees.get(id) || null;
    }
    
    /**
     * Get all employees
     */
    getAllEmployees() {
        return Array.from(this.employees.values());
    }
    
    /**
     * Record employee performance
     */
    recordPerformance(employeeId, performance) {
        if (!this.performance.has(employeeId)) {
            this.performance.set(employeeId, []);
        }
        
        const performanceRecord = {
            id: Date.now().toString(),
            employeeId,
            date: performance.date || new Date().toISOString(),
            salesAmount: performance.salesAmount || 0,
            transactionsCount: performance.transactionsCount || 0,
            customerSatisfaction: performance.customerSatisfaction || 0,
            attendance: performance.attendance || 'present',
            notes: performance.notes || '',
            createdAt: new Date().toISOString()
        };
        
        this.performance.get(employeeId).push(performanceRecord);
        return performanceRecord;
    }
    
    /**
     * Get employee performance history
     */
    getEmployeePerformance(employeeId, startDate, endDate) {
        const performance = this.performance.get(employeeId) || [];
        
        return performance.filter(record => {
            const recordDate = new Date(record.date);
            return recordDate >= new Date(startDate) && recordDate <= new Date(endDate);
        });
    }
    
    /**
     * Calculate employee statistics
     */
    calculateEmployeeStats(employeeId, period = '30days') {
        const employee = this.employees.get(employeeId);
        if (!employee) return null;
        
        const endDate = new Date();
        const startDate = new Date();
        
        switch(period) {
            case '7days':
                startDate.setDate(endDate.getDate() - 7);
                break;
            case '30days':
                startDate.setDate(endDate.getDate() - 30);
                break;
            case '90days':
                startDate.setDate(endDate.getDate() - 90);
                break;
        }
        
        const performance = this.getEmployeePerformance(employeeId, startDate, endDate);
        
        const stats = {
            employee: employee,
            period,
            totalSales: performance.reduce((sum, p) => sum + p.salesAmount, 0),
            totalTransactions: performance.reduce((sum, p) => sum + p.transactionsCount, 0),
            averageTransaction: 0,
            customerSatisfaction: performance.reduce((sum, p) => sum + p.customerSatisfaction, 0) / performance.length || 0,
            attendanceRate: performance.filter(p => p.attendance === 'present').length / performance.length * 100 || 0,
            performanceScore: 0
        };
        
        stats.averageTransaction = stats.totalTransactions > 0 ? stats.totalSales / stats.totalTransactions : 0;
        
        // Calculate performance score (0-100)
        stats.performanceScore = Math.min(100, (
            (stats.totalSales / 10000) * 30 +  // Sales performance (30%)
            (stats.customerSatisfaction / 5) * 25 +  // Customer satisfaction (25%)
            stats.attendanceRate * 25 +  // Attendance (25%)
            (stats.totalTransactions / 100) * 20  // Transaction volume (20%)
        ));
        
        return stats;
    }
    
    /**
     * Create employee schedule
     */
    createSchedule(employeeId, schedule) {
        if (!this.schedules.has(employeeId)) {
            this.schedules.set(employeeId, []);
        }
        
        const scheduleRecord = {
            id: Date.now().toString(),
            employeeId,
            date: schedule.date,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            shift: schedule.shift || 'regular',
            status: schedule.status || 'scheduled',
            createdAt: new Date().toISOString()
        };
        
        this.schedules.get(employeeId).push(scheduleRecord);
        return scheduleRecord;
    }
    
    /**
     * Get employee schedule
     */
    getEmployeeSchedule(employeeId, startDate, endDate) {
        const schedules = this.schedules.get(employeeId) || [];
        
        return schedules.filter(record => {
            const recordDate = new Date(record.date);
            return recordDate >= new Date(startDate) && recordDate <= new Date(endDate);
        });
    }
}

// Initialize employee management
const employeeManagement = new EmployeeManagement();

// ==================== ADVANCED REPORTING ====================

/**
 * Generate comprehensive business reports
 */
class AdvancedReporting {
    constructor() {
        this.reportTemplates = new Map();
        this.scheduledReports = new Map();
        this.initializeReportTemplates();
    }
    
    /**
     * Initialize report templates
     */
    initializeReportTemplates() {
        this.reportTemplates.set('financial-summary', {
            name: 'Financial Summary',
            description: 'Complete financial overview including revenue, expenses, and profit',
            sections: ['revenue', 'expenses', 'profit-analysis', 'cash-flow']
        });
        
        this.reportTemplates.set('sales-performance', {
            name: 'Sales Performance',
            description: 'Detailed sales analysis by product, category, and time period',
            sections: ['sales-overview', 'product-performance', 'category-analysis', 'time-analysis']
        });
        
        this.reportTemplates.set('inventory-report', {
            name: 'Inventory Report',
            description: 'Comprehensive inventory status and movement analysis',
            sections: ['inventory-status', 'stock-movement', 'valuation', 'reorder-analysis']
        });
        
        this.reportTemplates.set('employee-performance', {
            name: 'Employee Performance',
            description: 'Individual and team performance metrics',
            sections: ['individual-performance', 'team-metrics', 'productivity-analysis', 'attendance-report']
        });
    }
    
    /**
     * Generate custom report
     */
    async generateReport(templateId, parameters) {
        const template = this.reportTemplates.get(templateId);
        if (!template) {
            throw new Error(`Report template ${templateId} not found`);
        }
        
        const report = {
            id: Date.now().toString(),
            templateId,
            templateName: template.name,
            generatedAt: new Date().toISOString(),
            parameters,
            sections: {}
        };
        
        // Generate report sections based on template
        for (const section of template.sections) {
            report.sections[section] = await this.generateReportSection(section, parameters);
        }
        
        return report;
    }
    
    /**
     * Generate report section
     */
    async generateReportSection(section, parameters) {
        switch (section) {
            case 'revenue':
                return await this.generateRevenueSection(parameters);
            case 'expenses':
                return await this.generateExpensesSection(parameters);
            case 'profit-analysis':
                return await this.generateProfitAnalysisSection(parameters);
            case 'sales-overview':
                return await this.generateSalesOverviewSection(parameters);
            case 'product-performance':
                return await this.generateProductPerformanceSection(parameters);
            case 'inventory-status':
                return await this.generateInventoryStatusSection(parameters);
            default:
                return { message: 'Section not implemented' };
        }
    }
    
    /**
     * Generate revenue section
     */
    async generateRevenueSection(parameters) {
        const sales = await getAllSales();
        const { startDate, endDate } = parameters;
        
        const filteredSales = sales.filter(sale => {
            const saleDate = new Date(sale.date);
            return saleDate >= new Date(startDate) && saleDate <= new Date(endDate);
        });
        
        return {
            totalRevenue: filteredSales.reduce((sum, sale) => sum + sale.total, 0),
            totalTransactions: filteredSales.length,
            averageTransaction: filteredSales.reduce((sum, sale) => sum + sale.total, 0) / filteredSales.length || 0,
            revenueByDay: this.calculateRevenueByDay(filteredSales),
            revenueByCategory: this.calculateRevenueByCategory(filteredSales)
        };
    }
    
    /**
     * Generate expenses section
     */
    async generateExpensesSection(parameters) {
        const expenses = await getAllJournalEntries();
        const { startDate, endDate } = parameters;
        
        const filteredExpenses = expenses.filter(exp => 
            exp.type === 'expense' &&
            new Date(exp.date) >= new Date(startDate) &&
            new Date(exp.date) <= new Date(endDate)
        );
        
        return {
            totalExpenses: filteredExpenses.reduce((sum, exp) => sum + (exp.cash + exp.gcash), 0),
            expenseCount: filteredExpenses.length,
            expensesByCategory: this.calculateExpensesByCategory(filteredExpenses),
            expensesByPaymentMethod: this.calculateExpensesByPaymentMethod(filteredExpenses)
        };
    }
    
    /**
     * Generate profit analysis section
     */
    async generateProfitAnalysisSection(parameters) {
        const revenueSection = await this.generateRevenueSection(parameters);
        const expensesSection = await this.generateExpensesSection(parameters);
        
        const grossProfit = revenueSection.totalRevenue - (revenueSection.revenueByCategory.reduce((sum, cat) => sum + cat.cost, 0) || 0);
        const netProfit = revenueSection.totalRevenue - expensesSection.totalExpenses;
        
        return {
            grossProfit,
            netProfit,
            grossMargin: revenueSection.totalRevenue > 0 ? (grossProfit / revenueSection.totalRevenue * 100) : 0,
            netMargin: revenueSection.totalRevenue > 0 ? (netProfit / revenueSection.totalRevenue * 100) : 0,
            profitTrend: this.calculateProfitTrend(parameters)
        };
    }
    
    /**
     * Calculate revenue by day
     */
    calculateRevenueByDay(sales) {
        const dailyRevenue = {};
        
        sales.forEach(sale => {
            const date = new Date(sale.date).toLocaleDateString();
            if (!dailyRevenue[date]) {
                dailyRevenue[date] = { revenue: 0, transactions: 0 };
            }
            dailyRevenue[date].revenue += sale.total;
            dailyRevenue[date].transactions += 1;
        });
        
        return Object.entries(dailyRevenue).map(([date, data]) => ({ date, ...data }));
    }
    
    /**
     * Calculate revenue by category
     */
    calculateRevenueByCategory(sales) {
        const categoryRevenue = {};
        
        sales.forEach(sale => {
            if (sale.items) {
                sale.items.forEach(item => {
                    const category = item.category || 'Uncategorized';
                    if (!categoryRevenue[category]) {
                        categoryRevenue[category] = { revenue: 0, cost: 0, quantity: 0 };
                    }
                    categoryRevenue[category].revenue += item.price * item.qty;
                    categoryRevenue[category].cost += (item.cost || 0) * item.qty;
                    categoryRevenue[category].quantity += item.qty;
                });
            }
        });
        
        return Object.entries(categoryRevenue).map(([name, data]) => ({ name, ...data }));
    }
    
    /**
     * Calculate expenses by category
     */
    calculateExpensesByCategory(expenses) {
        const categoryExpenses = {};
        
        expenses.forEach(expense => {
            const category = expense.category || 'General';
            if (!categoryExpenses[category]) {
                categoryExpenses[category] = { amount: 0, count: 0 };
            }
            categoryExpenses[category].amount += expense.cash + expense.gcash;
            categoryExpenses[category].count += 1;
        });
        
        return Object.entries(categoryExpenses).map(([name, data]) => ({ name, ...data }));
    }
    
    /**
     * Calculate expenses by payment method
     */
    calculateExpensesByPaymentMethod(expenses) {
        const paymentMethods = { cash: 0, gcash: 0 };
        
        expenses.forEach(expense => {
            paymentMethods.cash += expense.cash || 0;
            paymentMethods.gcash += expense.gcash || 0;
        });
        
        return paymentMethods;
    }
    
    /**
     * Calculate profit trend
     */
    calculateProfitTrend(parameters) {
        // This would compare current period with previous period
        // For now, return placeholder
        return {
            trend: 'increasing',
            percentage: 15.5,
            confidence: 'medium'
        };
    }
    
    /**
     * Export report to different formats
     */
    exportReport(report, format = 'json') {
        switch (format) {
            case 'json':
                return JSON.stringify(report, null, 2);
            case 'csv':
                return this.convertToCSV(report);
            case 'excel':
                return this.convertToExcel(report);
            default:
                throw new Error(`Unsupported format: ${format}`);
        }
    }
    
    /**
     * Convert report to CSV
     */
    convertToCSV(report) {
        // Simplified CSV conversion
        const csvData = [];
        csvData.push(['Report', report.templateName]);
        csvData.push(['Generated', report.generatedAt]);
        csvData.push([]);
        
        Object.entries(report.sections).forEach(([sectionName, sectionData]) => {
            csvData.push([sectionName.toUpperCase()]);
            Object.entries(sectionData).forEach(([key, value]) => {
                csvData.push([key, value]);
            });
            csvData.push([]);
        });
        
        return csvData.map(row => row.join(',')).join('\n');
    }
    
    /**
     * Convert report to Excel
     */
    convertToExcel(report) {
        // This would use a library like SheetJS for actual Excel export
        // For now, return CSV format
        return this.convertToCSV(report);
    }
}

// Initialize advanced reporting
const advancedReporting = new AdvancedReporting();

// ==================== BUSINESS INTELLIGENCE ====================

/**
 * Load Business Intelligence Dashboard
 * Provides AI-powered insights and analytics
 */
async function loadBusinessIntelligence() {
    try {
        console.log('🎯 Loading Business Intelligence dashboard...');
        
        // Show loading message immediately
        const containers = ['executive-summary', 'kpi-dashboard', 'operational-insights', 'ai-recommendations'];
        containers.forEach(id => {
            const container = document.getElementById(id);
            if (container) {
                container.innerHTML = '<div class="text-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div><p class="mt-2">Loading intelligence data...</p></div>';
            }
        });
        
        // Get business data
        const sales = await getAllSales();
        const expenses = await getAllJournalEntries();
        const inventory = await getAllInventory();
        
        console.log('📊 Data loaded:', { sales: sales.length, expenses: expenses.length, inventory: inventory.length });
        
        // Generate intelligence data
        const intelligence = await generateBusinessIntelligence(sales, expenses, inventory);
        
        console.log('🧠 Intelligence generated:', intelligence);
        
        // Display all sections
        displayExecutiveSummary(intelligence.executiveSummary);
        displayKPIDashboard(intelligence.kpiDashboard);
        displayOperationalInsights(intelligence.operationalInsights);
        displayAIRecommendations(intelligence.aiRecommendations);
        
        console.log('✅ Business Intelligence dashboard loaded successfully');
        
    } catch (error) {
        console.error('❌ Failed to load Business Intelligence:', error);
        // Display error message in all sections
        const containers = ['executive-summary', 'kpi-dashboard', 'operational-insights', 'ai-recommendations'];
        containers.forEach(id => {
            const container = document.getElementById(id);
            if (container) {
                container.innerHTML = `
                    <div class="alert alert-danger">
                        <h5><i class="fas fa-exclamation-triangle"></i> Error Loading Intelligence</h5>
                        <p>Failed to load business intelligence data: ${error.message}</p>
                        <button class="btn btn-sm btn-outline-danger" onclick="loadBusinessIntelligence()">Retry</button>
                    </div>
                `;
            }
        });
    }
}

/**
 * Generate comprehensive business intelligence
 */
async function generateBusinessIntelligence(sales, expenses, inventory) {
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);
    
    const recentSales = sales.filter(sale => new Date(sale.date) >= last30Days);
    const recentExpenses = expenses.filter(exp => exp.type === 'expense' && new Date(exp.date) >= last30Days);
    
    // Calculate metrics
    const totalRevenue = recentSales.reduce((sum, sale) => sum + sale.total, 0);
    const totalExpenses = recentExpenses.reduce((sum, exp) => sum + (exp.cash + exp.gcash), 0);
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    
    // Executive Summary
    const executiveSummary = {
        totalRevenue,
        totalExpenses,
        netProfit,
        profitMargin,
        totalTransactions: recentSales.length,
        averageTransactionValue: recentSales.length > 0 ? totalRevenue / recentSales.length : 0,
        growthRate: calculateGrowthRate(sales),
        topProduct: getTopProduct(recentSales),
        lowStockItems: inventory.filter(item => item.stock <= 5).length,
        outOfStockItems: inventory.filter(item => item.stock === 0).length
    };
    
    // KPI Dashboard
    const kpiDashboard = {
        revenue: {
            current: totalRevenue,
            previous: calculatePreviousPeriod(sales, 30),
            trend: calculateTrend(sales, 'revenue')
        },
        profit: {
            current: netProfit,
            previous: calculatePreviousPeriodProfit(sales, expenses, 30),
            trend: calculateTrend(sales, 'profit')
        },
        margin: {
            current: profitMargin,
            previous: calculatePreviousMargin(sales, expenses, 30),
            trend: profitMargin > 10 ? 'up' : 'down'
        },
        transactions: {
            current: recentSales.length,
            previous: calculatePreviousTransactions(sales, 30),
            trend: recentSales.length > 0 ? 'up' : 'down'
        }
    };
    
    // Operational Insights
    const operationalInsights = [
        {
            title: 'Peak Sales Hours',
            value: getPeakSalesHours(recentSales),
            impact: 'high',
            recommendation: 'Schedule more staff during peak hours'
        },
        {
            title: 'Top Category',
            value: getTopCategory(recentSales),
            impact: 'medium',
            recommendation: 'Focus marketing on top-performing categories'
        },
        {
            title: 'Inventory Alerts',
            value: `${executiveSummary.lowStockItems} items low stock`,
            impact: executiveSummary.lowStockItems > 5 ? 'high' : 'low',
            recommendation: 'Restock low inventory items soon'
        },
        {
            title: 'Payment Methods',
            value: getPaymentMethodBreakdown(recentSales),
            impact: 'low',
            recommendation: 'Monitor payment preferences'
        }
    ];
    
    // AI Recommendations
    const aiRecommendations = generateAIRecommendations(executiveSummary, operationalInsights, inventory);
    
    return {
        executiveSummary,
        kpiDashboard,
        operationalInsights,
        aiRecommendations
    };
}

/**
 * Display Executive Summary
 */
function displayExecutiveSummary(summary) {
    const container = document.getElementById('executive-summary');
    if (!container) return;
    
    // Safety checks for all values
    const totalRevenue = summary.totalRevenue || 0;
    const netProfit = summary.netProfit || 0;
    const profitMargin = summary.profitMargin || 0;
    const totalTransactions = summary.totalTransactions || 0;
    const averageTransactionValue = summary.averageTransactionValue || 0;
    const growthRate = summary.growthRate || 0;
    
    container.innerHTML = `
        <div class="row">
            <div class="col-md-3">
                <div class="card border-0 shadow-sm">
                    <div class="card-body text-center">
                        <h6 class="text-muted">Total Revenue</h6>
                        <div class="fs-4 fw-bold text-success">₱${totalRevenue.toFixed(2)}</div>
                        <small class="text-muted">Last 30 days</small>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card border-0 shadow-sm">
                    <div class="card-body text-center">
                        <h6 class="text-muted">Net Profit</h6>
                        <div class="fs-4 fw-bold ${netProfit >= 0 ? 'text-success' : 'text-danger'}">₱${netProfit.toFixed(2)}</div>
                        <small class="text-muted">${profitMargin.toFixed(1)}% margin</small>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card border-0 shadow-sm">
                    <div class="card-body text-center">
                        <h6 class="text-muted">Transactions</h6>
                        <div class="fs-4 fw-bold text-primary">${totalTransactions}</div>
                        <small class="text-muted">₱${averageTransactionValue.toFixed(2)} avg</small>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card border-0 shadow-sm">
                    <div class="card-body text-center">
                        <h6 class="text-muted">Growth Rate</h6>
                        <div class="fs-4 fw-bold ${growthRate >= 0 ? 'text-success' : 'text-danger'}">${growthRate.toFixed(1)}%</div>
                        <small class="text-muted">Monthly trend</small>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Display KPI Dashboard
 */
function displayKPIDashboard(kpi) {
    const container = document.getElementById('kpi-dashboard');
    if (!container) return;
    
    container.innerHTML = `
        <div class="row">
            <div class="col-md-6">
                <div class="card border-0 shadow-sm mb-3">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <h6 class="text-muted">Revenue</h6>
                                <div class="fs-5 fw-bold">₱${kpi.revenue.current.toFixed(2)}</div>
                                <small class="text-muted">vs ₱${kpi.revenue.previous.toFixed(2)} previous</small>
                            </div>
                            <div class="text-end">
                                <span class="badge bg-${kpi.revenue.trend === 'up' ? 'success' : 'danger'}">
                                    <i class="fas fa-arrow-${kpi.revenue.trend}"></i> ${Math.abs((kpi.revenue.current - kpi.revenue.previous) / kpi.revenue.previous * 100).toFixed(1)}%
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="card border-0 shadow-sm mb-3">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <h6 class="text-muted">Profit</h6>
                                <div class="fs-5 fw-bold">₱${kpi.profit.current.toFixed(2)}</div>
                                <small class="text-muted">vs ₱${kpi.profit.previous.toFixed(2)} previous</small>
                            </div>
                            <div class="text-end">
                                <span class="badge bg-${kpi.profit.trend === 'up' ? 'success' : 'danger'}">
                                    <i class="fas fa-arrow-${kpi.profit.trend}"></i> ${Math.abs((kpi.profit.current - kpi.profit.previous) / kpi.profit.previous * 100).toFixed(1)}%
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="card border-0 shadow-sm mb-3">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <h6 class="text-muted">Profit Margin</h6>
                                <div class="fs-5 fw-bold">${kpi.margin.current.toFixed(1)}%</div>
                                <small class="text-muted">vs ${kpi.margin.previous.toFixed(1)}% previous</small>
                            </div>
                            <div class="text-end">
                                <span class="badge bg-${kpi.margin.trend === 'up' ? 'success' : 'danger'}">
                                    <i class="fas fa-arrow-${kpi.margin.trend}"></i> ${Math.abs(kpi.margin.current - kpi.margin.previous).toFixed(1)}%
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="card border-0 shadow-sm mb-3">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <h6 class="text-muted">Transactions</h6>
                                <div class="fs-5 fw-bold">${kpi.transactions.current}</div>
                                <small class="text-muted">vs ${kpi.transactions.previous} previous</small>
                            </div>
                            <div class="text-end">
                                <span class="badge bg-${kpi.transactions.trend === 'up' ? 'success' : 'danger'}">
                                    <i class="fas fa-arrow-${kpi.transactions.trend}"></i> ${Math.abs((kpi.transactions.current - kpi.transactions.previous) / kpi.transactions.previous * 100).toFixed(1)}%
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Display Operational Insights
 */
function displayOperationalInsights(insights) {
    const container = document.getElementById('operational-insights');
    if (!container) return;
    
    container.innerHTML = insights.map(insight => `
        <div class="card border-0 shadow-sm mb-3">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h6 class="fw-bold">${insight.title}</h6>
                        <p class="mb-1">${insight.value}</p>
                        <small class="text-muted">${insight.recommendation}</small>
                    </div>
                    <span class="badge bg-${insight.impact === 'high' ? 'danger' : insight.impact === 'medium' ? 'warning' : 'info'}">
                        ${insight.impact} impact
                    </span>
                </div>
            </div>
        </div>
    `).join('');
}

/**
 * Display AI Recommendations
 */
function displayAIRecommendations(recommendations) {
    const container = document.getElementById('ai-recommendations');
    if (!container) return;
    
    container.innerHTML = recommendations.map(rec => `
        <div class="card border-0 shadow-sm mb-3">
            <div class="card-body">
                <div class="d-flex align-items-start">
                    <div class="me-3">
                        <div class="rounded-circle bg-primary bg-opacity-10 p-2">
                            <i class="fas fa-${rec.icon} text-primary"></i>
                        </div>
                    </div>
                    <div class="flex-grow-1">
                        <h6 class="fw-bold">${rec.title}</h6>
                        <p class="mb-2">${rec.description}</p>
                        <div class="d-flex gap-2">
                            <span class="badge bg-${rec.priority === 'high' ? 'danger' : rec.priority === 'medium' ? 'warning' : 'info'}">
                                ${rec.priority} priority
                            </span>
                            <small class="text-muted">Impact: ${rec.impact}</small>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Helper functions for Business Intelligence
function calculateGrowthRate(sales) {
    const now = new Date();
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    const thisMonth = sales.filter(sale => new Date(sale.date) >= lastMonth);
    const previousMonth = sales.filter(sale => {
        const saleDate = new Date(sale.date);
        const twoMonthsAgo = new Date();
        twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
        return saleDate >= twoMonthsAgo && saleDate < lastMonth;
    });
    
    const thisRevenue = thisMonth.reduce((sum, sale) => sum + sale.total, 0);
    const prevRevenue = previousMonth.reduce((sum, sale) => sum + sale.total, 0);
    
    return prevRevenue > 0 ? ((thisRevenue - prevRevenue) / prevRevenue) * 100 : 0;
}

function getTopProduct(sales) {
    const productCounts = {};
    sales.forEach(sale => {
        if (sale.items) {
            sale.items.forEach(item => {
                if (!productCounts[item.name]) {
                    productCounts[item.name] = 0;
                }
                productCounts[item.name] += item.qty || 1;
            });
        }
    });
    
    let topProduct = '';
    let maxCount = 0;
    for (const [product, count] of Object.entries(productCounts)) {
        if (count > maxCount) {
            maxCount = count;
            topProduct = product;
        }
    }
    
    return topProduct || 'N/A';
}

function getPeakSalesHours(sales) {
    const hourCounts = {};
    sales.forEach(sale => {
        const hour = new Date(sale.date).getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    
    let peakHour = '';
    let maxCount = 0;
    for (const [hour, count] of Object.entries(hourCounts)) {
        if (count > maxCount) {
            maxCount = count;
            peakHour = `${hour}:00-${parseInt(hour) + 1}:00`;
        }
    }
    
    return peakHour || 'N/A';
}

function getTopCategory(sales) {
    const categoryCounts = {};
    sales.forEach(sale => {
        if (sale.items) {
            sale.items.forEach(item => {
                const category = item.category || 'Uncategorized';
                categoryCounts[category] = (categoryCounts[category] || 0) + (item.qty || 1);
            });
        }
    });
    
    let topCategory = '';
    let maxCount = 0;
    for (const [category, count] of Object.entries(categoryCounts)) {
        if (count > maxCount) {
            maxCount = count;
            topCategory = category;
        }
    }
    
    return topCategory || 'N/A';
}

function getPaymentMethodBreakdown(sales) {
    const methods = { cash: 0, gcash: 0, mixed: 0 };
    sales.forEach(sale => {
        if (sale.given > 0 && sale.change >= 0) {
            if (sale.gcash && sale.gcash > 0) {
                methods.mixed++;
            } else {
                methods.cash++;
            }
        } else if (sale.gcash && sale.gcash > 0) {
            methods.gcash++;
        }
    });
    
    const total = methods.cash + methods.gcash + methods.mixed;
    if (total === 0) return 'No data';
    
    const breakdown = [];
    if (methods.cash > 0) breakdown.push(`Cash ${((methods.cash / total) * 100).toFixed(1)}%`);
    if (methods.gcash > 0) breakdown.push(`GCash ${((methods.gcash / total) * 100).toFixed(1)}%`);
    if (methods.mixed > 0) breakdown.push(`Mixed ${((methods.mixed / total) * 100).toFixed(1)}%`);
    
    return breakdown.join(', ') || 'No data';
}

function generateAIRecommendations(summary, insights, inventory) {
    const recommendations = [];
    
    // Revenue optimization
    if (summary.profitMargin < 10) {
        recommendations.push({
            title: 'Increase Profit Margins',
            description: 'Your profit margin is below 10%. Consider reviewing pricing strategy or reducing costs.',
            icon: 'chart-line',
            priority: 'high',
            impact: 'High impact on profitability'
        });
    }
    
    // Inventory management
    if (summary.lowStockItems > 5) {
        recommendations.push({
            title: 'Optimize Inventory Levels',
            description: `${summary.lowStockItems} items are running low. Implement automated reordering to prevent stockouts.`,
            icon: 'boxes',
            priority: 'high',
            impact: 'Prevents lost sales'
        });
    }
    
    // Growth opportunities
    if (summary.growthRate > 10) {
        recommendations.push({
            title: 'Scale Up Operations',
            description: 'Your business is growing rapidly. Consider expanding capacity or marketing efforts.',
            icon: 'rocket',
            priority: 'medium',
            impact: 'Capitalizes on growth momentum'
        });
    }
    
    // Operational efficiency
    const peakHours = insights.find(i => i.title === 'Peak Sales Hours');
    if (peakHours) {
        recommendations.push({
            title: 'Optimize Staff Scheduling',
            description: `Align staff schedules with peak hours (${peakHours.value}) to improve customer service.`,
            icon: 'users',
            priority: 'medium',
            impact: 'Improves customer satisfaction'
        });
    }
    
    // Product focus
    if (summary.topProduct !== 'N/A') {
        recommendations.push({
            title: 'Focus on Top Performer',
            description: `${summary.topProduct} is your best-selling product. Consider promotions or bundles around it.`,
            icon: 'star',
            priority: 'low',
            impact: 'Boosts top performer sales'
        });
    }
    
    return recommendations;
}

// Placeholder helper functions (to be implemented based on your data structure)
function calculatePreviousPeriod(sales, days) {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() - days);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days * 2));
    
    const previousSales = sales.filter(sale => {
        const saleDate = new Date(sale.date);
        return saleDate >= startDate && saleDate < endDate;
    });
    
    return previousSales.reduce((sum, sale) => sum + sale.total, 0);
}

function calculatePreviousPeriodProfit(sales, expenses, days) {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() - days);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days * 2));
    
    const previousSales = sales.filter(sale => {
        const saleDate = new Date(sale.date);
        return saleDate >= startDate && saleDate < endDate;
    });
    
    const previousExpenses = expenses.filter(exp => {
        const expDate = new Date(exp.date);
        return expDate >= startDate && expDate < endDate;
    });
    
    const revenue = previousSales.reduce((sum, sale) => sum + sale.total, 0);
    const expensesTotal = previousExpenses.reduce((sum, exp) => sum + (exp.cash + exp.gcash), 0);
    
    return revenue - expensesTotal;
}

function calculatePreviousMargin(sales, expenses, days) {
    const revenue = calculatePreviousPeriod(sales, days);
    const profit = calculatePreviousPeriodProfit(sales, expenses, days);
    
    return revenue > 0 ? (profit / revenue) * 100 : 0;
}

function calculateTrend(sales, type) {
    // Simple trend calculation - can be enhanced
    return 'up'; // Placeholder
}

function calculatePreviousTransactions(sales, days) {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() - days);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days * 2));
    
    return sales.filter(sale => {
        const saleDate = new Date(sale.date);
        return saleDate >= startDate && saleDate < endDate;
    }).length;
}

// Make Business Intelligence functions available globally
window.loadBusinessIntelligenceData = loadBusinessIntelligence;
window.generateBusinessIntelligence = generateBusinessIntelligence;
window.displayExecutiveSummary = displayExecutiveSummary;
window.displayKPIDashboard = displayKPIDashboard;
window.displayOperationalInsights = displayOperationalInsights;
window.displayAIRecommendations = displayAIRecommendations;

// Test function for debugging
window.testIntelligenceTab = async function() {
    console.log('🧪 Testing Intelligence tab functionality...');
    
    // Check if containers exist
    const containers = ['executive-summary', 'kpi-dashboard', 'operational-insights', 'ai-recommendations'];
    const missingContainers = [];
    
    containers.forEach(id => {
        const container = document.getElementById(id);
        if (!container) {
            missingContainers.push(id);
        } else {
            console.log(`✅ Container found: ${id}`);
            // Test with sample content
            container.innerHTML = `<div class="alert alert-info">Test content for ${id}</div>`;
        }
    });
    
    if (missingContainers.length > 0) {
        console.error('❌ Missing containers:', missingContainers);
        return false;
    }
    
    // Test the load function
    try {
        await loadBusinessIntelligence();
        console.log('✅ Intelligence tab test completed successfully');
        return true;
    } catch (error) {
        console.error('❌ Intelligence tab test failed:', error);
        return false;
    }
};

/**
 * Calculate Cost of Goods Sold (COGS) from sales data
 */
function calculateCostOfGoodsSold(sales, inventory) {
    let totalCOGS = 0;
    
    sales.forEach(sale => {
        if (sale.items) {
            sale.items.forEach(item => {
                // Find the inventory item to get the cost
                const inventoryItem = inventory.find(inv => inv.id === item.id);
                const itemCost = inventoryItem ? (inventoryItem.cost || 0) : (item.cost || 0);
                totalCOGS += itemCost * item.qty;
            });
        }
    });
    
    return totalCOGS;
}

// Make admin premium functions available globally
window.generateAdminAnalytics = generateAdminAnalytics;
window.EmployeeManagement = EmployeeManagement;
window.employeeManagement = employeeManagement;
window.AdvancedReporting = AdvancedReporting;
window.advancedReporting = advancedReporting;

console.log('🚀 Admin premium functions loaded - Advanced Analytics, Employee Management, Reporting, and Business Intelligence ready!');
