// Premium Functions for ZenithLabs POS System
// Advanced features for enhanced business management

// ==================== ANALYTICS & INSIGHTS ====================

/**
 * Get Items Sold on Specific Date
 * Returns detailed list of all items sold on a specific date
 */
async function getItemsSoldOnSpecificDate(targetDate) {
    try {
        const sales = await getAllSales();
        console.log(`🔍 Searching for items sold on: ${targetDate}`);
        
        // Filter sales for the specific date - accounting for timezone
        const dateSales = sales.filter(sale => {
            if (!sale.date) return false;
            
            // Parse the sale date and handle timezone like Sales History does
            const saleDate = new Date(sale.date);
            if (!saleDate || isNaN(saleDate)) return false;
            
            // Get the local date part (accounting for timezone)
            // This matches how Sales History displays dates
            const saleDateString = saleDate.toLocaleDateString('en-CA'); // en-CA gives YYYY-MM-DD format
            
            console.log(`🔍 Checking sale: ${sale.date} -> ${saleDateString} vs ${targetDate}`);
            return saleDateString === targetDate;
        });
        
        console.log(`📊 Found ${dateSales.length} sales on ${targetDate}`);
        
        // Extract all items from those sales
        const allItems = [];
        let totalRevenue = 0;
        let totalItemsCount = 0;
        
        dateSales.forEach(sale => {
            if (sale.items && Array.isArray(sale.items)) {
                // Format time exactly like Sales History does
                const saleDate = new Date(sale.date);
                const timePart = saleDate.toLocaleTimeString(undefined, {
                    hour: 'numeric', minute: '2-digit', hour12: true
                });
                
                sale.items.forEach(item => {
                    // Skip voided items
                    if (item.voided) return;
                    
                    const itemTotal = item.price * item.qty;
                    allItems.push({
                        time: timePart,
                        name: item.name,
                        category: item.category || 'Uncategorized',
                        price: item.price,
                        quantity: item.qty,
                        total: itemTotal,
                        saleId: sale.id,
                        saleDate: sale.date
                    });
                    
                    totalRevenue += itemTotal;
                    totalItemsCount += item.qty;
                });
            }
        });
        
        // Sort by time (same as Sales History - newest first)
        allItems.sort((a, b) => {
            const timeA = new Date(`${a.saleDate} ${a.time}`);
            const timeB = new Date(`${b.saleDate} ${b.time}`);
            return timeB - timeA; // Reverse order for newest first (like Sales History)
        });
        
        console.log(`📋 Total items sold: ${totalItemsCount}, Total revenue: ₱${totalRevenue.toFixed(2)}`);
        console.log('📦 Items details:', allItems);
        
        return {
            date: targetDate,
            items: allItems,
            totalRevenue: totalRevenue,
            totalItemsCount: totalItemsCount,
            salesCount: dateSales.length
        };
        
    } catch (error) {
        console.error('❌ Error getting items sold on specific date:', error);
        return {
            date: targetDate,
            items: [],
            totalRevenue: 0,
            totalItemsCount: 0,
            salesCount: 0
        };
    }
}

/**
 * Export Date Specific Data to CSV
 */
