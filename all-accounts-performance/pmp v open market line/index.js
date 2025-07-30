// =============================================================================
// PMP vs Open Market Line Chart
// =============================================================================

(function() {
    'use strict';

        // =============================================================================
    // METRIC EXTRACTION - Keep working logic from area chart
    // =============================================================================
    function getMetricsFromDataset(datasetName, fallbackIndex = null) {
        if (typeof datasets === 'undefined') {
            console.warn('datasets object not available yet');
            return [];
        }

        // Dataset discovery logic - preserve exactly as working area chart
        let targetDataset = null;
        if (datasets[datasetName]) {
            targetDataset = datasets[datasetName];
        } else if (fallbackIndex !== null && datasets[fallbackIndex]) {
            targetDataset = datasets[fallbackIndex];
        }

        if (!targetDataset) {
            console.error('No dataset found');
            return [];
        }

        // Data validation - preserve exactly as working area chart
        const dataArray = targetDataset.content || targetDataset;
        if (!Array.isArray(dataArray) || dataArray.length === 0) {
            console.error('Dataset has no data');
            return [];
        }

        // Metric extraction - preserve exactly as working area chart
        const columns = Object.keys(dataArray[0]);
        const dateTimePattern = /^(date|day|time|created|updated|timestamp)$/i;
        const metrics = columns.filter(col => !dateTimePattern.test(col));

        return metrics;
    }

    // Configuration
    const CONFIG = {
        chartTitle: 'PMP v Open Market Impressions',
        datasetName: 'PMP vs OpenMarket Imps and Spend (Obj filter does not apply)',
        fallbackIndex: 5,
        defaultTimeRange: '90D',
            displayMetrics: ['imps_banner_open_market', 'imps_banner_pmp', 'imps_open_market', 'imps_pmp', 'imps_total', 'imps_video_open_market', 'imps_video_pmp'],

        // Preserve working metric extraction pattern
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

    // =============================================================================
    // Initialization - Robust for Mode Analytics environment
    // =============================================================================

    function init() {
        const canvas = document.getElementById('pmpVOpenMarketLineChart');
        const toggles = document.querySelector('.pmp-v-open-market-line-toggles');

        if (!canvas || !toggles || typeof Chart === 'undefined') {
            return false; // Signal that we need to retry
        }

            if (!chart) {
            createChart();
            }

            if (typeof datasets !== 'undefined') {
            loadData();
            return true; // Successfully initialized
            } else {
            pollForData();
            return true; // Chart created, polling for data
        }
    }

    function pollForData() {
        if (typeof datasets !== 'undefined') {
            loadData();
        } else {
            setTimeout(pollForData, 1000);
        }
    }

    // Robust initialization for Mode Analytics
    function attemptInit() {
        if (init()) {
            return; // Successfully initialized
        }
        setTimeout(attemptInit, 500); // Retry if not ready
    }

    // =============================================================================
    // Data Loading - Preserve working pipeline
    // =============================================================================

    function loadData() {
        try {
            // Use exact working pipeline from area chart
            const extractedMetrics = CONFIG.getMetrics();

                if (extractedMetrics.length > 0) {
                // Filter metrics exactly like working area chart
                const filteredMetrics = CONFIG.displayMetrics.filter(metric => extractedMetrics.includes(metric));

                createDynamicMetrics(filteredMetrics);
                    loadDatasetContent();
                    createMetricToggles();
                    processData();
                    updateChart();
                } else {
                    console.warn('No metrics extracted from dataset');
            }
        } catch (error) {
            console.error('Error loading data:', error);
        }
    }

    function loadDatasetContent() {
        // Preserve exact dataset loading logic from working area chart
        let targetDataset = null;

        if (datasets[CONFIG.datasetName]) {
            targetDataset = datasets[CONFIG.datasetName];
        } else if (datasets[CONFIG.fallbackIndex]) {
            targetDataset = datasets[CONFIG.fallbackIndex];
        }

        if (targetDataset) {
            rawData = targetDataset.content || targetDataset || [];
        }
    }

    function createDynamicMetrics(filteredMetrics) {
        // Simplified from area chart but preserve core structure
        const colors = [
            '#007bff', '#28a745', '#dc3545', '#ffc107', 
            '#6f42c1', '#fd7e14', '#343a40'
        ];
        
        dynamicMetrics = filteredMetrics.map((metric, index) => ({
                id: metric,
                name: formatMetricName(metric),
            color: colors[index % colors.length],
                visible: true,
                yAxisID: 'y',
            order: index + 1
        }));
    }

    function formatMetricName(columnName) {
        return columnName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    // =============================================================================
    // Data Processing - Preserve working aggregation logic
    // =============================================================================

    function processData() {
        if (!rawData.length || !dynamicMetrics.length) return;

        const dateColumn = findDateColumn();
        if (!dateColumn) return;

        // Preserve exact aggregation logic from working area chart
        const dailyData = {};
        
        rawData.forEach(row => {
            const date = row[dateColumn];
            if (!date) return;
            
            const dayKey = date.includes && date.includes(' ') ? date.split(' ')[0] : date;
            
            // Normalize date format to YYYY-MM-DD
            const normalizedDay = dayKey instanceof Date ? 
                dayKey.toISOString().split('T')[0] : 
                String(dayKey).split('T')[0];
            
            if (!dailyData[normalizedDay]) {
                dailyData[normalizedDay] = {};
                dynamicMetrics.forEach(metric => {
                    dailyData[normalizedDay][metric.id] = 0;
                    dailyData[normalizedDay][`${metric.id}_count`] = 0;
                });
            }
            
            dynamicMetrics.forEach(metric => {
                const value = parseFloat(row[metric.id] || 0);
                if (!isNaN(value)) {
                    dailyData[normalizedDay][metric.id] += value;
                    dailyData[normalizedDay][`${metric.id}_count`] += 1;
                }
            });
        });

        const sortedDays = Object.keys(dailyData).sort();
        const filteredDays = filterByTimeRange(sortedDays);
        
        processedData = { labels: filteredDays };
        
        dynamicMetrics.forEach(metric => {
            processedData[metric.id] = filteredDays.map(day => {
                const count = dailyData[day][`${metric.id}_count`];
                return count > 0 ? dailyData[day][metric.id] / count : 0;
            });
        });
    }

    function findDateColumn() {
        if (!rawData.length) return null;
        const columns = Object.keys(rawData[0]);
        
        // Try standard columns first
        if (columns.includes('day')) return 'day';
        if (columns.includes('date')) return 'date';
        
        // Fallback pattern
        return columns.find(col => /date|day|time/i.test(col));
    }

    function filterByTimeRange(sortedDays) {
        if (currentTimeRange === 'ALL' || !sortedDays.length) return sortedDays;
        
        const daysMap = { '7D': 7, '30D': 30, '90D': 90 };
        const daysToShow = daysMap[currentTimeRange];
        if (!daysToShow) return sortedDays;
        
        const endDate = new Date(sortedDays[sortedDays.length - 1]);
        const startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - (daysToShow - 1));
        
        return sortedDays.filter(day => {
            const dayDate = new Date(day);
            return dayDate >= startDate && dayDate <= endDate;
        });
    }

    // =============================================================================
    // Chart Management
    // =============================================================================

    function createChart() {
        const canvas = document.getElementById('pmpVOpenMarketLineChart');
        const ctx = canvas.getContext('2d');
        
        if (typeof ChartZoom !== 'undefined') Chart.register(ChartZoom);
        
        chart = new Chart(ctx, {
            type: 'line',
            data: { labels: [], datasets: [] },
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
                    legend: { display: false },
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
                            wheel: { enabled: false },
                            pinch: { enabled: false },
                            mode: 'x',
                        },
                        pan: { enabled: true, mode: 'x' }
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
                        position: 'left',
                        title: { display: true, text: 'Impressions' },
                        ticks: {
                            callback: value => value.toLocaleString()
                        }
                    }
                }
            }
        });
    }

    function updateChart() {
        if (!chart || !processedData.labels) return;

        const datasets = createDatasets();
        chart.data.labels = processedData.labels;
        chart.data.datasets = datasets;
        chart.update('active');
    }

    function createDatasets() {
        return dynamicMetrics
            .filter(metric => metric.visible)
            .map(metric => ({
                label: metric.name,
                data: processedData[metric.id] || [],
                borderColor: metric.color,
                backgroundColor: 'transparent',
                borderWidth: 2,
                fill: false,
                tension: 0.1,
                yAxisID: metric.yAxisID,
                order: metric.order
            }))
            .sort((a, b) => a.order - b.order);
    }

    // =============================================================================
    // UI Controls
    // =============================================================================

    function createMetricToggles() {
        const container = document.querySelector('.pmp-v-open-market-line-toggles');
        if (!container || !dynamicMetrics.length) return;
        
        container.innerHTML = '';

        // Add select/deselect all buttons
        const metricsHeader = document.querySelector('.pmp-v-open-market-line-metrics-title');
        if (metricsHeader && !document.getElementById('pmp-line-select-all-btn')) {
            const selectAllBtn = document.createElement('button');
            selectAllBtn.id = 'pmp-line-select-all-btn';
            selectAllBtn.className = 'select-all-btn';
            selectAllBtn.textContent = 'Select All';
            selectAllBtn.onclick = selectAllMetrics;
            
            const deselectAllBtn = document.createElement('button');
            deselectAllBtn.id = 'pmp-line-deselect-all-btn';
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
        
        // Use passed state if provided, otherwise use checkbox state
        metric.visible = checkedState !== undefined ? checkedState : checkbox.checked;
        toggleDiv.classList.toggle('active', metric.visible);
        updateChart();
    }

    function switchTimeRange(timeRange) {
        currentTimeRange = timeRange;
        
        document.querySelectorAll('.pmp-v-open-market-line-controls .control-btn')
            .forEach(btn => {
                btn.classList.remove('active');
                const btnText = btn.textContent.trim();
                if (btnText === timeRange || (timeRange === 'ALL' && btnText === 'All')) {
                    btn.classList.add('active');
                }
            });
        
        processData();
        updateChart();
    }

    function toggleZoom() {
        isZoomEnabled = !isZoomEnabled;
        
        const btn = event.target;
        btn.classList.toggle('active', isZoomEnabled);
        btn.textContent = isZoomEnabled ? 'Zoom ON' : 'Zoom';
        
        if (chart.options.plugins.zoom) {
            chart.options.plugins.zoom.zoom.wheel.enabled = isZoomEnabled;
            chart.options.plugins.zoom.zoom.pinch.enabled = isZoomEnabled;
        }
        
        chart.update('none');
    }

    function resetZoom() {
        if (chart && chart.resetZoom) {
            chart.resetZoom();
        }
        
        document.querySelectorAll('.pmp-v-open-market-line-controls .control-btn')
            .forEach(btn => {
                if (btn.textContent.includes('Zoom')) {
                    btn.classList.remove('active');
                    btn.textContent = 'Zoom';
                    isZoomEnabled = false;
                }
            });
        
        if (chart && chart.options.plugins.zoom) {
            chart.options.plugins.zoom.zoom.wheel.enabled = false;
            chart.options.plugins.zoom.zoom.pinch.enabled = false;
        }
        
        chart.update('none');
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

    // =============================================================================
    // Export
    // =============================================================================

    window.PmpVOpenMarketLineChart = {
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
    setTimeout(attemptInit, 200); // Also try independently of DOM ready

})();