// =============================================================================
// Budget vs Spend Performance Chart (Using Shared Library)
// =============================================================================

(function() {
    'use strict';

    // Access shared library
    const lib = window.ChartLibrary;

    // =============================================================================
    // CHART-SPECIFIC CONFIGURATION
    // =============================================================================

    const CONFIG = {
        chartTitle: 'Daily BW Budget V. Spend / Spend Pct',
        datasetName: 'Daily BW Budget vs Spend (channel filter does not apply)',
        fallbackIndex: 0,
        defaultTimeRange: '90D',
        displayMetrics: ['spend', 'budget', 'spend_pct'],
        
        // UI selectors specific to this chart
        canvasId: 'budgetSpendChart',
        togglesSelector: '.budget-spend-toggles',
        metricsHeaderSelector: '.budget-spend-metrics-title',
        controlsSelector: '.budget-spend-controls',
        selectAllBtnId: 'budget-spend-select-all-btn',
        deselectAllBtnId: 'budget-spend-deselect-all-btn',
        
        // HTML Generator config
        htmlConfig: {
            containerClass: 'budget-spend-container.usesCustomDatePicker',
            headerClass: 'budget-spend-header',
            titleClass: 'budget-spend-title',
            chartTitle: 'Daily BW Budget V. Spend / Spend Pct',
            controlsClass: 'budget-spend-controls',
            chartObject: 'BudgetSpendChart',
            canvasClass: 'budget-spend-canvas',
            canvasId: 'budgetSpendChart',
            metricsClass: 'budget-spend-metrics',
            metricsHeaderClass: 'budget-spend-metrics-title',
            togglesClass: 'budget-spend-toggles',
            useModeDate: true // Use custom date picker instead of time range buttons
        },
        
        getMetrics: function() {
            return lib.getMetricsFromDataset(CONFIG.datasetName, CONFIG.fallbackIndex);
        }
    };

    // State
    let chart;
    let rawData = [];
    let processedData = {};
    let currentDateRange = { startDate: null, endDate: null }; // Using Mode date picker instead of time range
    let isZoomEnabled = { value: false }; // Using object for reference
    let dynamicMetrics = [];
    let columnMapping = {};
    let modeDatePicker = null;

    // =============================================================================
    // HTML GENERATION
    // =============================================================================

    function generateHTML() {
        console.log('Budget vs Spend: Checking if HTML needs to be generated...');
        
        // Check if the chart container already exists and has content
        const existingContainer = document.querySelector(`.${CONFIG.htmlConfig.containerClass}`);
        
        if (existingContainer) {
            // Check if it already has content (canvas element means it's populated)
            const hasContent = existingContainer.querySelector(`#${CONFIG.canvasId}`);
            
            if (hasContent) {
                console.log('Budget vs Spend: HTML container already exists with content, skipping generation');
                return true;
            } else {
                console.log('Budget vs Spend: Empty container found, populating with content...');
            }
        } else {
            console.log('Budget vs Spend: No container found, will create full HTML...');
        }
        
        // Try to inject into existing container first, fallback to full injection
        const success = lib.injectChartSmart(CONFIG.htmlConfig, 'body');
        
        if (success) {
            console.log('Budget vs Spend: HTML generated successfully!');
            
            // Add basic styling for generated chart
            const style = document.createElement('style');
            style.textContent = `
                .budget-spend-container {
                    margin: 20px 0;
                    padding: 20px;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    background: white;
                }
                .budget-spend-header {
                    margin-bottom: 20px;
                }
                .budget-spend-controls .control-btn {
                    background: #007bff;
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    margin: 0 5px 5px 0;
                    border-radius: 4px;
                    cursor: pointer;
                }
                .budget-spend-controls .control-btn:hover {
                    background: #0056b3;
                }
                .budget-spend-controls .control-btn.active {
                    background: #28a745;
                }
                #budgetSpendChart {
                    max-height: 500px;
                }
            `;
            document.head.appendChild(style);
            
            return true;
        } else {
            console.error('Budget vs Spend: Failed to generate HTML');
            return false;
        }
    }

    // =============================================================================
    // CHART-SPECIFIC METRIC DEFINITIONS
    // =============================================================================

    function createDynamicMetrics(availableMetrics) {
        console.log('Budget vs Spend: Creating dynamic metrics from available:', availableMetrics);
        console.log('Budget vs Spend: Looking for displayMetrics:', CONFIG.displayMetrics);
        
        // Create mapping of internal names to actual column names
        columnMapping = {};
        CONFIG.displayMetrics.forEach(metric => {
            if (availableMetrics.includes(metric)) {
                columnMapping[metric] = metric;
            } else if (availableMetrics.includes(metric.replace('_', ' '))) {
                columnMapping[metric] = metric.replace('_', ' ');
            } else if (metric === 'spend_pct' && availableMetrics.includes('spend pct')) {
                columnMapping[metric] = 'spend pct';
            }
        });
        
        console.log('Budget vs Spend: Column mapping:', columnMapping);
        
        const filteredMetrics = Object.keys(columnMapping);
        console.log('Budget vs Spend: Filtered metrics:', filteredMetrics);

        dynamicMetrics = filteredMetrics.map(metric => {
            let config;
            
            switch(metric) {
                case 'spend':
                    config = {
                        id: 'spend',
                        name: 'Spend',
                        color: '#007bff',
                        backgroundColor: 'rgba(0, 123, 255, 0.8)',
                        visible: true,
                        type: 'bar',
                        yAxisID: 'y',
                        order: 1
                    };
                    break;
                case 'budget':
                    config = {
                        id: 'budget',
                        name: 'Budget',
                        color: '#28a745',
                        backgroundColor: 'rgba(40, 167, 69, 0.8)',
                        visible: true,
                        type: 'bar',
                        yAxisID: 'y',
                        order: 2
                    };
                    break;
                case 'spend_pct':
                    config = {
                        id: 'spend_pct',
                        name: 'Avg. Spend %',
                        color: '#ffc107',
                        backgroundColor: 'rgba(255, 193, 7, 0.1)',
                        visible: true,
                        type: 'line',
                        yAxisID: 'y1',
                        order: 0
                    };
                    break;
                default:
                    config = {
                        id: metric,
                        name: metric.replace(/_/g, ' '),
                        color: '#6B7280',
                        backgroundColor: 'rgba(107, 114, 128, 0.8)',
                        visible: true,
                        type: 'bar',
                        yAxisID: 'y',
                        order: 3
                    };
            }
            
            return config;
        });
    }

    // =============================================================================
    // CHART-SPECIFIC DATA PROCESSING
    // =============================================================================

    function processData() {
        if (!rawData || !rawData.length) {
            processedData = { labels: [], budget: [], spend: [], spend_pct: [] };
            return;
        }

        const dayColumn = lib.findDateColumn(rawData);
        if (!dayColumn) {
            console.error('Budget vs Spend: No day column found');
            return;
        }

        // Group data by day and aggregate
        const dailyData = {};
        
        rawData.forEach(row => {
            const budget = parseFloat(row[columnMapping.budget] || 0);
            const spend = parseFloat(row[columnMapping.spend] || 0);
            
            // Get the original spend_pct from the SQL for rows that have it
            let spend_pct = parseFloat(row[columnMapping.spend_pct] || 0);
            const hasValidSpendPct = !isNaN(spend_pct) && row[columnMapping.spend_pct] !== "" && row[columnMapping.spend_pct] != null;
            
            // Include any row that has meaningful budget OR spend data
            if (budget <= 0 && spend <= 0) {
                return; // Skip only truly empty rows
            }
            
            const normalizedDay = lib.normalizeDate(row[dayColumn]);
            if (!dailyData[normalizedDay]) {
                dailyData[normalizedDay] = {
                    budget: 0,
                    spend: 0,
                    spend_pct_sum: 0,
                    count: 0
                };
            }
            
            // For spend and budget, include all valid data
            if (budget > 0) {
                dailyData[normalizedDay].budget += budget;
            }
            dailyData[normalizedDay].spend += spend;
            
            // For spend_pct averaging, only include rows with valid percentages
            if (hasValidSpendPct) {
                dailyData[normalizedDay].spend_pct_sum += spend_pct;
                dailyData[normalizedDay].count += 1;
            }
        });

        // Convert to arrays sorted by date
        const sortedDays = Object.keys(dailyData).sort();
        
        processedData = {
            labels: sortedDays,
            budget: sortedDays.map(day => Math.max(0, dailyData[day].budget - dailyData[day].spend)), // Remaining budget
            spend: sortedDays.map(day => dailyData[day].spend),
            spend_pct: sortedDays.map(day => {
                // Use averaging method but only include valid percentages
                return dailyData[day].count > 0 ? dailyData[day].spend_pct_sum / dailyData[day].count : 0;
            })
        };
    }

    // =============================================================================
    // CHART-SPECIFIC CHART.JS CONFIGURATION
    // =============================================================================

    function createChart() {
        const canvas = document.getElementById(CONFIG.canvasId);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        // Register plugins using shared library
        lib.registerStandardPlugins();

        chart = new Chart(ctx, {
            type: 'bar',
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
                    title: {
                        display: true,
                        text: CONFIG.chartTitle
                    },
                    legend: {
                        display: false
                    },
                    tooltip: {
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
                                if (context.dataset.label === 'Avg. Spend %') {
                                    return `${context.dataset.label}: ${value.toFixed(3)}`;
                                } else if (context.dataset.label === 'Budget') {
                                    const dataIndex = context.dataIndex;
                                    const spendValue = context.chart.data.datasets.find(d => d.label === 'Spend').data[dataIndex];
                                    const totalBudget = value + spendValue;
                                    return `Total Budget: $${totalBudget.toLocaleString()} (Remaining: $${value.toLocaleString()})`;
                                } else {
                                    return `${context.dataset.label}: $${value.toLocaleString()}`;
                                }
                            }
                        }
                    },
                    zoom: lib.getStandardZoomConfig()
                },
                scales: {
                    x: Object.assign(lib.getStandardTimeScale('Date'), {
                        adapters: {
                            date: {}
                        }
                    }),
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        min: 0,
                        title: {
                            display: true,
                            text: 'Budget / Spend ($)'
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        },
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toLocaleString();
                            }
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Spend Rate (Decimal)'
                        },
                        grid: {
                            drawOnChartArea: false,
                        },
                        ticks: {
                            callback: function(value) {
                                return value.toFixed(2);
                            }
                        },
                        afterDataLimits: function(scale) {
                            // Only proceed if we have actual data
                            const chart = scale.chart;
                            const datasets = chart.data.datasets;
                            const spendPctDataset = datasets.find(d => d.label === 'Avg. Spend %');
                            
                            if (!spendPctDataset || !spendPctDataset.data || spendPctDataset.data.length === 0) {
                                return; // Let Chart.js use default scaling
                            }
                            
                            // Get the actual spend percentage data range
                            const spendPctValues = spendPctDataset.data.filter(v => v != null && !isNaN(v) && v > 0);
                            
                            if (spendPctValues.length === 0) {
                                return; // No valid data
                            }
                            
                            const dataMin = Math.min(...spendPctValues);
                            const dataMax = Math.max(...spendPctValues);
                            
                            // Calculate appropriate range with padding
                            const range = dataMax - dataMin;
                            const padding = Math.max(0.05, range * 0.1); // At least 5% padding
                            
                            // Calculate min/max with smart bounds
                            let calculatedMin = Math.max(0, dataMin - padding);
                            let calculatedMax = dataMax + padding;
                            
                            // Ensure we have reasonable bounds for budget/spend charts
                            calculatedMin = Math.min(calculatedMin, 0.65); // Don't start higher than 0.65
                            calculatedMax = Math.max(calculatedMax, 1.0);   // Always show at least to 1.0
                            
                            // Round to nice increments
                            calculatedMin = Math.floor(calculatedMin * 20) / 20; // Round to 0.05 increments
                            calculatedMax = Math.ceil(calculatedMax * 20) / 20;   // Round to 0.05 increments
                            
                            // Set the scale
                            scale.min = calculatedMin;
                            scale.max = calculatedMax;
                            
                            // Also ensure the options are set
                            scale.options.min = calculatedMin;
                            scale.options.max = calculatedMax;
                            scale.options.ticks.stepSize = 0.05;
                        }
                    }
                },
                animation: {
                    duration: 750,
                    easing: 'easeInOutQuart'
                }
            }
        });
    }

    // =============================================================================
    // CHART-SPECIFIC DATASET CREATION
    // =============================================================================

    function filterByDateRange() {
        // Use Mode date picker for filtering, fallback to last 30 days if no range set
        if (currentDateRange.startDate && currentDateRange.endDate) {
            console.log('Budget vs Spend: Using Mode date picker range:', currentDateRange);
            return lib.filterDataByDateRange(processedData, currentDateRange.startDate, currentDateRange.endDate, 'Budget vs Spend');
        } else {
            console.log('Budget vs Spend: No date range set, using last 30 days as default');
            // Default to last 30 days if no date range is set
            const today = new Date();
            const thirtyDaysAgo = new Date(today);
            thirtyDaysAgo.setDate(today.getDate() - 30);
            
            const defaultStart = thirtyDaysAgo.toISOString().split('T')[0];
            const defaultEnd = today.toISOString().split('T')[0];
            
            return lib.filterDataByDateRange(processedData, defaultStart, defaultEnd, 'Budget vs Spend');
        }
    }

    function createDatasets() {
        const filteredData = filterByDateRange();
        
        return dynamicMetrics.map(metric => {
            const data = filteredData[metric.id] || [];
            
            const dataset = {
                label: metric.name,
                data: data,
                borderColor: metric.color,
                backgroundColor: metric.backgroundColor,
                borderWidth: 2,
                type: metric.type,
                yAxisID: metric.yAxisID,
                order: metric.order,
                hidden: !metric.visible
            };
            
            // Specific settings for bar charts
            if (metric.type === 'bar') {
                dataset.stack = 'Stack 0';
                dataset.borderWidth = 1;
            }
            
            // Specific settings for line charts
            if (metric.type === 'line') {
                dataset.fill = false;
                dataset.tension = 0.1;
                dataset.pointRadius = 3;
                dataset.pointHoverRadius = 6;
                dataset.pointHoverBackgroundColor = metric.color;
                dataset.pointHoverBorderColor = '#ffffff';
                dataset.pointHoverBorderWidth = 2;
            }
            
            return dataset;
        });
    }

    function updateChart() {
        if (!chart || !processedData.labels) return;

        const datasets = createDatasets();
        const filteredData = filterByDateRange();

        chart.data.labels = filteredData.labels;
        chart.data.datasets = datasets;
        
        // Update y-axis visibility based on active metrics
        const hasBarMetrics = dynamicMetrics.filter(m => m.type === 'bar' && m.visible).length > 0;
        const hasLineMetrics = dynamicMetrics.filter(m => m.type === 'line' && m.visible).length > 0;
        
        chart.options.scales.y.display = hasBarMetrics;
        chart.options.scales.y1.display = hasLineMetrics;
        
        chart.update('active');
    }

    // =============================================================================
    // DATA LOADING USING SHARED LIBRARY
    // =============================================================================

    function loadData() {
        try {
            console.log('Budget vs Spend: Loading data...');
            const extractedMetrics = CONFIG.getMetrics();
            console.log('Budget vs Spend: Extracted metrics:', extractedMetrics);

            if (extractedMetrics.length > 0) {
                createDynamicMetrics(extractedMetrics);
                console.log('Budget vs Spend: Dynamic metrics created:', dynamicMetrics);
                rawData = lib.loadDatasetContent(CONFIG, 'Budget vs Spend');
                console.log('Budget vs Spend: Raw data loaded:', rawData.length, 'rows');
                if (rawData.length > 0) {
                    console.log('Budget vs Spend: First row sample:', rawData[0]);
                    console.log('Budget vs Spend: Available columns:', Object.keys(rawData[0]));
                }
                createMetricToggles();
                processData();
                console.log('Budget vs Spend: Processed data:', processedData);
                setupDatePicker();
                updateChart();
            } else {
                console.warn('Budget vs Spend: No metrics extracted from dataset');
                console.log('Budget vs Spend: Available datasets:', typeof datasets !== 'undefined' ? Object.keys(datasets) : 'datasets undefined');
            }
        } catch (error) {
            console.error('Budget vs Spend: Error loading data:', error);
        }
    }

    // =============================================================================
    // UI CONTROLS USING SHARED LIBRARY
    // =============================================================================

    let toggleMetric;

    function createMetricToggles() {
        // Create metric toggles using shared library
        const config = Object.assign({}, CONFIG, {
            updateChart: updateChart
        });
        
        // Create toggle function using shared library
        toggleMetric = lib.createStandardToggleMetric(dynamicMetrics, updateChart, config);
        lib.createStandardMetricToggles(config, dynamicMetrics, toggleMetric);
    }

        // =============================================================================
    // MODE DATE PICKER INTEGRATION
    // =============================================================================

    function onDateRangeChange(dateRange) {
        console.log('Budget vs Spend: Date range changed to:', dateRange);
        currentDateRange = dateRange;
        updateChart();
    }

    function setupDatePicker() {
        console.log('Budget vs Spend: Setting up custom date picker integration...');
        
        try {
            // Register with the global custom date picker
            modeDatePicker = lib.registerWithCustomDatePicker('Budget vs Spend', onDateRangeChange, 30);
            
            // Get the current date range from the picker (will be default 30 days initially)
            const initialRange = modeDatePicker.getCurrentDateRange();
            if (initialRange.startDate && initialRange.endDate) {
                currentDateRange = initialRange;
                console.log('Budget vs Spend: Using custom date picker range:', currentDateRange);
            } else {
                console.log('Budget vs Spend: Custom date picker not ready, using default 30-day range');
            }
        } catch (error) {
            console.log('Budget vs Spend: Custom date picker setup failed, using default 30-day range:', error.message);
        }
    }
    
    function toggleZoom() {
        isZoomEnabled.value = !isZoomEnabled.value;

        const btn = event.target;
        btn.classList.toggle('active', isZoomEnabled.value);
        btn.textContent = isZoomEnabled.value ? 'Zoom ON' : 'Zoom';

        if (chart && chart.options.plugins.zoom) {
            chart.options.plugins.zoom.zoom.wheel.enabled = isZoomEnabled.value;
            chart.options.plugins.zoom.zoom.pinch.enabled = isZoomEnabled.value;
        }
        
        if (chart) {
            chart.update('none');
        }
    }

    function resetZoom() {
        if (chart && chart.resetZoom) {
            chart.resetZoom();
        }

        document.querySelectorAll(`${CONFIG.controlsSelector} .control-btn`)
            .forEach(btn => {
                if (btn.textContent.includes('Zoom')) {
                    btn.classList.remove('active');
                    btn.textContent = 'Zoom';
                    isZoomEnabled.value = false;
                    
                    if (chart && chart.options.plugins.zoom) {
                        chart.options.plugins.zoom.zoom.wheel.enabled = false;
                        chart.options.plugins.zoom.zoom.pinch.enabled = false;
                    }
                }
            }); 

        if (chart) {
            chart.update('none');
        }
    }

    function customInit() {
        console.log('Budget vs Spend: Starting custom initialization...');
        
        // First, generate HTML if needed
        if (!generateHTML()) {
            console.error('Budget vs Spend: HTML generation failed, retrying...');
            return false;
        }
        
        // Wait a moment for DOM to update after HTML injection
        setTimeout(() => {
            console.log('Budget vs Spend: Checking elements after HTML generation...');
            const canvas = document.getElementById(CONFIG.canvasId);
            const toggles = document.querySelector(CONFIG.togglesSelector);
            
            console.log('Budget vs Spend: Canvas found:', !!canvas);
            console.log('Budget vs Spend: Toggles found:', !!toggles);
            console.log('Budget vs Spend: Chart defined:', typeof Chart !== 'undefined');
            console.log('Budget vs Spend: Datasets available:', typeof datasets !== 'undefined');
            
            if (!canvas || !toggles) {
                console.error('Budget vs Spend: Required elements not found after HTML generation');
                return;
            }
            
            // Create chart and load data directly
            if (typeof Chart !== 'undefined') {
                createChart();
                console.log('Budget vs Spend: Chart created');
                
                if (typeof datasets !== 'undefined') {
                    loadData();
                    console.log('Budget vs Spend: Data loaded');
                } else {
                    console.log('Budget vs Spend: Datasets not ready, polling...');
                    lib.pollForData(loadData);
                }
            } else {
                console.error('Budget vs Spend: Chart.js not available');
            }
        }, 50);
        
        return true; // Return true to stop the retry loop
    }

    const attemptInit = lib.createStandardAttemptInit(customInit);

    // =============================================================================
    // EXPORT USING SHARED LIBRARY
    // =============================================================================

    lib.createStandardExport('BudgetSpendChart', {
        loadData,
        setDateRange: (startDate, endDate) => {
            if (modeDatePicker) {
                modeDatePicker.setDateRange(startDate, endDate);
            } else {
                currentDateRange = { startDate, endDate };
                updateChart();
            }
        },
        getCurrentDateRange: () => currentDateRange,
        toggleZoom,
        resetZoom,
        toggleMetric,
        selectAll: () => lib.selectAllMetrics(dynamicMetrics, updateChart),
        deselectAll: () => lib.deselectAllMetrics(dynamicMetrics, updateChart),
        getChart: () => chart,
        getMetrics: () => dynamicMetrics,
        getCurrentData: () => processedData
    });

    // =============================================================================
    // INITIALIZATION USING SHARED LIBRARY
    // =============================================================================

    // Add small delay to ensure DOM is ready for HTML generation
    setTimeout(() => {
        lib.setupStandardInitialization(attemptInit);
    }, 100);

})(); 