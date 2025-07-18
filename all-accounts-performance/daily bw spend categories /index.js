// =============================================================================
// REUSABLE CHART SYSTEM FOR MODE ANALYTICS
// =============================================================================
// Supports: Line, Area, Grouped Bar, Stacked Bar, Stacked Bar + Line charts
// Features: Configurable metrics, trend lines, flexible SQL processing
// =============================================================================

// =============================================================================
// CONFIGURATION SECTION - MODIFY THIS FOR DIFFERENT CHARTS/QUERIES
// =============================================================================
//
// EXAMPLE 1: Budget vs Spend Chart (stacked bar + line)
// 
// const CHART_CONFIG = {
//     chartTitle: 'Budget vs Spend Performance',
//     chartType: 'stacked_bar_with_line',
//     modeDatasetName: 'Daily BW Budget vs Spend (channel filter does not apply)',
//     dataStructure: {
//         dateColumn: 'day',
//         groupByColumns: ['campaign_group_id'],
//         valueColumns: {
//             budget: { type: 'currency', column: 'budget', required: true },
//             spend: { type: 'currency', column: 'spend', required: true },
//             spend_pct: { type: 'percentage', column: 'spend pct', required: true }
//         }
//     },
//     processing: {
//         aggregation: { enabled: true, method: 'sum' },
//         filters: [
//             { column: 'budget', operator: '>', value: 0 },
//             { column: 'spend pct', operator: 'not_empty' }
//         ],
//         calculations: [
//             { 
//                 name: 'remaining_budget', 
//                 formula: 'budget - spend', 
//                 type: 'currency',
//                 applyMinZero: true 
//             }
//         ]
//     },
//     metrics: [
//         { id: 'spend', name: 'Spend', color: '#007bff', type: 'bar', dataKey: 'spend' },
//         { id: 'remaining_budget', name: 'Budget', color: '#28a745', type: 'bar', dataKey: 'remaining_budget' },
//         { id: 'spend_pct', name: 'Avg. Spend %', color: '#ffc107', type: 'line', dataKey: 'spend_pct' }
//     ]
// };
//
// EXAMPLE 2: Simple Line Chart
//
// const CHART_CONFIG = {
//     chartTitle: 'Campaign Performance Trends',
//     chartType: 'line',
//     modeDatasetName: 'Daily Campaign Metrics',
//     dataStructure: {
//         dateColumn: 'date',
//         groupByColumns: [],
//         valueColumns: {
//             impressions: { type: 'count', column: 'impressions', required: true },
//             clicks: { type: 'count', column: 'clicks', required: true },
//             ctr: { type: 'percentage', column: 'click_rate', required: true }
//         }
//     },
//     processing: {
//         aggregation: { enabled: false, method: 'sum' }
//     },
//     metrics: [
//         { id: 'impressions', name: 'Impressions', color: '#007bff', type: 'line', dataKey: 'impressions' },
//         { id: 'clicks', name: 'Clicks', color: '#28a745', type: 'line', dataKey: 'clicks' },
//         { id: 'ctr', name: 'CTR', color: '#ffc107', type: 'line', dataKey: 'ctr' }
//     ]
// };
//
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
        filters: [                            // Optional filters to apply to rows
            // Example filters (all optional):
            // { column: 'budget', operator: '>', value: 0 },
            // { column: 'spend_pct', operator: 'not_null' },
            // { column: 'spend_pct', operator: 'not_empty' }
        ],
        calculations: [                       // Optional derived calculations
            // Example calculations (all optional):
            // { 
            //     name: 'remaining_budget', 
            //     formula: 'budget - spend',
            //     type: 'currency',
            //     applyMinZero: true 
            // }
        ]
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
        enabled: false, // Set to true to add trend lines
        metrics: ['spend'], // Which metrics to add trend lines to
        color: '#ff6b6b',
        style: 'dashed' // 'solid' or 'dashed'
    },
    
    // Chart Styling
    styling: {
        height: 400,
        showLegend: false, // Use custom metric toggles instead
        gridColor: 'rgba(0, 0, 0, 0.1)',
        backgroundColor: '#ffffff'
    },
    
    // Y-Axis Configuration - Auto-configured based on data types
    yAxes: {
        primary: {
            id: 'y',
            position: 'left',
            title: 'Count', // Will be auto-determined from data types
            min: 0,
            formatter: (value) => value.toLocaleString() // Will be auto-determined from data types
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
// GLOBAL VARIABLES
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
            
            let targetDataset = null;
            let datasetName = null;
            
            // Try to find the configured dataset
            if (datasets[CHART_CONFIG.modeDatasetName]) {
                console.log('Found target query dataset:', CHART_CONFIG.modeDatasetName);
                targetDataset = datasets[CHART_CONFIG.modeDatasetName];
                datasetName = CHART_CONFIG.modeDatasetName;
            } else if (CHART_CONFIG.fallbackToFirstDataset && datasets[0]) {
                console.log('Fallback: Using datasets[0]');
                targetDataset = datasets[0];
                datasetName = 'datasets[0] (fallback)';
            }
            
            if (targetDataset) {
                console.log(`Using dataset: ${datasetName}`);
                rawData = targetDataset.content || targetDataset || [];
                console.log('Mode data loaded:', rawData.length, 'rows');
                
                processData();
                updateChart();
            } else {
                console.warn('No suitable dataset found');
                console.log('Available dataset names:', Object.keys(datasets));
            }
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
// FLEXIBLE DATA PROCESSING
// =============================================================================

function processData() {
    console.log('Processing data...');
    
    if (!rawData || rawData.length === 0) {
        console.warn('No data to process');
        return;
    }
    
    const { dataStructure, processing } = CHART_CONFIG;
    
    // Step 1: Apply filters if any
    let filteredData = rawData;
    if (processing.filters && processing.filters.length > 0) {
        filteredData = applyFilters(rawData, processing.filters);
        console.log(`Applied ${processing.filters.length} filters. Rows: ${rawData.length} -> ${filteredData.length}`);
    }
    
    // Step 2: Group and aggregate data by date
    const dailyData = {};
    
    try {
        filteredData.forEach((row, index) => {
            const date = row[dataStructure.dateColumn];
            
            // Skip rows with invalid dates
            if (!date) {
                return;
            }
            
            // Initialize date entry
            if (!dailyData[date]) {
                dailyData[date] = {};
                // Initialize all value columns
                Object.keys(dataStructure.valueColumns).forEach(metricKey => {
                    dailyData[date][metricKey] = [];
                });
            }
            
            // Collect values for aggregation
            Object.keys(dataStructure.valueColumns).forEach(metricKey => {
                const columnDef = dataStructure.valueColumns[metricKey];
                const value = extractValue(row[columnDef.column], columnDef.type);
                
                if (value !== null && value !== undefined) {
                    dailyData[date][metricKey].push(value);
                }
            });
        });
        
    } catch (error) {
        console.error('Error processing raw data:', error);
        return;
    }
    
    // Step 3: Aggregate values by date using the specified method
    const aggregationMethod = processing.aggregation?.method || 'sum';
    const aggregationEnabled = processing.aggregation?.enabled !== false;
    
    Object.keys(dailyData).forEach(date => {
        Object.keys(dataStructure.valueColumns).forEach(metricKey => {
            const values = dailyData[date][metricKey];
            if (aggregationEnabled && values.length > 0) {
                dailyData[date][metricKey] = aggregateValues(values, aggregationMethod);
            } else if (values.length > 0) {
                dailyData[date][metricKey] = values[0]; // Take first value if no aggregation
            } else {
                dailyData[date][metricKey] = 0;
            }
        });
    });
    
    // Step 4: Apply calculations if any
    if (processing.calculations && processing.calculations.length > 0) {
        applyCalculations(dailyData, processing.calculations);
    }
    
    // Step 5: Convert to arrays sorted by date
    const sortedDays = Object.keys(dailyData).sort();
    
    processedData = {
        labels: sortedDays
    };
    
    // Add each metric's data
    Object.keys(dataStructure.valueColumns).forEach(metricKey => {
        processedData[metricKey] = sortedDays.map(day => dailyData[day][metricKey]);
    });
    
    // Add calculated metrics if any
    if (processing.calculations) {
        processing.calculations.forEach(calc => {
            processedData[calc.name] = sortedDays.map(day => dailyData[day][calc.name] || 0);
        });
    }
    
    console.log('Data processed:', processedData.labels.length, 'days');
    console.log('Available metrics:', Object.keys(dataStructure.valueColumns));
}

// =============================================================================
// GENERIC DATA PROCESSING HELPER FUNCTIONS
// =============================================================================

function applyFilters(data, filters) {
    return data.filter(row => {
        return filters.every(filter => {
            const value = row[filter.column];
            
            switch (filter.operator) {
                case '>':
                    return parseFloat(value) > filter.value;
                case '<':
                    return parseFloat(value) < filter.value;
                case '>=':
                    return parseFloat(value) >= filter.value;
                case '<=':
                    return parseFloat(value) <= filter.value;
                case '==':
                    return value == filter.value;
                case '!=':
                    return value != filter.value;
                case 'not_null':
                    return value != null && value != undefined;
                case 'not_empty':
                    return value != null && value != undefined && value !== '';
                case 'is_null':
                    return value == null || value == undefined;
                default:
                    console.warn(`Unknown filter operator: ${filter.operator}`);
                    return true;
            }
        });
    });
}

function extractValue(rawValue, dataType) {
    if (rawValue == null || rawValue === '') {
        return null;
    }
    
    switch (dataType) {
        case 'count':
        case 'integer':
            return parseInt(rawValue) || 0;
        case 'currency':
        case 'decimal':
        case 'percentage':
            return parseFloat(rawValue) || 0;
        default:
            return rawValue;
    }
}

function aggregateValues(values, method) {
    if (values.length === 0) return 0;
    
    switch (method) {
        case 'sum':
            return values.reduce((sum, val) => sum + val, 0);
        case 'avg':
        case 'average':
            return values.reduce((sum, val) => sum + val, 0) / values.length;
        case 'max':
            return Math.max(...values);
        case 'min':
            return Math.min(...values);
        case 'count':
            return values.length;
        default:
            console.warn(`Unknown aggregation method: ${method}`);
            return values.reduce((sum, val) => sum + val, 0);
    }
}

function applyCalculations(dailyData, calculations) {
    Object.keys(dailyData).forEach(date => {
        calculations.forEach(calc => {
            try {
                // Simple formula parser - supports basic arithmetic with column names
                let formula = calc.formula;
                
                // Replace column names with actual values
                Object.keys(dailyData[date]).forEach(column => {
                    const regex = new RegExp(`\\b${column}\\b`, 'g');
                    formula = formula.replace(regex, dailyData[date][column]);
                });
                
                // Evaluate the formula (basic arithmetic only)
                let result = Function(`"use strict"; return (${formula})`)();
                
                // Apply minimum zero if specified
                if (calc.applyMinZero && result < 0) {
                    result = 0;
                }
                
                dailyData[date][calc.name] = result;
                
            } catch (error) {
                console.error(`Error calculating ${calc.name} for ${date}:`, error);
                dailyData[date][calc.name] = 0;
            }
        });
    });
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
        console.error('Canvas element not found!');
        return;
    }
    
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
    
    const chartTypeConfig = CHART_TYPES[CHART_CONFIG.chartType];
    
    // Chart configuration
    const config = {
        type: chartTypeConfig.baseType,
        data: {
            labels: [],
            datasets: []
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    display: CHART_CONFIG.styling.showLegend
                },
                tooltip: createTooltipConfig(),
                ...(typeof ChartZoom !== 'undefined' ? {
                    zoom: {
                        pan: {
                            enabled: true,
                            mode: 'x',
                            modifierKey: 'ctrl'
                        },
                        zoom: {
                            wheel: { enabled: false },
                            pinch: { enabled: false },
                            mode: 'x'
                        }
                    }
                } : {})
            },
            scales: createScalesConfig(),
            animation: {
                duration: 750,
                easing: 'easeInOutQuart'
            }
        }
    };
    
    // Create the chart
    try {
        chart = new Chart(ctx, config);
        console.log('Chart created successfully');
    } catch (error) {
        console.error('Error creating chart:', error);
        return;
    }
    
    // Add resize listener
    window.addEventListener('resize', function() {
        if (chart) {
            chart.resize();
        }
    });
}

