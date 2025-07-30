// =============================================================================
// Daily BW Spend Categories Chart (Refactored)
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
        const dateTimePattern = /^(date|day|time|created|updated|timestamp|objective_id)$/i;
        const metrics = columns.filter(col => !dateTimePattern.test(col));
        
        return metrics;
    }

    // =============================================================================
    // CONFIGURATION
    // =============================================================================

    const CONFIG = {
        chartTitle: 'Daily BW Spend Categories',
        datasetName: 'Daily BW Budget vs Spend Ratio Count (channel filter does not apply)',
        fallbackIndex: 1,
        defaultTimeRange: '90D',
        displayMetrics: ['total', 'no_budget', 'overspend', 'spend_90_pct', 'spend_90_pct_less'],
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

    function createDynamicMetrics(availableMetrics) {
        const filteredMetrics = CONFIG.displayMetrics.filter(metric => 
            availableMetrics.includes(metric)
        );

        dynamicMetrics = filteredMetrics.map(metric => {
            let config;
            
            switch(metric) {
                case 'total':
                    config = {
                        id: 'total',
                        name: 'Total',
                        color: '#9f7aea',
                        backgroundColor: 'rgba(159, 122, 234, 0.1)',
                        visible: true,
                        type: 'line',
                        yAxisID: 'y',
                        order: 5
                    };
                    break;
                case 'no_budget':
                    config = {
                        id: 'no_budget',
                        name: 'No Budget',
                        color: '#48bb78',
                        backgroundColor: 'rgba(72, 187, 120, 0.1)',
                        visible: true,
                        type: 'line',
                        yAxisID: 'y',
                        order: 1
                    };
                    break;
                case 'overspend':
                    config = {
                        id: 'overspend',
                        name: 'Overspend',
                        color: '#4299e1',
                        backgroundColor: 'rgba(66, 153, 225, 0.1)',
                        visible: true,
                        type: 'line',
                        yAxisID: 'y',
                        order: 2
                    };
                    break;
                case 'spend_90_pct':
                    config = {
                        id: 'spend_90_pct',
                        name: 'Spend 90-100%',
                        color: '#ed8936',
                        backgroundColor: 'rgba(237, 137, 54, 0.1)',
                        visible: true,
                        type: 'line',
                        yAxisID: 'y',
                        order: 3
                    };
                    break;
                case 'spend_90_pct_less':
                    config = {
                        id: 'spend_90_pct_less',
                        name: 'Spend <90%',
                        color: '#38b2ac',
                        backgroundColor: 'rgba(56, 178, 172, 0.1)',
                        visible: true,
                        type: 'line',
                        yAxisID: 'y',
                        order: 4
                    };
                    break;
                default:
                    config = {
                        id: metric,
                        name: metric.replace(/_/g, ' '),
                        color: '#6B7280',
                        backgroundColor: 'rgba(107, 114, 128, 0.1)',
                        visible: true,
                        type: 'line',
                        yAxisID: 'y',
                        order: 6
                    };
            }
            
            return config;
        });
    }

    // =============================================================================
    // INITIALIZATION
    // =============================================================================
    
    function init() {
        const canvas = document.getElementById('spendCategoriesChart');
        const toggles = document.querySelector('.spend-categories-toggles');

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
            const extractedMetrics = CONFIG.getMetrics();

            if (extractedMetrics.length > 0) {
                createDynamicMetrics(extractedMetrics);
                loadDatasetContent();
                createMetricToggles();
                processData();
                updateChart();
            } else {
                console.warn('Spend Categories: No metrics extracted from dataset');
            }
        } catch (error) {
            console.error('Spend Categories: Error loading data:', error);
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
            console.error('Spend Categories: Dataset not found');
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
            processedData = { labels: [] };
            dynamicMetrics.forEach(metric => {
                processedData[metric.id] = [];
            });
            return;
        }

        const dayColumn = findDateColumn();
        if (!dayColumn) {
            console.error('Spend Categories: No day column found');
            return;
        }

        // Group data by day and aggregate across objective_id
        const dailyData = {};
        
        rawData.forEach(row => {
            const day = row[dayColumn];
            if (!day) return;

            // Normalize date format to YYYY-MM-DD
            const normalizedDay = day instanceof Date ? 
                day.toISOString().split('T')[0] : 
                String(day).split('T')[0];

            if (!dailyData[normalizedDay]) {
                dailyData[normalizedDay] = {};
                dynamicMetrics.forEach(metric => {
                    dailyData[normalizedDay][metric.id] = 0;
                });
            }

            // Aggregate each metric
            dynamicMetrics.forEach(metric => {
                const value = parseInt(row[metric.id] || 0);
                dailyData[normalizedDay][metric.id] += value;
            });
        });

        // Convert to arrays sorted by date
        const sortedDays = Object.keys(dailyData).sort();
        
        processedData = {
            labels: sortedDays
        };

        dynamicMetrics.forEach(metric => {
            processedData[metric.id] = sortedDays.map(day => dailyData[day][metric.id] || 0);
        });
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
        
        const filtered = {
            labels: processedData.labels.slice(startIndex)
        };

        dynamicMetrics.forEach(metric => {
            filtered[metric.id] = processedData[metric.id].slice(startIndex);
        });
        
        return filtered;
    }

    // =============================================================================
    // CHART CREATION
    // =============================================================================

    function createChart() {
        const canvas = document.getElementById('spendCategoriesChart');
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
            type: 'line',
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
                                return `${context.dataset.label}: ${value.toLocaleString()}`;
                            }
                        }
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
                            unit: 'day',
                            tooltipFormat: 'MMM dd, yyyy',
                            displayFormats: {
                                day: 'MMM dd'
                            }
                        },
                        adapters: {
                            date: {}
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
                            text: 'Count'
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        },
                        ticks: {
                            callback: function(value) {
                                return value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
    }

    function createDatasets() {
        const filteredData = filterByTimeRange(currentTimeRange);
        
        return dynamicMetrics
            .filter(metric => metric.visible)
            .map(metric => ({
                label: metric.name,
                data: filteredData[metric.id] || [],
                borderColor: metric.color,
                backgroundColor: metric.backgroundColor,
                borderWidth: 2,
                fill: false,
                tension: 0.1,
                pointRadius: 3,
                pointHoverRadius: 6,
                pointHoverBackgroundColor: metric.color,
                pointHoverBorderColor: '#ffffff',
                pointHoverBorderWidth: 2,
                yAxisID: metric.yAxisID,
                order: metric.order
            }))
            .sort((a, b) => a.order - b.order);
    }

    function updateChart() {
        if (!chart || !processedData.labels) return;

        const datasets = createDatasets();
        const filteredData = filterByTimeRange(currentTimeRange);

        chart.data.labels = filteredData.labels;
        chart.data.datasets = datasets;
        
        chart.update('active');
    }

    // =============================================================================
    // UI CONTROLS
    // =============================================================================

    function createMetricToggles() {
        const container = document.querySelector('.spend-categories-toggles');
        if (!container || !dynamicMetrics.length) return;

        container.innerHTML = '';

        // Add select/deselect all buttons
        const metricsHeader = document.querySelector('.spend-categories-metrics-title');
        if (metricsHeader && !document.getElementById('spend-select-all-btn')) {
            const selectAllBtn = document.createElement('button');
            selectAllBtn.id = 'spend-select-all-btn';
            selectAllBtn.className = 'select-all-btn';
            selectAllBtn.textContent = 'Select All';
            selectAllBtn.onclick = selectAllMetrics;
            
            const deselectAllBtn = document.createElement('button');
            deselectAllBtn.id = 'spend-deselect-all-btn';
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
        document.querySelectorAll('.spend-categories-controls .control-btn')
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
        document.querySelectorAll('.spend-categories-controls .control-btn')
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

    window.SpendCategoriesChart = {
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