async function exportDateSpecificData(targetDate) {
    try {
        const dateData = await getItemsSoldOnSpecificDate(targetDate);
        
        if (dateData.items.length === 0) {
            alert(`No items sold on ${targetDate}`);
            return;
        }
        
        // Create CSV content
        let csvContent = 'Time,Item Name,Category,Price,Quantity,Total,Sale ID\n';
        
        dateData.items.forEach(item => {
            csvContent += `"${item.time}","${item.name}","${item.category}",${item.price},${item.quantity},${item.total},"${item.saleId}"\n`;
        });
        
        // Add summary
        csvContent += `\n\nSUMMARY\n`;
        csvContent += `Date,${targetDate}\n`;
        csvContent += `Total Sales,${dateData.salesCount}\n`;
        csvContent += `Total Items Sold,${dateData.totalItemsCount}\n`;
        csvContent += `Total Revenue,₱${dateData.totalRevenue.toFixed(2)}\n`;
        
        // Create and download file
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `sales_${targetDate}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        console.log(`📥 Exported ${dateData.items.length} items for ${targetDate}`);
        
    } catch (error) {
        console.error('❌ Error exporting date data:', error);
        alert('Error exporting data. Please try again.');
    }
}

/**
 * Get Date-Specific Business Insights
 * Provides insights for a specific date (like the getItemsSoldOnSpecificDate function)
 */
async function getDateSpecificBusinessInsights(targetDate) {
    try {
        console.log(`📊 Getting business insights for date: ${targetDate}`);
        
        const sales = await getAllSales();
        const expenses = await getAllJournalEntries();
        
        // Filter sales for specific date - accounting for timezone
        const dateSales = sales.filter(sale => {
            if (!sale.date) return false;
            
            // Parse the sale date and handle timezone like Sales History does
            const saleDate = new Date(sale.date);
            if (!saleDate || isNaN(saleDate)) return false;
            
            // Get the local date part (accounting for timezone)
            // This matches how Sales History displays dates
            const saleDateString = saleDate.toLocaleDateString('en-CA'); // en-CA gives YYYY-MM-DD format
            
            return saleDateString === targetDate;
        });
        
        // Filter expenses for specific date and calculate REMAINING amounts (committed - paid)
        console.log('🔍 DETAILED EXPENSE ANALYSIS FOR ANALYTICS (REMAINING AMOUNTS):');
        console.log(`   - Target Date: ${targetDate}`);
        console.log(`   - Total Expenses in System: ${expenses.length}`);
        
        const dateExpenses = [];
        expenses.filter(exp => exp.type === 'expense').forEach((expense, index) => {
            const expDate = new Date(expense.date);
            if (!expDate || isNaN(expDate)) return;
            const expDateString = expDate.toLocaleDateString('en-CA');
            
            // Only include expenses for the target date
            if (expDateString !== targetDate) return;
            
            console.log(`   🔍 Examining Expense ${index + 1}: "${expense.description}"`);
            console.log(`      - Original Date: ${expense.date}`);
            console.log(`      - Total Committed: ₱${(expense.cash || 0) + (expense.gcash || 0)}`);
            
            // Calculate total paid amount
            let totalPaid = 0;
            if (expense.partialPayments && expense.partialPayments.length > 0) {
                console.log(`      - Checking ${expense.partialPayments.length} partial payments...`);
                expense.partialPayments.forEach((payment, paymentIndex) => {
                    console.log(`         Payment ${paymentIndex + 1}: ₱${payment.amount} on ${payment.date}`);
                    totalPaid += payment.amount;
                });
            } else if (expense.paidAmount > 0) {
                console.log(`      - Single payment: ₱${expense.paidAmount}`);
                totalPaid = expense.paidAmount;
            } else {
                console.log(`      - No payments made`);
            }
            
            // Calculate remaining amount
            const totalCommitted = (expense.cash || 0) + (expense.gcash || 0);
            const remainingAmount = totalCommitted - totalPaid;
            
            console.log(`      - Committed: ₱${totalCommitted}, Paid: ₱${totalPaid}, Remaining: ₱${remainingAmount}`);
            
            if (remainingAmount > 0) {
                console.log(`      ✅ ADDING: Remaining expense of ₱${remainingAmount}`);
                dateExpenses.push({
                    ...expense,
                    remainingAmount: remainingAmount,
                    committedAmount: totalCommitted,
                    paidAmount: totalPaid
                });
            } else {
                console.log(`      ❌ SKIPPING: Fully paid (remaining: ₱${remainingAmount})`);
            }
        });
        
        console.log(`📊 Found ${dateSales.length} sales and ${dateExpenses.length} remaining expenses for ${targetDate}`);
        console.log('🔍 Cashier Analytics Expense Details:', dateExpenses.map(e => ({
            description: e.description,
            remainingAmount: e.remainingAmount,
            committedAmount: e.committedAmount,
            paidAmount: e.paidAmount
        })));
        
        console.log('💰 REMAINING EXPENSE ANALYSIS FOR ANALYTICS:');
        console.log(`   - Target Date: ${targetDate}`);
        console.log(`   - Remaining expenses found: ${dateExpenses.length}`);
        dateExpenses.forEach((expense, index) => {
            console.log(`   ${index + 1}. Remaining: ₱${expense.remainingAmount} for "${expense.description}" (committed: ₱${expense.committedAmount}, paid: ₱${expense.paidAmount})`);
        });
        
        // Calculate metrics for the specific date
        const inventory = await getAllInventory(); // Get inventory for actual costs
        let totalRevenue = 0;
        let totalCosts = 0;
        
        // Calculate actual revenue and costs from sales items
        dateSales.forEach(sale => {
            if (sale.items) {
                sale.items.forEach(item => {
                    if (!item.voided) {
                        // Add to revenue
                        totalRevenue += (item.price || 0) * (item.qty || 1);
                        
                        // Get actual cost from inventory
                        const inventoryItem = inventory.find(inv => inv.id === item.id);
                        const actualCost = inventoryItem ? (inventoryItem.cost || 0) : (item.cost || 0);
                        totalCosts += actualCost * (item.qty || 1);
                    }
                });
            }
        });
        
        const totalExpenses = dateExpenses.reduce((sum, exp) => sum + (exp.remainingAmount || 0), 0); // CHANGED: Use remaining amounts (committed - paid)
        
        // OLD CALCULATION (for comparison)
        const oldFilteredExpenses = expenses.filter(exp => {
            if (!exp.date) return false;
            const expDate = new Date(exp.date);
            if (!expDate || isNaN(expDate)) return false;
            const expDateString = expDate.toLocaleDateString('en-CA');
            return expDateString === targetDate && exp.type === 'expense';
        });
        const oldTotalExpenses = oldFilteredExpenses.reduce((sum, exp) => sum + (exp.cash + (exp.gcash || 0)), 0);
        
        console.log('🔄 COMPARISON: OLD vs NEW CALCULATION');
        console.log(`   - OLD METHOD (committed amounts):`);
        console.log(`     - Expenses found: ${oldFilteredExpenses.length}`);
        console.log(`     - Total: ₱${oldTotalExpenses.toFixed(2)} ← This was showing committed amounts`);
        console.log(`   - NEW METHOD (remaining amounts):`);
        console.log(`     - Remaining expenses found: ${dateExpenses.length}`);
        console.log(`     - Total: ₱${totalExpenses.toFixed(2)} ← This shows committed - paid`);
        console.log(`   - DIFFERENCE: ₱${Math.abs(oldTotalExpenses - totalExpenses).toFixed(2)} (amounts already paid)`);
        
        const netProfit = totalRevenue - totalCosts - totalExpenses; // Revenue - Costs - Expenses
        const totalTransactions = dateSales.length;
        const averageTransactionValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
        const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
        
        // Enhanced debugging for Total Expenses (Voided Items removed)
        console.log(`=== BUSINESS INSIGHTS DEBUG FOR ${targetDate} ===`);
        console.log(`📊 Sales Data:`);
        console.log(`   - Total Sales Found: ${dateSales.length}`);
        console.log(`   - Total Revenue: ₱${totalRevenue.toFixed(2)}`);
        console.log(`   - Total Costs (from inventory): ₱${totalCosts.toFixed(2)}`);
        console.log('💸 REMAINING EXPENSE CALCULATION FOR ANALYTICS DASHBOARD:');
        console.log(`   - Remaining Expenses Found: ${dateExpenses.length}`);
        console.log(`   - Remaining Amounts: [${dateExpenses.map(e => `₱${e.remainingAmount}`).join(', ')}]`);
        console.log(`   - Total Remaining Expenses (Committed - Paid): ₱${totalExpenses.toFixed(2)}`);
        console.log(`   - Net Profit Formula: Sales - Cost - Expenses`);
        console.log(`   - Net Profit: ₱${totalRevenue.toFixed(2)} - ₱${totalCosts.toFixed(2)} - ₱${totalExpenses.toFixed(2)} = ₱${netProfit.toFixed(2)}`);
        console.log(`📈 ANALYTICS DASHBOARD WILL SHOW:`);
        console.log(`   - Expense Card: ₱${totalExpenses.toFixed(2)} (amounts still needing payment)`);
        console.log(`   - Net Profit Card: ₱${netProfit.toFixed(2)} (updates automatically when expenses change)`);
        console.log(`   - Based on: ${dateExpenses.length} expenses with remaining balances on ${targetDate}`);
        console.log(`==========================================`);
        
        // Calculate growth rate (compare with previous day)
        const previousDate = new Date(targetDate);
        previousDate.setDate(previousDate.getDate() - 1);
        const previousDateStr = previousDate.toLocaleDateString('en-CA'); // Use same format as sales filtering
        
        const previousDaySales = sales.filter(sale => {
            if (!sale.date) return false;
            
            // Parse the sale date and handle timezone like Sales History does
            const saleDate = new Date(sale.date);
            if (!saleDate || isNaN(saleDate)) return false;
            
            // Get the local date part (accounting for timezone)
            // This matches how Sales History displays dates
            const saleDateString = saleDate.toLocaleDateString('en-CA'); // en-CA gives YYYY-MM-DD format
            
            return saleDateString === previousDateStr;
        });
        
        const previousDayRevenue = previousDaySales.reduce((sum, sale) => sum + sale.total, 0);
        const growthRate = previousDayRevenue > 0 ? ((totalRevenue - previousDayRevenue) / previousDayRevenue) * 100 : 0;
        
        // Calculate peak hours for this specific date
        const peakHours = calculatePeakBusinessHours(dateSales);
        
        // Get category performance for this date
        const categoryStats = {};
        dateSales.forEach(sale => {
            if (sale.items) {
                sale.items.forEach(item => {
                    const category = item.category || 'Uncategorized';
                    if (!categoryStats[category]) {
                        categoryStats[category] = { revenue: 0, quantity: 0, items: 0 };
                    }
                    categoryStats[category].revenue += item.price * (item.qty || item.quantity);
                    categoryStats[category].quantity += (item.qty || item.quantity);
                    categoryStats[category].items += 1;
                });
            }
        });
        
        const insights = {
            date: targetDate,
            overview: {
                totalRevenue: totalRevenue,
                totalExpenses: totalExpenses,
                netProfit: netProfit,
                totalTransactions: totalTransactions,
                averageTransactionValue: averageTransactionValue
            },
            insights: {
                profitMargin: profitMargin,
                growthRate: growthRate,
                peakHours: peakHours,
                categoryPerformance: categoryStats
            },
            sales: dateSales,
            expenses: dateExpenses
        };
        
        console.log(`✅ Business insights calculated for ${targetDate}:`);
        console.log(`   Revenue: ₱${totalRevenue.toFixed(2)}, Expenses: ₱${totalExpenses.toFixed(2)}, Net: ₱${netProfit.toFixed(2)}`);
        console.log(`   Transactions: ${totalTransactions}, Growth: ${growthRate.toFixed(1)}%`);
        
        return insights;
        
    } catch (error) {
        console.error('❌ Error getting date-specific business insights:', error);
        return {
            date: targetDate,
            overview: {
                totalRevenue: 0,
                totalExpenses: 0,
                netProfit: 0,
                totalTransactions: 0,
                averageTransactionValue: 0
            },
            insights: {
                profitMargin: 0,
                growthRate: 0,
                peakHours: [],
                categoryPerformance: {}
            },
            sales: [],
            expenses: []
        };
    }
}

/**
 * Advanced Sales Analytics Dashboard
 * Provides comprehensive sales insights and trends
 */
async function generateAdvancedAnalytics(dateRange = '7days') {
    try {
        const sales = await getAllSales();
        const expenses = await getAllJournalEntries();
        
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
        
        console.log('🔍 Advanced Analytics Expense Filtering:', {
            dateRange: dateRange,
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0],
            totalExpenses: expenses.filter(exp => exp.type === 'expense').length,
            filteredExpensesByPaymentDate: filteredExpensesByPaymentDate.length
        });
        
        // Calculate advanced metrics
        const inventory = await getAllInventory(); // Get inventory for actual costs
        let totalRevenue = 0;
        let totalCosts = 0;
        
        // Calculate actual revenue and costs from sales items
        filteredSales.forEach(sale => {
            if (sale.items) {
                sale.items.forEach(item => {
                    if (!item.voided) {
                        // Add to revenue
                        totalRevenue += (item.price || 0) * (item.qty || 1);
                        
                        // Get actual cost from inventory
                        const inventoryItem = inventory.find(inv => inv.id === item.id);
                        const actualCost = inventoryItem ? (inventoryItem.cost || 0) : (item.cost || 0);
                        totalCosts += actualCost * (item.qty || 1);
                    }
                });
            }
        });
        
        const totalExpenses = filteredExpensesByPaymentDate.reduce((sum, exp) => sum + (exp.paymentAmount || 0), 0); // CHANGED: Use payment amounts from payment dates
        
        const analytics = {
            overview: {
                totalRevenue: totalRevenue,
                totalExpenses: totalExpenses,
                totalCosts: totalCosts,
                netProfit: 0,
                totalTransactions: filteredSales.length,
                averageTransactionValue: 0
            },
            trends: {
                dailySales: calculateDailySales(filteredSales),
                hourlySales: calculateHourlySales(filteredSales),
                categoryPerformance: calculateCategoryPerformance(filteredSales),
                topSellingItems: getTopSellingItems(filteredSales),
                paymentMethods: analyzePaymentMethods(filteredSales),
                peakBusinessHours: calculatePeakBusinessHours(filteredSales)
            },
            insights: {
                peakHours: identifyPeakHours(filteredSales),
                growthRate: calculateGrowthRate(filteredSales, dateRange),
                profitMargin: 0,
                customerFrequency: analyzeCustomerFrequency(filteredSales)
            },
            predictions: {
                nextDayForecast: predictNextDaySales(filteredSales),
                monthlyProjection: projectMonthlyRevenue(filteredSales),
                inventoryAlerts: generateInventoryAlerts()
            }
        };
        
        // Calculate derived metrics
        analytics.overview.netProfit = analytics.overview.totalRevenue - analytics.overview.totalCosts - analytics.overview.totalExpenses;
        analytics.overview.averageTransactionValue = analytics.overview.totalRevenue / analytics.overview.totalTransactions || 0;
        analytics.insights.profitMargin = (analytics.overview.netProfit / analytics.overview.totalRevenue * 100) || 0;
        
        return analytics;
    } catch (error) {
        console.error('Failed to generate analytics:', error);
        return null;
    }
}

/**
 * Calculate daily sales trends
 */
function calculateDailySales(sales) {
    const dailySales = {};
    
    sales.forEach(sale => {
        const date = new Date(sale.date).toLocaleDateString();
        if (!dailySales[date]) {
            dailySales[date] = { revenue: 0, transactions: 0 };
        }
        dailySales[date].revenue += sale.total;
        dailySales[date].transactions += 1;
    });
    
    return dailySales;
}

/**
 * Calculate hourly sales patterns
 */
function calculateHourlySales(sales) {
    const hourlySales = Array(24).fill(0);
    
    sales.forEach(sale => {
        const hour = new Date(sale.date).getHours();
        hourlySales[hour] += sale.total;
    });
    
    return hourlySales;
}

/**
 * Calculate peak business hours
 */
function calculatePeakBusinessHours(sales) {
    if (sales.length === 0) return [];
    
    const hourlyRevenue = {};
    
    sales.forEach(sale => {
        const hour = new Date(sale.date).getHours();
        const hourLabel = `${hour}:00-${hour + 1}:00`;
        
        if (!hourlyRevenue[hourLabel]) {
            hourlyRevenue[hourLabel] = {
                hour: hour,
                revenue: 0,
                transactions: 0,
                hourLabel: hourLabel
            };
        }
        
        hourlyRevenue[hourLabel].revenue += sale.total;
        hourlyRevenue[hourLabel].transactions += 1;
    });
    
    // Sort by revenue and return top 5 peak hours
    return Object.values(hourlyRevenue)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5)
        .map((peak, index) => ({
            rank: index + 1,
            hour: peak.hour,
            hourLabel: peak.hourLabel,
            revenue: peak.revenue,
            transactions: peak.transactions,
            averageTransaction: peak.revenue / peak.transactions
        }));
}

/**
 * Analyze category performance
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
    
    return categoryStats;
}

/**
 * Get top selling items
 */
function getTopSellingItems(sales) {
    const itemStats = {};
    
    sales.forEach(sale => {
        if (sale.items) {
            sale.items.forEach(item => {
                if (!itemStats[item.name]) {
                    itemStats[item.name] = { quantity: 0, revenue: 0, category: item.category };
                }
                itemStats[item.name].quantity += item.qty;
                itemStats[item.name].revenue += item.price * item.qty;
            });
        }
    });
    
    return Object.entries(itemStats)
        .sort(([,a], [,b]) => b.quantity - a.quantity)
        .slice(0, 10)
        .map(([name, stats]) => ({ name, ...stats }));
}

/**
 * Analyze payment method usage
 */
function analyzePaymentMethods(sales) {
    const paymentStats = { cash: 0, gcash: 0, mixed: 0 };
    
    sales.forEach(sale => {
        if (sale.given > 0 && (sale.cash || sale.gcash)) {
            if (sale.cash > 0 && sale.gcash > 0) {
                paymentStats.mixed += sale.total;
            } else if (sale.cash > 0) {
                paymentStats.cash += sale.total;
            } else {
                paymentStats.gcash += sale.total;
            }
        }
    });
    
    return paymentStats;
}

/**
 * Identify peak business hours
 */
function identifyPeakHours(sales) {
    const hourlyVolume = calculateHourlySales(sales);
    const peakHours = hourlyVolume
        .map((revenue, hour) => ({ hour, revenue }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 3);
    
    return peakHours;
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
 * Analyze customer frequency patterns
 */
function analyzeCustomerFrequency(sales) {
    // This would be enhanced with customer identification in a real system
    const dailyTransactions = {};
    
    sales.forEach(sale => {
        const date = new Date(sale.date).toLocaleDateString();
        dailyTransactions[date] = (dailyTransactions[date] || 0) + 1;
    });
    
    const avgDailyTransactions = Object.values(dailyTransactions).reduce((a, b) => a + b, 0) / Object.keys(dailyTransactions).length;
    
    return {
        averageDailyTransactions: avgDailyTransactions,
        busiestDay: Object.entries(dailyTransactions).sort(([,a], [,b]) => b - a)[0]?.[0] || null,
        totalUniqueDays: Object.keys(dailyTransactions).length
    };
}

/**
 * Predict next day sales based on trends
 */
function predictNextDaySales(sales) {
    if (sales.length < 7) return 0;
    
    const recentSales = sales.slice(-7);
    const avgDailySales = recentSales.reduce((sum, sale) => sum + sale.total, 0) / 7;
    
    // Simple linear trend prediction
    const trend = calculateGrowthRate(recentSales, '7days') / 100;
    const prediction = avgDailySales * (1 + trend);
    
    return Math.round(prediction * 100) / 100;
}

/**
 * Project monthly revenue
 */
function projectMonthlyRevenue(sales) {
    if (sales.length < 7) return 0;
    
    const recentSales = sales.slice(-7);
    const dailyAverage = recentSales.reduce((sum, sale) => sum + sale.total, 0) / 7;
    
    return Math.round(dailyAverage * 30 * 100) / 100;
}

/**
 * Generate inventory alerts
 */
async function generateInventoryAlerts() {
    try {
        const inventory = await getAllInventory();
        const alerts = [];
        
        inventory.forEach(item => {
            if (item.stock <= item.reorderPoint) {
                alerts.push({
                    type: 'low_stock',
                    itemName: item.name,
                    currentStock: item.stock,
                    reorderPoint: item.reorderPoint,
                    priority: item.stock === 0 ? 'critical' : 'warning'
                });
            }
        });
        
        return alerts;
    } catch (error) {
        console.error('Failed to generate inventory alerts:', error);
        return [];
    }
}

// ==================== CUSTOMER MANAGEMENT ====================

/**
 * Customer loyalty and rewards system
 */
class CustomerLoyaltySystem {
    constructor() {
        this.customers = new Map();
        this.tiers = {
            bronze: { points: 0, discount: 0, name: 'Bronze' },
            silver: { points: 100, discount: 5, name: 'Silver' },
            gold: { points: 500, discount: 10, name: 'Gold' },
            platinum: { points: 1000, discount: 15, name: 'Platinum' }
        };
    }
    
    /**
     * Add or update customer
     */
    addCustomer(phone, name, email = '') {
        if (!this.customers.has(phone)) {
            this.customers.set(phone, {
                phone,
                name,
                email,
                points: 0,
                totalSpent: 0,
                visits: 0,
                tier: 'bronze',
                joinDate: new Date().toISOString(),
                lastVisit: new Date().toISOString(),
                rewards: []
            });
        }
        return this.customers.get(phone);
    }
    
    /**
     * Record customer purchase and award points
     */
    recordPurchase(phone, amount) {
        const customer = this.customers.get(phone);
        if (!customer) return null;
        
        const pointsEarned = Math.floor(amount / 10); // 1 point per ₱10 spent
        customer.points += pointsEarned;
        customer.totalSpent += amount;
        customer.visits += 1;
        customer.lastVisit = new Date().toISOString();
        
        // Update tier
        this.updateCustomerTier(customer);
        
        // Check for rewards
        this.checkForRewards(customer);
        
        return customer;
    }
    
    /**
     * Update customer loyalty tier
     */
    updateCustomerTier(customer) {
        const newTier = Object.entries(this.tiers)
            .reverse()
            .find(([, tier]) => customer.points >= tier.points)?.[0] || 'bronze';
        
        if (newTier !== customer.tier) {
            customer.tier = newTier;
            customer.rewards.push({
                type: 'tier_upgrade',
                tier: newTier,
                date: new Date().toISOString(),
                description: `Upgraded to ${this.tiers[newTier].name} tier!`
            });
        }
    }
    
    /**
     * Check for eligible rewards
     */
    checkForRewards(customer) {
        // Birthday reward (simplified - would need actual birth date)
        if (customer.visits % 10 === 0) {
            customer.rewards.push({
                type: 'visit_milestone',
                description: 'Free item on your 10th visit!',
                date: new Date().toISOString(),
                used: false
            });
        }
        
        // Spending milestone
        if (customer.totalSpent >= 1000 && customer.totalSpent < 1100) {
            customer.rewards.push({
                type: 'spending_milestone',
                description: '₱100 voucher for reaching ₱1000 spent!',
                date: new Date().toISOString(),
                used: false
            });
        }
    }
    
    /**
     * Apply customer discount
     */
    applyDiscount(phone, originalAmount) {
        const customer = this.customers.get(phone);
        if (!customer) return { amount: originalAmount, discount: 0 };
        
        const discount = this.tiers[customer.tier].discount;
        const discountedAmount = originalAmount * (1 - discount / 100);
        
        return {
            amount: discountedAmount,
            discount: originalAmount - discountedAmount,
            tier: customer.tier
        };
    }
    
    /**
     * Get customer statistics
     */
    getCustomerStats(phone) {
        const customer = this.customers.get(phone);
        if (!customer) return null;
        
        return {
            ...customer,
            tierInfo: this.tiers[customer.tier],
            nextTier: this.getNextTier(customer),
            pointsToNextTier: this.getPointsToNextTier(customer)
        };
    }
    
    /**
     * Get next tier information
     */
    getNextTier(customer) {
        const currentTierIndex = Object.keys(this.tiers).indexOf(customer.tier);
        if (currentTierIndex >= Object.keys(this.tiers).length - 1) return null;
        
        return Object.values(this.tiers)[currentTierIndex + 1];
    }
    
    /**
     * Calculate points needed for next tier
     */
    getPointsToNextTier(customer) {
        const nextTier = this.getNextTier(customer);
        if (!nextTier) return 0;
        
        return Math.max(0, nextTier.points - customer.points);
    }
}

// Initialize loyalty system
const loyaltySystem = new CustomerLoyaltySystem();

// ==================== ADVANCED INVENTORY MANAGEMENT ====================

/**
 * Advanced inventory management with forecasting
 */
class AdvancedInventoryManager {
    constructor() {
        this.forecastingData = new Map();
        this.supplierManagement = new Map();
    }
    
    /**
     * Generate inventory forecast based on sales trends
     */
    async generateInventoryForecast(days = 30) {
        try {
            const sales = await getAllSales();
            const inventory = await getAllInventory();
            
            const forecast = {};
            
            inventory.forEach(item => {
                const itemSales = this.getItemSalesHistory(sales, item.name);
                const dailyUsage = this.calculateDailyUsage(itemSales);
                const safetyStock = Math.ceil(dailyUsage * 7); // 7 days safety stock
                const reorderPoint = Math.ceil(dailyUsage * 14); // 14 days buffer
                const projectedStock = item.stock - (dailyUsage * days);
                
                forecast[item.name] = {
                    currentStock: item.stock,
                    dailyUsage: Math.round(dailyUsage * 100) / 100,
                    safetyStock,
                    reorderPoint,
                    projectedStock,
                    daysOfStock: item.stock / dailyUsage || 0,
                    urgency: this.getStockUrgency(item.stock, reorderPoint),
                    suggestedOrder: Math.max(0, reorderPoint - item.stock),
                    trend: this.calculateUsageTrend(itemSales)
                };
            });
            
            return forecast;
        } catch (error) {
            console.error('Failed to generate inventory forecast:', error);
            return {};
        }
    }
    
    /**
     * Get item sales history
     */
    getItemSalesHistory(sales, itemName) {
        const itemSales = [];
        
        sales.forEach(sale => {
            if (sale.items) {
                const item = sale.items.find(i => i.name === itemName);
                if (item) {
                    itemSales.push({
                        date: sale.date,
                        quantity: item.qty,
                        price: item.price
                    });
                }
            }
        });
        
        return itemSales.sort((a, b) => new Date(a.date) - new Date(b.date));
    }
    
    /**
     * Calculate average daily usage
     */
    calculateDailyUsage(itemSales) {
        if (itemSales.length === 0) return 0;
        
        const totalQuantity = itemSales.reduce((sum, sale) => sum + sale.quantity, 0);
        const daysSpanned = Math.max(1, this.getDaysSpanned(itemSales));
        
        return totalQuantity / daysSpanned;
    }
    
    /**
     * Get days spanned by sales data
     */
    getDaysSpanned(sales) {
        if (sales.length === 0) return 0;
        
        const firstDate = new Date(sales[0].date);
        const lastDate = new Date(sales[sales.length - 1].date);
        
        return Math.max(1, Math.ceil((lastDate - firstDate) / (1000 * 60 * 60 * 24)));
    }
    
    /**
     * Get stock urgency level
     */
    getStockUrgency(currentStock, reorderPoint) {
        if (currentStock === 0) return 'critical';
        if (currentStock < reorderPoint * 0.25) return 'high';
        if (currentStock < reorderPoint) return 'medium';
        return 'low';
    }
    
    /**
     * Calculate usage trend
     */
    calculateUsageTrend(itemSales) {
        if (itemSales.length < 7) return 'stable';
        
        const recent = itemSales.slice(-7);
        const previous = itemSales.slice(-14, -7);
        
        const recentAvg = recent.reduce((sum, sale) => sum + sale.quantity, 0) / recent.length;
        const previousAvg = previous.reduce((sum, sale) => sum + sale.quantity, 0) / previous.length;
        
        if (recentAvg > previousAvg * 1.2) return 'increasing';
        if (recentAvg < previousAvg * 0.8) return 'decreasing';
        return 'stable';
    }
    
    /**
     * Generate supplier performance report
     */
    generateSupplierReport() {
        // This would integrate with supplier data in a real implementation
        return {
            topPerformers: [],
            deliveryTimes: {},
            qualityScores: {},
            costComparisons: {}
        };
    }
}

// Initialize advanced inventory manager
const advancedInventory = new AdvancedInventoryManager();

// ==================== BUSINESS INTELLIGENCE ====================

/**
 * Business intelligence and reporting
 */
class BusinessIntelligence {
    constructor() {
        this.reports = new Map();
        this.alerts = [];
    }
    
    /**
     * Generate comprehensive business report
     */
    async generateBusinessReport(period = 'monthly') {
        try {
            const analytics = await generateAdvancedAnalytics(period);
            const inventoryForecast = await advancedInventory.generateInventoryForecast();
            
            const report = {
                period,
                generatedAt: new Date().toISOString(),
                executiveSummary: this.generateExecutiveSummary(analytics),
                financialMetrics: this.generateFinancialMetrics(analytics),
                operationalMetrics: this.generateOperationalMetrics(analytics, inventoryForecast),
                recommendations: this.generateRecommendations(analytics, inventoryForecast),
                alerts: this.generateBusinessAlerts(analytics, inventoryForecast)
            };
            
            return report;
        } catch (error) {
            console.error('Failed to generate business report:', error);
            return null;
        }
    }
    
    /**
     * Generate executive summary
     */
    generateExecutiveSummary(analytics) {
        const { overview, insights } = analytics;
        
        return {
            totalRevenue: overview.totalRevenue,
            netProfit: overview.netProfit,
            profitMargin: insights.profitMargin,
            totalTransactions: overview.totalTransactions,
            growthRate: insights.growthRate,
            keyInsights: this.generateKeyInsights(analytics)
        };
    }
    
    /**
     * Generate key business insights
     */
    generateKeyInsights(analytics) {
        const insights = [];
        
        if (analytics.insights.growthRate > 10) {
            insights.push('Strong revenue growth detected - consider expansion opportunities');
        }
        
        if (analytics.insights.profitMargin < 20) {
            insights.push('Low profit margin - review pricing strategy and cost structure');
        }
        
        const peakHours = analytics.insights.peakHours;
        if (peakHours.length > 0) {
            insights.push(`Peak business hours: ${peakHours.map(h => `${h.hour}:00`).join(', ')}`);
        }
        
        return insights;
    }
    
    /**
     * Generate financial metrics
     */
    generateFinancialMetrics(analytics) {
        return {
            revenue: analytics.overview.totalRevenue,
            expenses: analytics.overview.totalExpenses,
            profit: analytics.overview.netProfit,
            profitMargin: analytics.insights.profitMargin,
            averageTransaction: analytics.overview.averageTransactionValue,
            revenuePerTransaction: analytics.overview.totalRevenue / analytics.overview.totalTransactions || 0
        };
    }
    
    /**
     * Generate operational metrics
     */
    generateOperationalMetrics(analytics, inventoryForecast) {
        const criticalItems = Object.values(inventoryForecast).filter(item => item.urgency === 'critical').length;
        const lowItems = Object.values(inventoryForecast).filter(item => item.urgency === 'high').length;
        
        return {
            totalTransactions: analytics.overview.totalTransactions,
            peakHours: analytics.insights.peakHours,
            inventoryAlerts: {
                critical: criticalItems,
                low: lowItems,
                total: criticalItems + lowItems
            },
            topCategories: this.getTopCategories(analytics.trends.categoryPerformance)
        };
    }
    
    /**
     * Get top performing categories
     */
    getTopCategories(categoryPerformance) {
        return Object.entries(categoryPerformance)
            .sort(([,a], [,b]) => b.revenue - a.revenue)
            .slice(0, 5)
            .map(([name, stats]) => ({ name, revenue: stats.revenue, items: stats.items }));
    }
    
    /**
     * Generate business recommendations
     */
    generateRecommendations(analytics, inventoryForecast) {
        const recommendations = [];
        
        // Revenue recommendations
        if (analytics.insights.growthRate < 0) {
            recommendations.push({
                type: 'revenue',
                priority: 'high',
                title: 'Declining Revenue',
                description: 'Revenue has decreased. Consider promotional campaigns or pricing adjustments.'
            });
        }
        
        // Inventory recommendations
        const criticalItems = Object.entries(inventoryForecast).filter(([, item]) => item.urgency === 'critical');
        if (criticalItems.length > 0) {
            recommendations.push({
                type: 'inventory',
                priority: 'critical',
                title: 'Critical Stock Levels',
                description: `${criticalItems.length} items are out of stock. Immediate reordering required.`
            });
        }
        
        // Profit margin recommendations
        if (analytics.insights.profitMargin < 15) {
            recommendations.push({
                type: 'profitability',
                priority: 'medium',
                title: 'Low Profit Margin',
                description: 'Consider reviewing cost structure and pricing strategy to improve profitability.'
            });
        }
        
        return recommendations;
    }
    
    /**
     * Generate business alerts
     */
    generateBusinessAlerts(analytics, inventoryForecast) {
        const alerts = [];
        
        // Critical inventory alerts
        Object.entries(inventoryForecast).forEach(([itemName, forecast]) => {
            if (forecast.urgency === 'critical') {
                alerts.push({
                    type: 'inventory',
                    severity: 'critical',
                    title: 'Out of Stock',
                    message: `${itemName} is out of stock`,
                    action: 'Reorder immediately'
                });
            }
        });
        
        // Financial alerts
        if (analytics.insights.profitMargin < 10) {
            alerts.push({
                type: 'financial',
                severity: 'high',
                title: 'Low Profit Margin',
                message: `Profit margin is ${analytics.insights.profitMargin.toFixed(1)}%`,
                action: 'Review pricing and costs'
            });
        }
        
        return alerts;
    }
}

// Initialize business intelligence
const businessIntelligence = new BusinessIntelligence();

// ==================== EXPORT FUNCTIONS ====================

// Make premium functions available globally
window.generateAdvancedAnalytics = generateAdvancedAnalytics;
window.getItemsSoldOnSpecificDate = getItemsSoldOnSpecificDate;
window.exportDateSpecificData = exportDateSpecificData;
window.getDateSpecificBusinessInsights = getDateSpecificBusinessInsights;
window.CustomerLoyaltySystem = CustomerLoyaltySystem;
window.loyaltySystem = loyaltySystem;
window.AdvancedInventoryManager = AdvancedInventoryManager;
window.advancedInventory = advancedInventory;
window.BusinessIntelligence = BusinessIntelligence;
window.businessIntelligence = businessIntelligence;
window.getLoyaltyTierSettings = getLoyaltyTierSettings;
window.saveLoyaltyTierSettings = saveLoyaltyTierSettings;
window.generateTierId = generateTierId;

// Loyalty Tier Settings Management
async function getLoyaltyTierSettings() {
    try {
        // Get from localStorage or use default settings
        const savedSettings = localStorage.getItem('loyaltyTierSettings');
        if (savedSettings) {
            return JSON.parse(savedSettings);
        }
        
        // Default settings
        const defaultTiers = [
            { name: 'Bronze', points: 0, discount: 0, icon: '🥉', color: 'warning', id: 'bronze' },
            { name: 'Silver', points: 100, discount: 5, icon: '🥈', color: 'secondary', id: 'silver' },
            { name: 'Gold', points: 500, discount: 10, icon: '🥇', color: 'success', id: 'gold' },
            { name: 'Platinum', points: 1000, discount: 15, icon: '💎', color: 'primary', id: 'platinum' }
        ];
        
        return defaultTiers;
    } catch (error) {
        console.error('❌ Error getting loyalty tier settings:', error);
        return [];
    }
}

async function saveLoyaltyTierSettings(tiers) {
    try {
        localStorage.setItem('loyaltyTierSettings', JSON.stringify(tiers));
        console.log('✅ Loyalty tier settings saved:', tiers);
        
        // Update the loyalty system tiers
        if (window.loyaltySystem) {
            window.loyaltySystem.tiers = {};
            tiers.forEach(tier => {
                window.loyaltySystem.tiers[tier.id] = {
                    name: tier.name,
                    points: tier.points,
                    discount: tier.discount,
                    icon: tier.icon,
                    color: tier.color
                };
            });
        }
        
        return true;
    } catch (error) {
        console.error('❌ Error saving loyalty tier settings:', error);
        return false;
    }
}

function generateTierId(name) {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '-');
}

const availableIcons = ['🥉', '🥈', '🥇', '💎', '👑', '🌟', '💫', '⭐', '🏆', '🎖️', '🎯', '🎪', '🎨', '🎭', '🎪'];
const availableColors = ['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'dark', 'light'];

// Make these available globally
window.availableIcons = availableIcons;
window.availableColors = availableColors;

console.log('🚀 Premium functions loaded - Advanced Analytics, Customer Loyalty, Inventory Management, and Business Intelligence ready!');