function createTooltipConfig() {
    return {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#007bff',
        borderWidth: 1,
        cornerRadius: 6,
        displayColors: true,
        callbacks: {
            title: function(tooltipItems) {
                return new Date(tooltipItems[0].label).toLocaleDateString();
            },
            label: function(context) {
                const value = context.parsed.y;
                const metricName = context.dataset.label;
                
                // Find the data type for this metric
                const metric = CHART_CONFIG.metrics.find(m => m.name === metricName);
                const dataType = metric ? getMetricDataType(metric.dataKey) : 'count';
                
                return `${metricName}: ${formatValueByType(value, dataType)}`;
            }
        }
    };
}

function getMetricDataType(dataKey) {
    const valueColumn = CHART_CONFIG.dataStructure.valueColumns[dataKey];
    return valueColumn ? valueColumn.type : 'count';
}

function formatValueByType(value, dataType) {
    switch (dataType) {
        case 'currency':
            return '$' + value.toLocaleString();
        case 'percentage':
            return (value * 100).toFixed(1) + '%';
        case 'decimal':
            return value.toFixed(2);
        case 'count':
        case 'integer':
        default:
            return value.toLocaleString();
    }
}

function createScalesConfig() {
    const scales = {
        x: {
            type: 'time',
            time: {
                unit: 'day',
                tooltipFormat: 'MMM dd, yyyy',
                displayFormats: {
                    day: 'MMM dd'
                }
            },
            title: {
                display: true,
                text: 'Date'
            },
            grid: {
                color: CHART_CONFIG.styling.gridColor
            },
            ticks: {
                maxRotation: 45,
                minRotation: 45
            }
        }
    };
    
    // Auto-configure y-axes based on data types
    const dataTypes = getUsedDataTypes();
    
    // Primary axis (left side)
    const primaryDataType = dataTypes.primary || 'count';
    scales.y = {
        type: 'linear',
        display: true,
        position: 'left',
        min: 0,
        title: {
            display: true,
            text: getAxisTitle(primaryDataType)
        },
        grid: {
            color: CHART_CONFIG.styling.gridColor
        },
        ticks: {
            callback: getAxisFormatter(primaryDataType)
        }
    };
    
    // Secondary axis (right side) - only if we have percentage data
    if (dataTypes.hasPercentage) {
        scales.y1 = {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
                display: true,
                text: 'Percentage'
            },
            grid: {
                drawOnChartArea: false,
            },
            ticks: {
                callback: function(value) {
                    return (value * 100).toFixed(1) + '%';
                }
            },
            afterDataLimits: function(scale) {
                // Auto-scale for percentage data
                const datasets = scale.chart.data.datasets;
                const percentageDatasets = datasets.filter(d => d.yAxisID === 'y1');
                
                if (percentageDatasets.length > 0) {
                    const allValues = percentageDatasets.flatMap(d => d.data.filter(v => v != null && !isNaN(v)));
                    if (allValues.length > 0) {
                        const min = Math.min(...allValues);
                        const max = Math.max(...allValues);
                        const range = max - min;
                        const padding = range * 0.05;
                        
                        scale.min = Math.max(0, min - padding);
                        scale.max = Math.min(1, max + padding);
                    }
                }
            }
        };
    }
    
    return scales;
}

