// =============================================================================
// PMP v Open Market Area Chart (Refactored)
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
        chartTitle: 'PMP v Open Market Impressions and Spend',
        datasetName: 'PMP vs OpenMarket Imps and Spend (Obj filter does not apply)',
        fallbackIndex: 6,
        defaultTimeRange: '90D',
        displayMetrics: ['pmp_spend_pct', 'open_spend_pct'],
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
                case 'pmp_spend_pct':
                    config = {
                        id: 'pmp_spend_pct',
                        name: 'PMP Spend %',
                        color: '#007bff',
                        backgroundColor: 'rgba(0, 123, 255, 0.3)',
                        visible: true,
                        type: 'area',
                        yAxisID: 'y',
                        order: 1
                    };
                    break;
                case 'open_spend_pct':
                    config = {
                        id: 'open_spend_pct',
                        name: 'Open Market Spend %',
                        color: '#28a745',
                        backgroundColor: 'rgba(40, 167, 69, 0.3)',
                        visible: true,
                        type: 'area',
                        yAxisID: 'y',
                        order: 2
                    };
                    break;
                case 'pmp_imps_pct':
                    config = {
                        id: 'pmp_imps_pct',
                        name: 'PMP Impressions %',
                        color: '#dc3545',
                        backgroundColor: 'rgba(220, 53, 69, 0.3)',
                        visible: true,
                        type: 'area',
                        yAxisID: 'y',
                        order: 3
                    };
                    break;
                case 'open_imps_pct':
                    config = {
                        id: 'open_imps_pct',
                        name: 'Open Market Impressions %',
                        color: '#ffc107',
                        backgroundColor: 'rgba(255, 193, 7, 0.3)',
                        visible: true,
                        type: 'area',
                        yAxisID: 'y',
                        order: 4
                    };
                    break;
                default:
                    config = {
                        id: metric,
                        name: formatMetricName(metric),
                        color: '#6B7280',
                        backgroundColor: 'rgba(107, 114, 128, 0.3)',
                        visible: true,
                        type: 'area',
                        yAxisID: 'y',
                        order: 5
                    };
            }
            
            return config;
        });
    }

    function formatMetricName(columnName) {
        return columnName
            .replace(/_/g, ' ')
            .replace(/pct/g, '%')
            .replace(/\b\w/g, l => l.toUpperCase());
    }

    // =============================================================================
    // INITIALIZATION
    // =============================================================================
    
    function init() {
        const canvas = document.getElementById('pmpVOpenMarketAreaChart');
        const toggles = document.querySelector('.pmp-v-open-market-area-toggles');

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
                console.warn('PMP v Open Market: No metrics extracted from dataset');
            }
        } catch (error) {
            console.error('PMP v Open Market: Error loading data:', error);
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
            console.error('PMP v Open Market: Dataset not found');
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
               columns.find(col => /time/i.test(col)) ||
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

        const dateColumn = findDateColumn();
        if (!dateColumn) {
            console.error('PMP v Open Market: No date column found');
            return;
        }

        // Group data by day and average the percentage values
        const dailyData = {};
        
        rawData.forEach(row => {
            const date = row[dateColumn];
            if (!date) return;

            const dayKey = date.includes && date.includes(' ') ? date.split(' ')[0] : date;

            if (!dailyData[dayKey]) {
                dailyData[dayKey] = {};
                dynamicMetrics.forEach(metric => {
                    dailyData[dayKey][metric.id] = [];
                });
            }

            // Collect values for averaging
            dynamicMetrics.forEach(metric => {
                const value = parseFloat(row[metric.id] || 0);
                if (!isNaN(value)) {
                    dailyData[dayKey][metric.id].push(value);
                }
            });
        });

        // Convert to arrays sorted by date and calculate averages
        const sortedDays = Object.keys(dailyData).sort();
        
        processedData = {
            labels: sortedDays
        };

        dynamicMetrics.forEach(metric => {
            processedData[metric.id] = sortedDays.map(day => {
                const values = dailyData[day][metric.id];
                return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
            });
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
        const canvas = document.getElementById('pmpVOpenMarketAreaChart');
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
                        max: 1,
                        title: {
                            display: true,
                            text: 'Percentage'
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        },
                        ticks: {
                            callback: function(value) {
                                return (value * 100).toFixed(1) + '%';
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
                fill: true,
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
        const container = document.querySelector('.pmp-v-open-market-area-toggles');
        if (!container || !dynamicMetrics.length) return;

        container.innerHTML = '';

        // Add select/deselect all buttons
        const metricsHeader = document.querySelector('.pmp-v-open-market-area-metrics-title');
        if (metricsHeader && !document.getElementById('pmp-select-all-btn')) {
            const selectAllBtn = document.createElement('button');
            selectAllBtn.id = 'pmp-select-all-btn';
            selectAllBtn.className = 'select-all-btn';
            selectAllBtn.textContent = 'Select All';
            selectAllBtn.onclick = selectAllMetrics;
            
            const deselectAllBtn = document.createElement('button');
            deselectAllBtn.id = 'pmp-deselect-all-btn';
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
                <input type="checkbox" class="metric-checkbox" id="metric-${metric.id.replace(/[^a-zA-Z0-9]/g, '_')}" ${metric.visible ? 'checked' : ''}>
                <label for="metric-${metric.id.replace(/[^a-zA-Z0-9]/g, '_')}" class="metric-label">
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
        
        const checkbox = document.getElementById(`metric-${metricId.replace(/[^a-zA-Z0-9]/g, '_')}`);
        if (!checkbox) return;
        
        const toggleDiv = checkbox.parentElement;
        
        metric.visible = checkedState;
        toggleDiv.classList.toggle('active', metric.visible);
        updateChart();
    }

    function selectAllMetrics() {
        dynamicMetrics.forEach(metric => {
            metric.visible = true;
            const checkbox = document.getElementById(`metric-${metric.id.replace(/[^a-zA-Z0-9]/g, '_')}`);
            const toggleDiv = checkbox.parentElement;
            
            checkbox.checked = true;
            toggleDiv.classList.add('active');
        });
        
        updateChart();
    }

    function deselectAllMetrics() {
        dynamicMetrics.forEach(metric => {
            metric.visible = false;
            const checkbox = document.getElementById(`metric-${metric.id.replace(/[^a-zA-Z0-9]/g, '_')}`);
            const toggleDiv = checkbox.parentElement;
            
            checkbox.checked = false;
            toggleDiv.classList.remove('active');
        });
        
        updateChart();
    }

    function switchTimeRange(range) {
        currentTimeRange = range;
        
        // Update button states
        document.querySelectorAll('.pmp-v-open-market-area-controls .control-btn')
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
        document.querySelectorAll('.pmp-v-open-market-area-controls .control-btn')
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

    window.PmpVOpenMarketAreaChart = {
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