// =============================================================================
// Budget vs Spend Performance Chart (Refactored)
// =============================================================================

(function() {
    'use strict';

    // =============================================================================
    // METRIC EXTRACTION
    // =============================================================================

    function getMetricsFromDataset(datasetName, fallbackIndex = null) {
        if (typeof datasets === 'undefined') {
            return [];
        }

        let targetDataset = null;
        if (datasets[datasetName]) {
            targetDataset = datasets[datasetName];
        } else if (fallbackIndex !== null && datasets[fallbackIndex]) {
            targetDataset = datasets[fallbackIndex];
        }
        
        if (!targetDataset) {
            return [];
        }

        const dataArray = targetDataset.content || targetDataset;
        if (!Array.isArray(dataArray) || dataArray.length === 0) {
            return [];
        }

        const columns = Object.keys(dataArray[0]);
        const dateTimePattern = /^(date|day|time|created|updated|timestamp)$/i;
        const metrics = columns.filter(col => !dateTimePattern.test(col));
        
        return metrics;
    }

    // =============================================================================
    // CONFIGURATION
    // =============================================================================

    const CONFIG = {
        chartTitle: 'Daily BW Budget V. Spend / Spend Pct',
        datasetName: 'Daily BW Budget vs Spend (channel filter does not apply)',
        fallbackIndex: 0,
        defaultTimeRange: '90D',
        displayMetrics: ['spend', 'budget', 'spend_pct'],
        getMetrics: function() {
            return getMetricsFromDataset(CONFIG.datasetName, CONFIG.fallbackIndex);
        }
    };

    // State
    let chart;
    let rawData = [];
    let processedData = {};
    let currentTimeRange = CONFIG.defaultTimeRange;
    let isZoomEnabled = false;
    let dynamicMetrics = [];
    let columnMapping = {};

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
    // INITIALIZATION
    // =============================================================================
    
    function init() {
        const canvas = document.getElementById('budgetSpendChart');
        const toggles = document.querySelector('.budget-spend-toggles');

        if (!canvas || !toggles || typeof Chart === 'undefined') {
            return false;
        }

        if (!chart) {
            createChart();
        }

        if (typeof datasets !== 'undefined') {
            loadData();
            return true;
        } else {    
            pollForData();
            return true;
        }
    }

    function pollForData() {
        if (typeof datasets !== 'undefined') {
            loadData();
        } else {
            setTimeout(pollForData, 1000);
        }
    }

    function attemptInit() {
        if (init()) {
            return;
        }
        setTimeout(attemptInit, 500);
    }

    function loadData() {
        try {
            console.log('Budget vs Spend: Loading data...');
            const extractedMetrics = CONFIG.getMetrics();
            console.log('Budget vs Spend: Extracted metrics:', extractedMetrics);

            if (extractedMetrics.length > 0) {
                createDynamicMetrics(extractedMetrics);
                console.log('Budget vs Spend: Dynamic metrics created:', dynamicMetrics);
                loadDatasetContent();
                console.log('Budget vs Spend: Raw data loaded:', rawData.length, 'rows');
                if (rawData.length > 0) {
                    console.log('Budget vs Spend: First row sample:', rawData[0]);
                    console.log('Budget vs Spend: Available columns:', Object.keys(rawData[0]));
                }
                createMetricToggles();
                processData();
                console.log('Budget vs Spend: Processed data:', processedData);
                updateChart();
            } else {
                console.warn('Budget vs Spend: No metrics extracted from dataset');
                console.log('Budget vs Spend: Available datasets:', typeof datasets !== 'undefined' ? Object.keys(datasets) : 'datasets undefined');
            }
        } catch (error) {
            console.error('Budget vs Spend: Error loading data:', error);
        }
    }

    function loadDatasetContent() {
        let targetDataset = null;

        if (datasets[CONFIG.datasetName]) {
            targetDataset = datasets[CONFIG.datasetName];
        } else if (datasets[CONFIG.fallbackIndex]) {
            targetDataset = datasets[CONFIG.fallbackIndex];
        }

        if (targetDataset) {
            rawData = targetDataset.content || targetDataset;
        } else {
            console.error('Budget vs Spend: Dataset not found');
            rawData = [];
        }
    }

    // =============================================================================
    // DATA PROCESSING
    // =============================================================================

    function findDateColumn() {
        if (!rawData.length) return null;
        
        const columns = Object.keys(rawData[0]);
        return columns.find(col => /day/i.test(col)) || 
               columns.find(col => /date/i.test(col)) || 
               columns[0];
    }

    function processData() {
        if (!rawData || !rawData.length) {
            processedData = { labels: [], budget: [], spend: [], spend_pct: [] };
            return;
        }

        const dayColumn = findDateColumn();
        if (!dayColumn) {
            console.error('Budget vs Spend: No day column found');
            return;
        }

        // Group data by day and aggregate
        const dailyData = {};
        
        rawData.forEach(row => {
            const budget = parseFloat(row[columnMapping.budget] || 0);
            const spend = parseFloat(row[columnMapping.spend] || 0);
            
            // Note: We no longer use individual spend_pct values for aggregation
            // Instead, we calculate spend_pct as total_spend / total_budget per day
            
            // Only filter out rows with no meaningful data
            if (budget <= 0 && spend <= 0) {
                // Skip only if both budget and spend are invalid/zero
                return;
            }
            
            // Handle cases where budget is 0 but spend exists (treat budget as 0)
            const effectiveBudget = Math.max(0, budget);
            
            const day = row[dayColumn];
            if (!dailyData[day]) {
                dailyData[day] = {
                    budget: 0,
                    spend: 0
                };
            }
            
            dailyData[day].budget += effectiveBudget;
            dailyData[day].spend += spend;
        });

        // Convert to arrays sorted by date
        const sortedDays = Object.keys(dailyData).sort();
        
        processedData = {
            labels: sortedDays,
            budget: sortedDays.map(day => Math.max(0, dailyData[day].budget - dailyData[day].spend)), // Remaining budget
            spend: sortedDays.map(day => dailyData[day].spend),
            spend_pct: sortedDays.map(day => {
                // Calculate spend percentage the same way as SQL: total_spend / total_budget
                const totalBudget = dailyData[day].budget;
                const totalSpend = dailyData[day].spend;
                return totalBudget > 0 ? totalSpend / totalBudget : 0;
            })
        };
    }

    function filterByTimeRange(range) {
        if (!processedData.labels) return processedData;
        
        let daysToShow;
        
        switch (range) {
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
        
        const startIndex = Math.max(0, processedData.labels.length - daysToShow);
        
        return {
            labels: processedData.labels.slice(startIndex),
            budget: processedData.budget.slice(startIndex),
            spend: processedData.spend.slice(startIndex),
            spend_pct: processedData.spend_pct.slice(startIndex)
        };
    }

    // =============================================================================
    // CHART CREATION
    // =============================================================================

    function createChart() {
        const canvas = document.getElementById('budgetSpendChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        // Register Chart.js plugins
        if (typeof ChartZoom !== 'undefined') {
            Chart.register(ChartZoom);
        }
        if (typeof ChartAnnotation !== 'undefined') {
            Chart.register(ChartAnnotation);
        }

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
                    zoom: {
                        pan: {
                            enabled: true,
                            mode: 'x',
                            modifierKey: 'ctrl'
                        },
                        zoom: {
                            wheel: {
                                enabled: false
                            },
                            pinch: {
                                enabled: false
                            },
                            mode: 'x'
                        }
                    }
                },
                scales: {
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
                            color: 'rgba(0, 0, 0, 0.1)'
                        },
                        ticks: {
                            maxRotation: 45,
                            minRotation: 45
                        }
                    },
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
                        beforeUpdate: function(scale) {
                            console.log('=== Budget vs Spend: Y1 Axis Scaling Debug ===');
                            
                            // Access the primary y-axis scale to calculate proportional alignment
                            const chart = scale.chart;
                            const primaryScale = chart.scales.y;
                            
                            // Get the actual data to understand the range we're working with
                            const datasets = chart.data.datasets;
                            const spendPctDataset = datasets.find(d => d.label === 'Avg. Spend %');
                            
                            console.log('Available datasets:', datasets ? datasets.map(d => d.label) : 'None');
                            console.log('Found spend pct dataset:', !!spendPctDataset);
                            console.log('Primary scale available:', !!primaryScale);
                            
                            if (primaryScale && spendPctDataset && spendPctDataset.data) {
                                // Calculate what the primary axis max will be based on the budget+spend data
                                const budgetDataset = datasets.find(d => d.label === 'Budget');
                                const spendDataset = datasets.find(d => d.label === 'Spend');
                                
                                console.log('Found budget dataset:', !!budgetDataset);
                                console.log('Found spend dataset:', !!spendDataset);
                                
                                if (budgetDataset && spendDataset) {
                                    console.log('📊 Using DYNAMIC alignment calculation');
                                    
                                    // Find the maximum combined value (budget + spend) to determine primary scale
                                    let maxCombined = 0;
                                    for (let i = 0; i < Math.min(budgetDataset.data.length, spendDataset.data.length); i++) {
                                        const combined = (budgetDataset.data[i] || 0) + (spendDataset.data[i] || 0);
                                        maxCombined = Math.max(maxCombined, combined);
                                    }
                                    
                                    // We want 1.0 on secondary axis to align with 800k on primary axis
                                    const targetAlignmentValue = 800000; // 800k
                                    const secondaryAlignmentValue = 1.0;
                                    
                                    // Calculate what the secondary max should be based on the primary max
                                    // If 1.0 aligns with 800k, then maxCombined aligns with: maxCombined * (1.0 / 800k)
                                    const calculatedSecondaryMax = maxCombined * (secondaryAlignmentValue / targetAlignmentValue);
                                    
                                    console.log('Max combined budget+spend:', maxCombined.toLocaleString());
                                    console.log('Target: 1.0 on secondary = 800k on primary');
                                    console.log('Calculated secondary max:', calculatedSecondaryMax.toFixed(3));
                                    
                                    // We want to start at 0.65 and have a reasonable range
                                    const secondaryMin = 0.65;
                                    const secondaryMax = Math.max(calculatedSecondaryMax, 1.05); // Ensure it goes at least to 1.05
                                    
                                    console.log('Setting secondary axis: min =', secondaryMin, ', max =', secondaryMax.toFixed(3));
                                    console.log('This ensures 1.0 aligns with 800k on primary axis');
                                    
                                    // Set the scale properties correctly
                                    scale.min = secondaryMin;
                                    scale.max = secondaryMax;
                                    
                                    // Set the options for the scale itself (this is what Chart.js actually uses)
                                    scale.options.min = secondaryMin;
                                    scale.options.max = secondaryMax;
                                    scale.options.ticks.stepSize = 0.05; // 5% increments
                                    
                                    console.log('Scale configuration: min =', secondaryMin, ', max =', secondaryMax.toFixed(3), ', stepSize = 0.05');
                                    console.log('✅ Dynamic alignment applied successfully');
                                    return;
                                } else {
                                    console.log('❌ Could not find both budget and spend datasets');
                                }
                            } else {
                                console.log('❌ Missing required components for dynamic alignment');
                            }
                            
                            // Fallback: use the data-driven approach with our desired range
                            if (spendPctDataset && spendPctDataset.data && spendPctDataset.data.length > 0) {
                                console.log('📊 Using DATA-DRIVEN fallback');
                                
                                const values = spendPctDataset.data.filter(v => v != null && !isNaN(v));
                                if (values.length > 0) {
                                    // Ensure we start at 0.65 and accommodate the data range
                                    const dataMax = Math.max(...values);
                                    const dataMin = Math.min(...values);
                                    
                                    const calculatedMin = Math.min(0.65, dataMin - 0.05);
                                    const calculatedMax = Math.max(1.0, dataMax + 0.05);
                                    
                                    console.log('Spend pct data range: min =', dataMin.toFixed(3), ', max =', dataMax.toFixed(3));
                                    console.log('Setting secondary axis: min =', calculatedMin, ', max =', calculatedMax);
                                    
                                    scale.min = calculatedMin;
                                    scale.max = calculatedMax;
                                    
                                    // Set scale options for proper display
                                    scale.options.min = calculatedMin;
                                    scale.options.max = calculatedMax;
                                    scale.options.ticks.stepSize = 0.05; // 5% increments
                                    
                                    console.log('Tick configuration: min =', calculatedMin, ', max =', calculatedMax, ', stepSize = 0.05');
                                    console.log('✅ Data-driven fallback applied');
                                } else {
                                    console.log('❌ No valid spend pct data found');
                                }
                            } else {
                                console.log('📊 Using FINAL fallback (fixed values)');
                                
                                // Final fallback
                                scale.min = 0.65;
                                scale.max = 1.05;
                                
                                // Set scale options for proper display
                                scale.options.min = 0.65;
                                scale.options.max = 1.05;
                                scale.options.ticks.stepSize = 0.05; // 5% increments
                                
                                console.log('Setting secondary axis: min = 0.65, max = 1.05');
                                console.log('Scale configuration: min = 0.65, max = 1.05, stepSize = 0.05');
                                console.log('✅ Final fallback applied');
                            }
                            
                            console.log('=== End Y1 Axis Scaling Debug ===');
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

    function createDatasets() {
        const filteredData = filterByTimeRange(currentTimeRange);
        
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
        const filteredData = filterByTimeRange(currentTimeRange);

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
    // UI CONTROLS
    // =============================================================================

    function createMetricToggles() {
        const container = document.querySelector('.budget-spend-toggles');
        if (!container || !dynamicMetrics.length) return;

        container.innerHTML = '';

        // Add select/deselect all buttons
        const metricsHeader = document.querySelector('.budget-spend-metrics-title');
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
            
            const buttonsContainer = document.createElement('div');
            buttonsContainer.className = 'metrics-buttons-container';
            buttonsContainer.style.marginBottom = '15px';
            buttonsContainer.appendChild(selectAllBtn);
            buttonsContainer.appendChild(deselectAllBtn);
            
            metricsHeader.parentNode.insertBefore(buttonsContainer, container);
        }

        dynamicMetrics.forEach(metric => {
            const div = document.createElement('div');
            div.className = `metric-toggle ${metric.visible ? 'active' : ''}`;
            div.innerHTML = `
                <input type="checkbox" class="metric-checkbox" id="metric-${metric.id}" ${metric.visible ? 'checked' : ''}>
                <label for="metric-${metric.id}" class="metric-label">
                    <span class="metric-color" style="background-color: ${metric.color}"></span>
                    ${metric.name}
                </label>
            `;

            const checkbox = div.querySelector('.metric-checkbox');
            
            checkbox.addEventListener('change', (e) => {
                e.stopPropagation();
                toggleMetric(metric.id, e.target.checked);
            });

            div.addEventListener('click', (e) => {
                if (e.target === checkbox || e.target.tagName === 'INPUT') return;
                e.preventDefault();
                e.stopPropagation();
                const newState = !checkbox.checked;
                checkbox.checked = newState;
                toggleMetric(metric.id, newState);
            });

            container.appendChild(div);
        });
    }

    function toggleMetric(metricId, checkedState) {
        const metric = dynamicMetrics.find(m => m.id === metricId);
        if (!metric) return;
        
        const checkbox = document.getElementById(`metric-${metricId}`);
        if (!checkbox) return;
        
        const toggleDiv = checkbox.parentElement;
        
        metric.visible = checkedState;
        toggleDiv.classList.toggle('active', metric.visible);
        updateChart();
    }

    function selectAllMetrics() {
        dynamicMetrics.forEach(metric => {
            metric.visible = true;
            const checkbox = document.getElementById(`metric-${metric.id}`);
            const toggleDiv = checkbox.parentElement;
            
            checkbox.checked = true;
            toggleDiv.classList.add('active');
        });
        
        updateChart();
    }

    function deselectAllMetrics() {
        dynamicMetrics.forEach(metric => {
            metric.visible = false;
            const checkbox = document.getElementById(`metric-${metric.id}`);
            const toggleDiv = checkbox.parentElement;
            
            checkbox.checked = false;
            toggleDiv.classList.remove('active');
        });
        
        updateChart();
    }

    function switchTimeRange(range) {
        currentTimeRange = range;
        
        // Update button states
        document.querySelectorAll('.budget-spend-controls .control-btn')
            .forEach(btn => btn.classList.remove('active'));
        
        event.target.classList.add('active');
        updateChart();
    }

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

    function resetZoom() {
        if (chart && chart.resetZoom) {
            chart.resetZoom();
        }
        
        // Reset zoom button state
        document.querySelectorAll('.budget-spend-controls .control-btn')
            .forEach(btn => {
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
    // EXPORT
    // =============================================================================

    window.BudgetSpendChart = {
        loadData,
        switchTimeRange,
        toggleZoom,
        resetZoom,
        toggleMetric,
        selectAll: selectAllMetrics,
        deselectAll: deselectAllMetrics,
        getChart: () => chart,
        getMetrics: () => dynamicMetrics,
        getCurrentData: () => processedData
    };

    // Initialize - Multiple entry points for Mode Analytics reliability
    document.addEventListener('DOMContentLoaded', () => setTimeout(attemptInit, 100));
    setTimeout(attemptInit, 200);
})(); 