function getUsedDataTypes() {
    const types = {
        primary: null,
        hasPercentage: false,
        hasCurrency: false
    };
    
    // Check what data types are used in visible metrics
    const visibleMetrics = CHART_CONFIG.metrics.filter(m => m.visible);
    
    visibleMetrics.forEach(metric => {
        const dataType = getMetricDataType(metric.dataKey);
        
        if (dataType === 'percentage') {
            types.hasPercentage = true;
        } else if (dataType === 'currency') {
            types.hasCurrency = true;
            if (!types.primary) types.primary = 'currency';
        } else if (dataType === 'count' || dataType === 'integer') {
            if (!types.primary) types.primary = 'count';
        }
    });
    
    return types;
}

function getAxisTitle(dataType) {
    switch (dataType) {
        case 'currency':
            return 'Amount ($)';
        case 'count':
        case 'integer':
            return 'Count';
        case 'decimal':
            return 'Value';
        default:
            return 'Value';
    }
}

function getAxisFormatter(dataType) {
    switch (dataType) {
        case 'currency':
            return function(value) {
                return '$' + value.toLocaleString();
            };
        case 'count':
        case 'integer':
        default:
            return function(value) {
                return value.toLocaleString();
            };
    }
}

// =============================================================================
// DYNAMIC DATASET CREATION
// =============================================================================

