// =============================================================================
// REUSABLE CHART SYSTEM FOR MODE ANALYTICS - SPEND CATEGORIES
// =============================================================================
// Wrapped in IIFE to prevent global variable conflicts
// =============================================================================

(function() {
    'use strict';
    
    // =============================================================================
    // CONFIGURATION SECTION - MODIFY THIS FOR DIFFERENT CHARTS/QUERIES
    // =============================================================================

    const CHART_CONFIG = {
        // Chart basic settings
        chartTitle: 'Daily BW Spend Categories',
        chartType: 'line', // Options: 'line', 'area', 'grouped_bar', 'stacked_bar', 'stacked_bar_with_line'
        defaultTimeRange: '90D',
        
        // Mode Analytics integration
        modeDatasetName: 'Daily BW Budget vs Spend Ratio Count (channel filter does not apply)', // Name of your SQL query in Mode
        fallbackToFirstDataset: true, // If specific dataset not found, use datasets[0]
        
        // Data Structure Definition - Describes your SQL output
        dataStructure: {
            dateColumn: 'day',                    // Required: Column containing dates
            groupByColumns: ['objective_id'],     // Optional: Columns to aggregate across (empty array = no grouping)
            valueColumns: {                       // Define all metrics from your SQL
                total: { 
                    type: 'count',                // Data type: 'count', 'currency', 'percentage', 'decimal'
                    column: 'total',              // SQL column name
                    required: true                // Whether this column must exist
                },
                no_budget: { 
                    type: 'count', 
                    column: 'no_budget', 
                    required: true 
                },
                overspend: { 
                    type: 'count', 
                    column: 'overspend', 
                    required: true 
                },
                spend_90_pct: { 
                    type: 'count', 
                    column: 'spend_90_pct', 
                    required: true 
                },
                spend_90_pct_less: { 
                    type: 'count', 
                    column: 'spend_90_pct_less', 
                    required: true 
                }
            }
        },
        
        // Data Processing Rules - All optional, applied only if specified
        processing: {
            aggregation: {
                enabled: true,                    // Whether to aggregate by date
                method: 'sum'                     // 'sum', 'avg', 'max', 'min', 'count'
            },
            filters: [],
            calculations: []
        },
        
        // Chart Metrics Configuration - yAxisID will be auto-assigned based on data type
        metrics: [
            {
                id: 'total',
                name: 'total',
                color: '#9f7aea',
                backgroundColor: 'rgba(159, 122, 234, 0.1)',
                visible: true,
                type: 'line',
                order: 5,
                dataKey: 'total'
            },
            {
                id: 'no_budget',
                name: 'no_budget',
                color: '#48bb78',
                backgroundColor: 'rgba(72, 187, 120, 0.1)',
                visible: true,
                type: 'line',
                order: 1,
                dataKey: 'no_budget'
            },
            {
                id: 'overspend',
                name: 'overspend',
                color: '#4299e1',
                backgroundColor: 'rgba(66, 153, 225, 0.1)',
                visible: true,
                type: 'line',
                order: 2,
                dataKey: 'overspend'
            },
            {
                id: 'spend_90_pct',
                name: 'spend_90_pct',
                color: '#ed8936',
                backgroundColor: 'rgba(237, 137, 54, 0.1)',
                visible: true,
                type: 'line',
                order: 3,
                dataKey: 'spend_90_pct'
            },
            {
                id: 'spend_90_pct_less',
                name: 'spend_90_pct_less',
                color: '#38b2ac',
                backgroundColor: 'rgba(56, 178, 172, 0.1)',
                visible: true,
                type: 'line',
                order: 4,
                dataKey: 'spend_90_pct_less'
            }
        ],
        
        // Trend Line Configuration
        trendLines: {
            enabled: false,
            metrics: ['spend'],
            color: '#ff6b6b',
            style: 'dashed'
        },
        
        // Chart Styling
        styling: {
            height: 400,
            showLegend: false,
            gridColor: 'rgba(0, 0, 0, 0.1)',
            backgroundColor: '#ffffff'
        },
        
        // Y-Axis Configuration - Auto-configured based on data types
        yAxes: {
            primary: {
                id: 'y',
                position: 'left',
                title: 'Count',
                min: 0,
                formatter: (value) => value.toLocaleString()
            },
            secondary: {
                id: 'y1',
                position: 'right',
                title: 'Percentage',
                autoScale: true,
                formatter: (value) => value.toFixed(2)
            }
        }
    };

    // =============================================================================
    // CHART TYPE DEFINITIONS
    // =============================================================================

    const CHART_TYPES = {
        line: {
            baseType: 'line',
            defaultMetricType: 'line',
            stackBars: false,
            fillArea: false
        },
        area: {
            baseType: 'line',
            defaultMetricType: 'line',
            stackBars: false,
            fillArea: true
        },
        grouped_bar: {
            baseType: 'bar',
            defaultMetricType: 'bar',
            stackBars: false,
            fillArea: false
        },
        stacked_bar: {
            baseType: 'bar',
            defaultMetricType: 'bar',
            stackBars: true,
            fillArea: false
        },
        stacked_bar_with_line: {
            baseType: 'bar',
            defaultMetricType: 'bar',
            stackBars: true,
            fillArea: false,
            allowMixedTypes: true
        }
    };

    // =============================================================================
    // NAMESPACED GLOBAL VARIABLES (to avoid conflicts with other charts)
    // =============================================================================

    let chart;
    let rawData = [];
    let processedData = {};
    let currentTimeRange = CHART_CONFIG.defaultTimeRange;
    let isZoomEnabled = false;

    // =============================================================================
    // INITIALIZATION
    // =============================================================================

    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(() => {
            initializeChart();
            createMetricToggles();
            
            // Try to load data from Mode Analytics if available
            if (typeof datasets !== 'undefined') {
                loadModeData();
            }
        }, 100);
    });

    // For Mode Analytics - polling mechanism to ensure initialization
    let initAttempts = 0;
    const maxAttempts = 10;

    function attemptInitialization() {
        initAttempts++;
        
        const canvas = document.getElementById('spendCategoriesChart');
        const togglesContainer = document.querySelector('.spend-categories-toggles');
        const metricsContainer = document.querySelector('.spend-categories-metrics');
        
        if (canvas && togglesContainer && typeof Chart !== 'undefined') {
            if (!chart) {
                initializeChart();
            }
            
            // Check for actual HTML elements, not comments or text nodes
            const hasActualElements = togglesContainer.children.length > 0;
            if (!hasActualElements) {
                createMetricToggles();
            }
            
            // Try to load data from Mode Analytics
            if (typeof datasets !== 'undefined') {
                loadModeData();
            } else {
                // Start polling for Mode data
                pollForModeData();
            }
            return;
        }
        
        if (initAttempts < maxAttempts) {
            setTimeout(attemptInitialization, 500);
        }
    }

    // Start polling after a short delay
    setTimeout(attemptInitialization, 200);



    // =============================================================================
    // MODE ANALYTICS DATA LOADING
    // =============================================================================

    function loadModeData() {
        console.log('Loading data from Mode Analytics...');
        
        try {
            if (typeof datasets !== 'undefined') {
                console.log('Found datasets object');
                console.log('Available datasets:', Object.keys(datasets));
                
                // Target the specific spend categories query dataset
                const targetQueryName = 'Daily BW Budget vs Spend Ratio Count (channel filter does not apply)';
                let targetDataset = null;
                let datasetName = null;
                
                console.log('Looking for specific query:', targetQueryName);
                
                if (datasets[targetQueryName]) {
                    console.log('Found target query dataset:', targetQueryName);
                    targetDataset = datasets[targetQueryName];
                    datasetName = targetQueryName;
                } else {
                    console.warn('Target query not found, available queries:', Object.keys(datasets));
                    
                    // Try multiple fallback strategies like the budget chart
                    let found = false;
                    
                    // Strategy 1: Try index 1 but check if it has data and didn't fail
                    if (datasets[1] && datasets[1].state !== 'failed' && datasets[1].content && datasets[1].content.length > 0) {
                        console.log('Fallback: Using datasets[1] (has data)');
                        targetDataset = datasets[1];
                        datasetName = 'datasets[1] (fallback)';
                        found = true;
                    } else if (datasets[1]) {
                        console.warn('datasets[1] exists but failed or has no data. State:', datasets[1].state, 'Rows:', datasets[1].content ? datasets[1].content.length : 'no content');
                    }
                    
                    // Strategy 2: Search for any working dataset with data
                    if (!found) {
                        console.log('Searching for any working dataset with data...');
                        for (let i = 0; i < Object.keys(datasets).length; i++) {
                            const dataset = datasets[i];
                            if (dataset && dataset.state !== 'failed' && dataset.content && dataset.content.length > 0) {
                                console.log(`Found working dataset at index ${i} with ${dataset.content.length} rows`);
                                console.log('Query name:', dataset.queryName || 'unknown');
                                console.log('Sample row:', dataset.content[0]);
                                targetDataset = dataset;
                                datasetName = `datasets[${i}] (working fallback)`;
                                found = true;
                                break;
                            }
                        }
                    }
                    
                    if (!found) {
                        console.error('No working datasets found with data');
                    }
                }
                
                if (targetDataset) {
                    console.log(`Using dataset: ${datasetName}`);
                    console.log('Dataset structure:', targetDataset);
                    
                    // Extract data from the dataset - Mode stores data in the 'content' property
                    rawData = targetDataset.content || targetDataset || [];
                    console.log('Mode data loaded:', rawData.length, 'rows');
                    console.log('Dataset columns:', targetDataset.columns);
                    
                    // Debug: Log first few rows
                    if (rawData.length > 0) {
                        console.log('First 3 rows:', rawData.slice(0, 3));
                    }
                    
                    processData();
                    updateChart();
                } else {
                    console.warn('No suitable dataset found');
                    console.log('Available dataset names:', Object.keys(datasets));
                }
            } else {
                console.warn('No datasets object found in Mode Analytics');
            }
        } catch (error) {
            console.error('Error loading Mode data:', error);
        }
    }

    function pollForModeData() {
        let pollAttempts = 0;
        const maxPollAttempts = 20;
        
        function checkForModeData() {
            pollAttempts++;
            
            if (typeof datasets !== 'undefined') {
                console.log('Datasets object found!');
                loadModeData();
                return;
            }
            
            if (pollAttempts < maxPollAttempts) {
                setTimeout(checkForModeData, 1000);
            } else {
                console.error('Max polling attempts reached - no Mode datasets found');
            }
        }
        
        checkForModeData();
    }

    // =============================================================================
    // SIMPLE DATA PROCESSING (like budget chart)
    // =============================================================================

    function processData() {
        console.log('Processing data...');
        
        if (!rawData || rawData.length === 0) {
            console.warn('No data to process');
            return;
        }
        
        console.log('Raw data type:', typeof rawData);
        console.log('Raw data is array:', Array.isArray(rawData));
        console.log('Raw data sample:', rawData.slice(0, 5));
        
        // Check what columns we have in the first row
        if (rawData.length > 0) {
            const firstRow = rawData[0];
            const availableColumns = Object.keys(firstRow);
            console.log('Available columns:', availableColumns);
            console.log('First few rows with column names:', rawData.slice(0, 3));
            
            // Check if we have spend categories data in different formats
            const hasSpendCategoriesWide = ['total', 'no_budget', 'overspend', 'spend_90_pct', 'spend_90_pct_less'].some(col => availableColumns.includes(col));
            const hasSpendCategoriesLong = availableColumns.includes('Measure Names') && availableColumns.includes('Measure Values');
            const hasBudgetData = ['budget', 'spend'].every(col => availableColumns.includes(col));
            
            if (hasSpendCategoriesWide) {
                console.log('✅ Processing as spend categories data (wide format)');
                processSpendCategoriesData();
            } else if (hasSpendCategoriesLong) {
                console.log('✅ Processing as spend categories data (long format - Mode pivot)');
                processSpendCategoriesLongFormat();
            } else if (hasBudgetData) {
                console.log('⚠️ Processing budget data with spend categories chart (fallback mode)');
                processBudgetDataAsFallback();
            } else {
                console.error('❌ Unknown data structure:', availableColumns);
                console.log('Available columns:', availableColumns);
                console.log('Sample rows:', rawData.slice(0, 3));
                return;
            }
        }
    }
    
    function processSpendCategoriesData() {
        // Group data by day and aggregate (wide format)
        const dailyData = {};
        
        rawData.forEach((row, index) => {
            const day = row.day;
            if (!day) return;
            
            if (!dailyData[day]) {
                dailyData[day] = {
                    total: 0,
                    no_budget: 0,
                    overspend: 0,
                    spend_90_pct: 0,
                    spend_90_pct_less: 0,
                    count: 0
                };
            }
            
            dailyData[day].total += parseInt(row.total || 0);
            dailyData[day].no_budget += parseInt(row.no_budget || 0);
            dailyData[day].overspend += parseInt(row.overspend || 0);
            dailyData[day].spend_90_pct += parseInt(row.spend_90_pct || 0);
            dailyData[day].spend_90_pct_less += parseInt(row.spend_90_pct_less || 0);
            dailyData[day].count += 1;
        });
        
        // Convert to arrays sorted by date
        const sortedDays = Object.keys(dailyData).sort();
        
        // Filter by time range
        const filteredDays = filterDaysByTimeRange(sortedDays);
        
        processedData = {
            labels: filteredDays,
            total: filteredDays.map(day => dailyData[day].total),
            no_budget: filteredDays.map(day => dailyData[day].no_budget),
            overspend: filteredDays.map(day => dailyData[day].overspend),
            spend_90_pct: filteredDays.map(day => dailyData[day].spend_90_pct),
            spend_90_pct_less: filteredDays.map(day => dailyData[day].spend_90_pct_less)
        };
        
        console.log('Spend categories data processed (wide format):', processedData.labels.length, 'days');
    }
    
    function processSpendCategoriesLongFormat() {
        // Handle long format data (Mode pivot table style)
        const dailyData = {};
        
        console.log('Processing long format data. Sample rows:', rawData.slice(0, 10));
        
        rawData.forEach((row, index) => {
            // Handle different possible date column names
            const day = row['DAY(day)'] || row.day || row['Day'] || row.date;
            const measureName = row['Measure Names'] || row.measure_names;
            const measureValue = parseInt(row['Measure Values'] || row.measure_values || 0);
            
            if (!day || !measureName) {
                if (index < 5) console.log(`Skipping row ${index}: missing day or measure name`, { day, measureName });
                return;
            }
            
            // Extract just the date part if it's a full datetime
            const dayKey = day.includes(' ') ? day.split(' ')[0] : day;
            
            if (!dailyData[dayKey]) {
                dailyData[dayKey] = {
                    total: 0,
                    no_budget: 0,
                    overspend: 0,
                    spend_90_pct: 0,
                    spend_90_pct_less: 0
                };
            }
            
            // Map measure names to our expected format
            switch (measureName) {
                case 'total':
                    dailyData[dayKey].total = measureValue;
                    break;
                case 'no_budget':
                    dailyData[dayKey].no_budget = measureValue;
                    break;
                case 'overspend':
                    dailyData[dayKey].overspend = measureValue;
                    break;
                case 'spend_90_pct':
                    dailyData[dayKey].spend_90_pct = measureValue;
                    break;
                case 'spend_90_pct_less':
                    dailyData[dayKey].spend_90_pct_less = measureValue;
                    break;
                default:
                    if (index < 5) console.log(`Unknown measure name: ${measureName}`);
            }
        });
        
        console.log('Processed daily data:', Object.keys(dailyData).length, 'days');
        console.log('Sample daily data:', Object.keys(dailyData).slice(0, 3).map(day => ({ day, data: dailyData[day] })));
        
        // Convert to arrays sorted by date
        const sortedDays = Object.keys(dailyData).sort();
        
        // Filter by time range
        const filteredDays = filterDaysByTimeRange(sortedDays);
        
        processedData = {
            labels: filteredDays,
            total: filteredDays.map(day => dailyData[day].total),
            no_budget: filteredDays.map(day => dailyData[day].no_budget),
            overspend: filteredDays.map(day => dailyData[day].overspend),
            spend_90_pct: filteredDays.map(day => dailyData[day].spend_90_pct),
            spend_90_pct_less: filteredDays.map(day => dailyData[day].spend_90_pct_less)
        };
        
        console.log('Spend categories data processed (long format):', processedData.labels.length, 'days');
        console.log('Sample processed data:', {
            labels: processedData.labels.slice(0, 3),
            total: processedData.total.slice(0, 3),
            overspend: processedData.overspend.slice(0, 3)
        });
    }
    
    function processBudgetDataAsFallback() {
        // Process budget data similar to budget chart but adapt for spend categories display
        const dailyData = {};
        
        rawData.forEach((row, index) => {
            const budget = parseFloat(row.budget || 0);
            const spend = parseFloat(row.spend || 0);
            const spend_pct = parseFloat(row["spend pct"] || 0);
            
            // Skip invalid rows
            if (budget <= 0 || isNaN(spend_pct)) {
                return;
            }
            
            const day = row.day;
            if (!dailyData[day]) {
                dailyData[day] = {
                    budget: 0,
                    spend: 0,
                    spend_pct_sum: 0,
                    count: 0
                };
            }
            
            dailyData[day].budget += budget;
            dailyData[day].spend += spend;
            dailyData[day].spend_pct_sum += spend_pct;
            dailyData[day].count += 1;
        });
        
        // Convert to arrays sorted by date
        const sortedDays = Object.keys(dailyData).sort();
        
        // Filter by time range
        const filteredDays = filterDaysByTimeRange(sortedDays);
        
        // Adapt budget data to spend categories format
        processedData = {
            labels: filteredDays,
            total: filteredDays.map(day => dailyData[day].count), // Use count as total
            no_budget: filteredDays.map(() => 0), // No data for this
            overspend: filteredDays.map(day => dailyData[day].spend_pct_sum / dailyData[day].count > 1 ? dailyData[day].count : 0),
            spend_90_pct: filteredDays.map(day => {
                const avgPct = dailyData[day].spend_pct_sum / dailyData[day].count;
                return (avgPct >= 0.9 && avgPct <= 1.0) ? dailyData[day].count : 0;
            }),
            spend_90_pct_less: filteredDays.map(day => {
                const avgPct = dailyData[day].spend_pct_sum / dailyData[day].count;
                return avgPct < 0.9 ? dailyData[day].count : 0;
            })
        };
        
        console.log('Budget data adapted to spend categories format:', processedData.labels.length, 'days');
    }
    
    function filterDaysByTimeRange(sortedDays) {
        let daysToShow;
        
        switch (currentTimeRange) {
            case '7D':
                daysToShow = 7;
                break;
            case '30D':
                daysToShow = 30;
                break;
            case '90D':
                daysToShow = 90;
                break;
            case 'ALL':
            default:
                return sortedDays;
        }
        
        // Take the last N days of available data
        const startIndex = Math.max(0, sortedDays.length - daysToShow);
        return sortedDays.slice(startIndex);
    }

    // Helper function to apply filters
    function applyFilters(data, filters) {
        return data.filter(row => {
            return filters.every(filter => {
                const value = row[filter.column];
                
                switch (filter.operator) {
                    case '>': return value > filter.value;
                    case '<': return value < filter.value;
                    case '>=': return value >= filter.value;
                    case '<=': return value <= filter.value;
                    case '=': return value === filter.value;
                    case '!=': return value !== filter.value;
                    case 'not_null': return value !== null && value !== undefined;
                    case 'not_empty': return value !== null && value !== undefined && value !== '';
                    default: return true;
                }
            });
        });
    }

    // Helper function to apply calculations
    function applyCalculations(data, calculations) {
        return data.map(row => {
            const newRow = { ...row };
            
            calculations.forEach(calc => {
                try {
                    // Simple formula evaluation - extend as needed
                    let result = eval(calc.formula.replace(/(\w+)/g, (match) => {
                        return newRow[match] !== undefined ? newRow[match] : 0;
                    }));
                    
                    if (calc.applyMinZero && result < 0) {
                        result = 0;
                    }
                    
                    newRow[calc.name] = result;
                } catch (error) {
                    console.warn(`Error applying calculation ${calc.name}:`, error);
                    newRow[calc.name] = 0;
                }
            });
            
            return newRow;
        });
    }

    // Helper function to aggregate data
    function aggregateData(data, dataStructure, method) {
        const { dateColumn, groupByColumns, valueColumns } = dataStructure;
        const aggregated = {};
        
        data.forEach(row => {
            const dateKey = row[dateColumn];
            if (!dateKey) return;
            
            // Create grouping key
            const groupKey = groupByColumns.length > 0 
                ? groupByColumns.map(col => row[col]).join('|')
                : 'all';
            
            const fullKey = `${dateKey}|${groupKey}`;
            
            if (!aggregated[fullKey]) {
                aggregated[fullKey] = {
                    [dateColumn]: dateKey,
                    ...Object.fromEntries(groupByColumns.map(col => [col, row[col]])),
                    ...Object.fromEntries(Object.keys(valueColumns).map(col => [col, []])),
                    _count: 0
                };
            }
            
            // Collect values for aggregation
            Object.keys(valueColumns).forEach(col => {
                const value = row[col];
                if (value !== null && value !== undefined && value !== '') {
                    aggregated[fullKey][col].push(Number(value) || 0);
                }
            });
            
            aggregated[fullKey]._count++;
        });
        
        // Apply aggregation method
        Object.keys(aggregated).forEach(key => {
            const item = aggregated[key];
            
            Object.keys(valueColumns).forEach(col => {
                const values = item[col];
                let result = 0;
                
                if (values.length > 0) {
                    switch (method) {
                        case 'sum':
                            result = values.reduce((a, b) => a + b, 0);
                            break;
                        case 'avg':
                            result = values.reduce((a, b) => a + b, 0) / values.length;
                            break;
                        case 'max':
                            result = Math.max(...values);
                            break;
                        case 'min':
                            result = Math.min(...values);
                            break;
                        case 'count':
                            result = values.length;
                            break;
                        default:
                            result = values.reduce((a, b) => a + b, 0);
                    }
                }
                
                item[col] = result;
            });
            
            delete item._count;
        });
        
        return aggregated;
    }

    // Helper function for non-aggregated data formatting
    function formatDataWithoutAggregation(data, dataStructure) {
        const { dateColumn } = dataStructure;
        const formatted = {};
        
        data.forEach((row, index) => {
            const dateKey = row[dateColumn] || `row_${index}`;
            formatted[dateKey] = row;
        });
        
        return formatted;
    }

    // Helper function to filter by time range
    function filterByTimeRange(data, timeRange) {
        if (timeRange === 'ALL') return data;
        
        const now = new Date();
        let startDate;
        
        switch (timeRange) {
            case '7D':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30D':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case '90D':
                startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                break;
            default:
                return data;
        }
        
        const filtered = {};
        Object.keys(data).forEach(key => {
            const item = data[key];
            const itemDate = new Date(item[CHART_CONFIG.dataStructure.dateColumn]);
            
            if (itemDate >= startDate) {
                filtered[key] = item;
            }
        });
        
        return filtered;
    }

    // Helper function to format data for Chart.js
    function formatForChart(data, metrics) {
        const sortedKeys = Object.keys(data).sort();
        const labels = sortedKeys.map(key => {
            const item = data[key];
            return item[CHART_CONFIG.dataStructure.dateColumn];
        });
        
        const datasets = [];
        const metricData = {};
        
        // Initialize metric data arrays
        metrics.forEach(metric => {
            metricData[metric.id] = [];
        });
        
        // Fill data arrays
        sortedKeys.forEach(key => {
            const item = data[key];
            
            metrics.forEach(metric => {
                const value = item[metric.dataKey];
                metricData[metric.id].push(value !== undefined ? value : null);
            });
        });
        
        return {
            labels,
            datasets,
            metricData
        };
    }

    // =============================================================================
    // DYNAMIC CHART CREATION
    // =============================================================================

    function initializeChart() {
        console.log('Initializing chart...');
        
        if (typeof Chart === 'undefined') {
            console.error('Chart.js not available!');
            return;
        }
        
        const canvas = document.getElementById('spendCategoriesChart');
        if (!canvas) {
            console.error('Canvas not found!');
            return;
        }
        
        // Destroy existing chart if it exists
        if (chart) {
            chart.destroy();
            chart = null;
        }
        
        const ctx = canvas.getContext('2d');
        
        // Register Chart.js plugins
        if (typeof ChartZoom !== 'undefined') {
            Chart.register(ChartZoom);
        }
        if (typeof ChartAnnotation !== 'undefined') {
            Chart.register(ChartAnnotation);
        }
        
        const chartType = CHART_TYPES[CHART_CONFIG.chartType] || CHART_TYPES.line;
        
        // Chart configuration
        const config = {
            type: chartType.baseType,
            data: {
                labels: [],
                datasets: []
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                plugins: {
                    title: {
                        display: true,
                        text: CHART_CONFIG.chartTitle
                    },
                    legend: {
                        display: CHART_CONFIG.styling.showLegend
                    },
                    zoom: {
                        zoom: {
                            wheel: {
                                enabled: false,
                            },
                            pinch: {
                                enabled: false
                            },
                            mode: 'x',
                        },
                        pan: {
                            enabled: true,
                            mode: 'x',
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'day'
                        },
                        title: {
                            display: true,
                            text: 'Date'
                        }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: CHART_CONFIG.yAxes.primary.title
                        },
                        min: CHART_CONFIG.yAxes.primary.min
                    },
                    y1: {
                        type: 'linear',
                        display: false,
                        position: 'right',
                        title: {
                            display: true,
                            text: CHART_CONFIG.yAxes.secondary.title
                        },
                        grid: {
                            drawOnChartArea: false,
                        },
                    }
                }
            }
        };
        
        try {
            // Create the chart
            chart = new Chart(ctx, config);
            console.log('Chart created successfully');
        } catch (error) {
            console.error('Error creating chart:', error);
        }
        
        // Resize chart to fit container
        setTimeout(() => {
            if (chart) {
                chart.resize();
            }
        }, 100);
    }

    // =============================================================================
    // METRIC TOGGLES CREATION
    // =============================================================================

    function createMetricToggles() {
        const togglesContainer = document.querySelector('.spend-categories-toggles');
        if (!togglesContainer) {
            console.error('Toggles container not found');
            return;
        }
        
        // Clear existing toggles
        togglesContainer.innerHTML = '';
        
        // Create select all / deselect all buttons
        const metricsHeader = document.querySelector('.spend-categories-metrics-title');
        if (metricsHeader && !document.querySelector('.select-all-container')) {
            const buttonsContainer = document.createElement('div');
            buttonsContainer.className = 'select-all-container';
            
            const selectAllBtn = document.createElement('button');
            selectAllBtn.textContent = 'Select All';
            selectAllBtn.className = 'select-all-btn';
            selectAllBtn.addEventListener('click', selectAllMetrics);
            
            const deselectAllBtn = document.createElement('button');
            deselectAllBtn.textContent = 'Deselect All';
            deselectAllBtn.className = 'deselect-all-btn';
            deselectAllBtn.addEventListener('click', deselectAllMetrics);
            
            buttonsContainer.appendChild(selectAllBtn);
            buttonsContainer.appendChild(deselectAllBtn);
            
            // Insert after the title
            metricsHeader.parentNode.insertBefore(buttonsContainer, togglesContainer);
        }
        
        CHART_CONFIG.metrics.forEach(metric => {
            const toggleDiv = document.createElement('div');
            toggleDiv.className = `metric-toggle ${metric.visible ? 'active' : ''}`;
            toggleDiv.innerHTML = `
                <input type="checkbox" class="metric-checkbox" id="metric-${metric.id}" ${metric.visible ? 'checked' : ''}>
                <label for="metric-${metric.id}" class="metric-label">
                    <span class="metric-color" style="background-color: ${metric.color}"></span>
                    ${metric.name}
                </label>
            `;
            
            toggleDiv.addEventListener('click', function(e) {
                const checkbox = toggleDiv.querySelector('.metric-checkbox');
                
                // If the clicked element is the checkbox itself, let it handle naturally
                if (e.target === checkbox) {
                    return;
                }
                
                // For any other click in the toggle div, click the checkbox
                e.preventDefault();
                e.stopPropagation();
                checkbox.click();
            });
            
            // Add separate listener for checkbox changes
            const checkbox = toggleDiv.querySelector('.metric-checkbox');
            checkbox.addEventListener('change', function() {
                toggleMetric(metric.id);
            });
            
            togglesContainer.appendChild(toggleDiv);
        });
    }

    // =============================================================================
    // CHART UPDATE AND CONTROLS
    // =============================================================================

    function updateChart() {
        if (!chart) return;
        
        if (!processedData || !processedData.labels) {
            console.warn('No processed data available for chart update');
            return;
        }
        
        const datasets = createDatasets();
        
        chart.data.labels = processedData.labels;
        chart.data.datasets = datasets;
        
        // Show/hide y-axis based on visible metrics
        const hasVisibleMetrics = CHART_CONFIG.metrics.some(m => m.visible);
        chart.options.scales.y.display = hasVisibleMetrics;
        
        chart.update('active');
        
        console.log('Chart updated with', processedData.labels.length, 'data points');
    }

    function createDatasets() {
        const datasets = [];
        
        CHART_CONFIG.metrics.forEach(metric => {
            if (!metric.visible) return;
            
            // Get data for this metric from processedData
            const metricData = processedData[metric.dataKey] || [];
            
            const dataset = {
                label: metric.name,
                data: metricData,
                borderColor: metric.color,
                backgroundColor: metric.backgroundColor,
                borderWidth: 2,
                type: metric.type,
                yAxisID: 'y',
                order: metric.order || 0,
                fill: false,
                tension: 0.1
            };
            
            datasets.push(dataset);
        });
        
        return datasets.sort((a, b) => (a.order || 0) - (b.order || 0));
    }

    // Toggle metric visibility
    function toggleMetric(metricId) {
        const metric = CHART_CONFIG.metrics.find(m => m.id === metricId);
        const toggleDiv = document.getElementById(`metric-${metricId}`).parentElement;
        const checkbox = document.getElementById(`metric-${metricId}`);
        
        metric.visible = checkbox.checked;
        
        if (metric.visible) {
            toggleDiv.classList.add('active');
        } else {
            toggleDiv.classList.remove('active');
        }
        
        updateChart();
    }

    // Select all metrics
    function selectAllMetrics() {
        CHART_CONFIG.metrics.forEach(metric => {
            metric.visible = true;
            const checkbox = document.getElementById(`metric-${metric.id}`);
            const toggleDiv = checkbox.parentElement;
            
            checkbox.checked = true;
            toggleDiv.classList.add('active');
        });
        
        updateChart();
    }

    // Deselect all metrics
    function deselectAllMetrics() {
        CHART_CONFIG.metrics.forEach(metric => {
            metric.visible = false;
            const checkbox = document.getElementById(`metric-${metric.id}`);
            const toggleDiv = checkbox.parentElement;
            
            checkbox.checked = false;
            toggleDiv.classList.remove('active');
        });
        
        updateChart();
    }

    // Switch time range
    function switchTimeRange(timeRange) {
        currentTimeRange = timeRange;
        
        // Update active button - scope to this chart's container only
        const controlButtons = document.querySelectorAll('.spend-categories-controls .control-btn');
        controlButtons.forEach(btn => {
            btn.classList.remove('active');
            // Add active class to the button that matches the timeRange
            if (btn.textContent.trim() === timeRange || 
                (timeRange === 'ALL' && btn.textContent.trim() === 'All')) {
                btn.classList.add('active');
            }
        });
        
        updateChart();
    }

    // Toggle zoom functionality
    function toggleZoom() {
        isZoomEnabled = !isZoomEnabled;
        
        const zoomBtn = event.target;
        if (isZoomEnabled) {
            zoomBtn.classList.add('active');
            zoomBtn.textContent = 'Zoom ON';
            
            if (chart.options.plugins.zoom) {
                chart.options.plugins.zoom.zoom.wheel.enabled = true;
                chart.options.plugins.zoom.zoom.pinch.enabled = true;
            }
        } else {
            zoomBtn.classList.remove('active');
            zoomBtn.textContent = 'Zoom';
            
            if (chart.options.plugins.zoom) {
                chart.options.plugins.zoom.zoom.wheel.enabled = false;
                chart.options.plugins.zoom.zoom.pinch.enabled = false;
            }
        }
        
        chart.update('none');
    }

    // Reset zoom
    function resetZoom() {
        if (chart && chart.resetZoom) {
            chart.resetZoom();
        }
        
        // Reset zoom button state - scope to this chart's container only
        const controlButtons = document.querySelectorAll('.spend-categories-controls .control-btn');
        controlButtons.forEach(btn => {
            if (btn.textContent.includes('Zoom')) {
                btn.classList.remove('active');
                btn.textContent = 'Zoom';
                isZoomEnabled = false;
                
                if (chart.options.plugins.zoom) {
                    chart.options.plugins.zoom.zoom.wheel.enabled = false;
                    chart.options.plugins.zoom.zoom.pinch.enabled = false;
                }
            }
        });
        
        if (chart) {
            chart.update('none');
        }
    }

    // =============================================================================
    // UTILITY FUNCTIONS
    // =============================================================================

    // Utility function to update chart with new data (for Mode Analytics integration)
    function updateChartData(newData) {
        if (newData) {
            rawData = newData;
            processData();
            updateChart();
        }
    }

    // =============================================================================
    // EXPORT FUNCTIONS FOR MODE ANALYTICS USAGE
    // =============================================================================

    window.SpendCategoriesChart = {
        loadData: loadModeData,
        updateData: updateChartData,
        switchTimeRange: switchTimeRange,
        toggleZoom: toggleZoom,
        resetZoom: resetZoom,
        toggleMetric: toggleMetric,
        selectAll: selectAllMetrics,
        deselectAll: deselectAllMetrics,
        getChart: () => chart,
        getConfig: () => CHART_CONFIG,
        getCurrentData: () => processedData,
        
        // Configuration helpers
        updateConfig: (newConfig) => {
            Object.assign(CHART_CONFIG, newConfig);
            if (chart) {
                chart.destroy();
                initializeChart();
                updateChart();
            }
        },
        
        setChartType: (newType) => {
            if (CHART_TYPES[newType]) {
                CHART_CONFIG.chartType = newType;
                if (chart) {
                    chart.destroy();
                    initializeChart();
                    updateChart();
                }
            }
        },
        
        debug: () => {
            console.log('=== SPEND CATEGORIES CHART DEBUG ===');
            console.log('Chart Config:', CHART_CONFIG);
            console.log('Chart exists:', !!chart);
            console.log('Canvas exists:', !!document.getElementById('spendCategoriesChart'));
            console.log('Datasets available:', typeof datasets !== 'undefined');
            
            if (typeof datasets !== 'undefined') {
                console.log('Datasets object:', datasets);
                console.log('Available dataset names:', Object.keys(datasets));
                console.log('Dataset count:', Object.keys(datasets).length);
                
                // Show each dataset structure
                Object.keys(datasets).forEach((name, index) => {
                    console.log(`Dataset ${index} "${name}":`, datasets[name]);
                    if (datasets[name] && datasets[name].length > 0) {
                        console.log(`First row of "${name}":`, datasets[name][0]);
                    } else if (datasets[name] && datasets[name].content && datasets[name].content.length > 0) {
                        console.log(`First row of "${name}" (content):`, datasets[name].content[0]);
                    }
                });
            }
            
            console.log('Raw data length:', rawData.length);
            if (rawData.length > 0) {
                console.log('First few raw data rows:', rawData.slice(0, 3));
            }
            console.log('Processed data:', processedData);
            console.log('Current time range:', currentTimeRange);
            console.log('Toggle container exists:', !!document.querySelector('.spend-categories-toggles'));
        },
        
        // Force reload data
        forceLoad: () => {
            console.log('=== FORCING DATA RELOAD ===');
            loadModeData();
        },
        
        // Search all datasets for spend categories data
        findSpendCategoriesData: () => {
            console.log('=== SEARCHING ALL DATASETS FOR SPEND CATEGORIES DATA ===');
            if (typeof datasets === 'undefined') {
                console.error('Datasets not available');
                return;
            }
            
            const expectedColumns = ['total', 'no_budget', 'overspend', 'spend_90_pct', 'spend_90_pct_less'];
            let foundDatasets = [];
            
            Object.keys(datasets).forEach((key, index) => {
                const dataset = datasets[key];
                if (dataset && dataset.content && Array.isArray(dataset.content) && dataset.content.length > 0) {
                    const availableColumns = Object.keys(dataset.content[0] || {});
                    const hasExpectedColumns = expectedColumns.filter(col => availableColumns.includes(col));
                    
                    if (hasExpectedColumns.length > 0) {
                        foundDatasets.push({
                            index,
                            queryName: dataset.queryName || 'unknown',
                            state: dataset.state || 'unknown',
                            rowCount: dataset.content.length,
                            matchingColumns: hasExpectedColumns,
                            allColumns: availableColumns,
                            firstRow: dataset.content[0]
                        });
                        
                        console.log(`🎯 Dataset ${index} contains spend categories data:`, {
                            queryName: dataset.queryName,
                            state: dataset.state,
                            rows: dataset.content.length,
                            matchingColumns: hasExpectedColumns,
                            firstRow: dataset.content[0]
                        });
                    }
                }
            });
            
            if (foundDatasets.length === 0) {
                console.warn('❌ No datasets found with spend categories columns');
                console.log('Expected columns:', expectedColumns);
            } else {
                console.log(`✅ Found ${foundDatasets.length} dataset(s) with spend categories data`);
                
                // Find the best match (most matching columns)
                const bestMatch = foundDatasets.sort((a, b) => b.matchingColumns.length - a.matchingColumns.length)[0];
                console.log(`🏆 Best match is dataset ${bestMatch.index} with ${bestMatch.matchingColumns.length}/${expectedColumns.length} matching columns`);
                
                return foundDatasets;
            }
        },
        
        // Test with specific dataset index
        testDataset: (index) => {
            console.log(`=== TESTING DATASET ${index} ===`);
            if (typeof datasets !== 'undefined' && datasets[index]) {
                const dataset = datasets[index];
                console.log('Test dataset structure:', dataset);
                console.log('Test dataset keys:', Object.keys(dataset));
                console.log('Test dataset.content:', dataset.content);
                console.log('Test dataset as array:', Array.isArray(dataset));
                console.log('Test dataset.length:', dataset.length);
                
                // Try multiple extraction methods
                let testData = [];
                if (dataset.content && Array.isArray(dataset.content)) {
                    testData = dataset.content;
                    console.log('✓ Using dataset.content (array)');
                } else if (Array.isArray(dataset)) {
                    testData = dataset;
                    console.log('✓ Using dataset directly (array)');
                } else if (dataset.rows && Array.isArray(dataset.rows)) {
                    testData = dataset.rows;
                    console.log('✓ Using dataset.rows (array)');
                } else if (dataset.data && Array.isArray(dataset.data)) {
                    testData = dataset.data;
                    console.log('✓ Using dataset.data (array)');
                } else {
                    console.warn('❌ Could not find array data in dataset');
                    console.log('Available properties:', Object.keys(dataset));
                    console.log('Full dataset structure:', JSON.stringify(dataset, null, 2));
                    return;
                }
                
                console.log('Test data length:', testData.length);
                if (testData.length > 0) {
                    console.log('Test data first row:', testData[0]);
                    console.log('Test data columns:', Object.keys(testData[0] || {}));
                } else {
                    console.warn('Test data is empty');
                }
                
                // Temporarily load this dataset
                rawData = testData;
                processData();
                updateChart();
            } else {
                console.error('Dataset not found at index:', index);
                if (typeof datasets !== 'undefined') {
                    console.log('Available datasets:', Object.keys(datasets));
                } else {
                    console.log('datasets object not available');
                }
            }
        }
    };

    console.log('Spend Categories Chart initialized successfully!');

})(); // End IIFE