function createChartDatasets() {
    const filteredData = getFilteredData();
    const chartTypeConfig = CHART_TYPES[CHART_CONFIG.chartType];
    const datasets = [];
    
    CHART_CONFIG.metrics.forEach(metric => {
        if (!metric.visible) return;
        
        const data = filteredData[metric.dataKey] || [];
        
        // Determine metric type based on chart type
        let metricType = metric.type;
        if (!chartTypeConfig.allowMixedTypes) {
            metricType = chartTypeConfig.defaultMetricType;
        }
        
        // Auto-assign y-axis based on data type
        const dataType = getMetricDataType(metric.dataKey);
        const yAxisID = dataType === 'percentage' ? 'y1' : 'y';
        
        const dataset = {
            label: metric.name,
            data: data,
            borderColor: metric.color,
            backgroundColor: metric.backgroundColor,
            borderWidth: 2,
            type: metricType,
            yAxisID: yAxisID,
            order: metric.order,
            hidden: !metric.visible
        };
        
        // Configure based on metric type
        if (metricType === 'bar') {
            if (chartTypeConfig.stackBars) {
                dataset.stack = 'Stack 0';
            }
            dataset.borderWidth = 1;
        } else if (metricType === 'line') {
            dataset.fill = chartTypeConfig.fillArea;
            dataset.tension = 0.1;
            dataset.pointRadius = 3;
            dataset.pointHoverRadius = 6;
            dataset.pointHoverBackgroundColor = metric.color;
            dataset.pointHoverBorderColor = '#ffffff';
            dataset.pointHoverBorderWidth = 2;
        }
        
        datasets.push(dataset);
    });
    
    // Add trend lines if enabled
    if (CHART_CONFIG.trendLines.enabled) {
        datasets.push(...createTrendLineDatasets(filteredData));
    }
    
    return datasets;
}

function createTrendLineDatasets(filteredData) {
    const trendDatasets = [];
    
    CHART_CONFIG.trendLines.metrics.forEach(metricId => {
        const metric = CHART_CONFIG.metrics.find(m => m.id === metricId);
        if (!metric || !metric.visible) return;
        
        const data = filteredData[metric.dataKey] || [];
        const trendData = calculateTrendLine(data);
        
        trendDatasets.push({
            label: `${metric.name} Trend`,
            data: trendData,
            borderColor: CHART_CONFIG.trendLines.color,
            backgroundColor: 'transparent',
            borderWidth: 2,
            borderDash: CHART_CONFIG.trendLines.style === 'dashed' ? [5, 5] : [],
            type: 'line',
            yAxisID: metric.yAxisID,
            order: -1, // Show on top
            pointRadius: 0,
            tension: 0
        });
    });
    
    return trendDatasets;
}

function calculateTrendLine(data) {
    if (data.length < 2) return data;
    
    // Simple linear regression
    const n = data.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    
    data.forEach((value, index) => {
        sumX += index;
        sumY += value;
        sumXY += index * value;
        sumXX += index * index;
    });
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    return data.map((_, index) => slope * index + intercept);
}

// =============================================================================
// TIME RANGE FILTERING
// =============================================================================

function getFilteredData() {
    if (!processedData.labels) return processedData;
    
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
            return processedData;
    }
    
    // Take the last N days of available data
    const startIndex = Math.max(0, processedData.labels.length - daysToShow);
    
    const filtered = {
        labels: processedData.labels.slice(startIndex)
    };
    
    // Filter all data keys
    Object.keys(processedData).forEach(key => {
        if (key !== 'labels' && Array.isArray(processedData[key])) {
            filtered[key] = processedData[key].slice(startIndex);
        }
    });
    
    return filtered;
}

// =============================================================================
// CHART UPDATE AND CONTROLS
// =============================================================================

function updateChart() {
    if (!chart) return;
    
    const filteredData = getFilteredData();
    const datasets = createChartDatasets();
    
    chart.data.labels = filteredData.labels;
    chart.data.datasets = datasets;
    
    // Update y-axis visibility based on active metrics
    const hasVisibleMetrics = CHART_CONFIG.metrics.filter(m => m.visible).length > 0;
    chart.options.scales.y.display = hasVisibleMetrics;
    
    chart.update('active');
}

// =============================================================================
// METRIC TOGGLES
// =============================================================================

function createMetricToggles() {
    const togglesContainer = document.querySelector('.spend-categories-toggles');
    const metricsContainer = document.querySelector('.spend-categories-metrics');
    
    if (!togglesContainer) {
        return;
    }
    
    togglesContainer.innerHTML = '';
    
    // Add select/deselect all buttons
    const metricsHeader = document.querySelector('.spend-categories-metrics-title');
    if (metricsHeader && !document.getElementById('select-all-btn')) {
        const selectAllBtn = document.createElement('button');
        selectAllBtn.id = 'select-all-btn';
        selectAllBtn.className = 'select-all-btn';
        selectAllBtn.textContent = 'Select All';
        selectAllBtn.onclick = selectAllMetrics;
        
        const deselectAllBtn = document.createElement('button');
        deselectAllBtn.id = 'deselect-all-btn';
        deselectAllBtn.className = 'deselect-all-btn';
        deselectAllBtn.textContent = 'Deselect All';
        deselectAllBtn.onclick = deselectAllMetrics;
        
        // Create buttons container
        const buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'metrics-buttons-container';
        buttonsContainer.style.marginBottom = '15px';
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
    
    // Update active button
    document.querySelectorAll('.control-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
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
    
    // Reset zoom button state
    const zoomBtn = document.querySelector('.control-btn');
    if (zoomBtn && zoomBtn.textContent.includes('Zoom')) {
        zoomBtn.classList.remove('active');
        zoomBtn.textContent = 'Zoom';
        isZoomEnabled = false;
        
        if (chart.options.plugins.zoom) {
            chart.options.plugins.zoom.zoom.wheel.enabled = false;
            chart.options.plugins.zoom.zoom.pinch.enabled = false;
        }
        
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

// Export functions for Mode Analytics usage
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
        console.log('=== REUSABLE CHART DEBUG ===');
        console.log('Chart Config:', CHART_CONFIG);
        console.log('Chart exists:', !!chart);
        console.log('Raw data length:', rawData.length);
        console.log('Processed data:', processedData);
        console.log('Current time range:', currentTimeRange);
    }
};

console.log('Reusable Chart System initialized successfully!');