// Non Paid Visit Stats Chart
// Handles data from "Non Paid Visit Stats" query

(function() {
    'use strict';
    
    // Global variables (namespaced to avoid conflicts)
    let chart;
    let rawData = [];
    let processedData = {};
    let currentTimeRange = '90D';
    let isZoomEnabled = false;

    // Define the two metrics for this chart
    const METRICS = [
        {
            id: 'nonpaid_visits_pct',
            name: 'Non-Paid Visits %',
            color: '#007bff',
            backgroundColor: 'rgba(0, 123, 255, 0.1)',
            visible: true,
            type: 'line',
            yAxisID: 'y',
            order: 1
        },
        {
            id: 'psa_visits_pct',
            name: 'PSA Visits %',
            color: '#28a745',
            backgroundColor: 'rgba(40, 167, 69, 0.1)',
            visible: true,
            type: 'line',
            yAxisID: 'y',
            order: 2
        }
    ];

    // Initialize the chart when the page loads
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
        
        const canvas = document.getElementById('nonPaidVisitStatsChart');
        const togglesContainer = document.querySelector('.non-paid-visit-stats-toggles');
        
        if (canvas && togglesContainer && typeof Chart !== 'undefined') {
            if (!chart) {
                initializeChart();
            }
            
            const hasActualElements = togglesContainer.children.length > 0;
            if (!hasActualElements) {
                createMetricToggles();
            }
            
            // Try to load data from Mode Analytics
            if (typeof datasets !== 'undefined') {
                loadModeData();
            } else {
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

    // Function to load data from Mode Analytics
    function loadModeData() {
        console.log('Loading data from Mode Analytics...');
        
        try {
            if (typeof datasets !== 'undefined') {
                console.log('Found datasets object');
                console.log('Available datasets:', Object.keys(datasets));
                
                // Target the specific Non Paid Visit Stats query dataset
                const targetQueryName = 'Non Paid Visit Stats';
                let targetDataset = null;
                let datasetName = null;
                
                console.log('Looking for specific query:', targetQueryName);
                
                if (datasets[targetQueryName]) {
                    console.log('Found target query dataset:', targetQueryName);
                    targetDataset = datasets[targetQueryName];
                    datasetName = targetQueryName;
                } else {
                    console.warn('Target query not found, available queries:', Object.keys(datasets));
                    // Fallback to index 2 (assuming this is the third chart)
                    if (datasets[2]) {
                        console.log('Fallback: Using datasets[2]');
                        targetDataset = datasets[2];
                        datasetName = 'datasets[2] (fallback)';
                    } else {
                        console.error('No datasets available at index 2');
                    }
                }
                
                if (targetDataset) {
                    console.log(`Using dataset: ${datasetName}`);
                    
                    // Extract data from the dataset
                    rawData = targetDataset.content || targetDataset || [];
                    
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

    // Poll for Mode data if not immediately available
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
            }
        }
        
        checkForModeData();
    }

    // Process raw data into chart-friendly format
    function processData() {
        console.log('Processing data...');
        
        if (!rawData || rawData.length === 0) {
            console.warn('No data to process');
            return;
        }
        
        // Group data by day
        const dailyData = {};
        
        rawData.forEach((row, index) => {
            const date = row.date || row.day || row['date'];
            const nonpaidVisitsPct = parseFloat(row.nonpaid_visits_pct || 0);
            const psaVisitsPct = parseFloat(row.psa_visits_pct || 0);
            
            if (!date) return;
            
            if (!dailyData[date]) {
                dailyData[date] = {
                    nonpaid_visits_pct: 0,
                    psa_visits_pct: 0,
                    count: 0
                };
            }
            
            dailyData[date].nonpaid_visits_pct += nonpaidVisitsPct;
            dailyData[date].psa_visits_pct += psaVisitsPct;
            dailyData[date].count += 1;
        });
        
        // Convert to arrays sorted by date and calculate averages
        const sortedDays = Object.keys(dailyData).sort();
        
        // Filter by time range
        const filteredDays = filterDaysByTimeRange(sortedDays);
        
        processedData = {
            labels: filteredDays,
            nonpaid_visits_pct: filteredDays.map(day => 
                dailyData[day].count > 0 ? dailyData[day].nonpaid_visits_pct / dailyData[day].count : 0
            ),
            psa_visits_pct: filteredDays.map(day => 
                dailyData[day].count > 0 ? dailyData[day].psa_visits_pct / dailyData[day].count : 0
            )
        };
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

    // Initialize the chart
    function initializeChart() {
        console.log('Initializing chart...');
        
        if (typeof Chart === 'undefined') {
            console.error('Chart.js not available!');
            return;
        }
        
        const canvas = document.getElementById('nonPaidVisitStatsChart');
        if (!canvas) {
            console.error('Canvas not found!');
            return;
        }
        
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
                        text: 'Non Paid Visit Stats'
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
                            text: 'Percentage'
                        },
                        min: 0,
                        max: 0.05,
                        ticks: {
                            callback: function(value) {
                                return (value * 100).toFixed(2) + '%';
                            }
                        }
                    }
                }
            }
        });
        
        console.log('Chart created successfully');
    }

    // Create metric toggles
    function createMetricToggles() {
        const togglesContainer = document.querySelector('.non-paid-visit-stats-toggles');
        if (!togglesContainer) return;
        
        togglesContainer.innerHTML = '';
        
        // Create select all / deselect all buttons
        const metricsHeader = document.querySelector('.non-paid-visit-stats-metrics-title');
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
            
            metricsHeader.parentNode.insertBefore(buttonsContainer, togglesContainer);
        }
        
        METRICS.forEach(metric => {
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
                if (e.target === checkbox) return;
                e.preventDefault();
                e.stopPropagation();
                checkbox.click();
            });
            
            const checkbox = toggleDiv.querySelector('.metric-checkbox');
            checkbox.addEventListener('change', function() {
                toggleMetric(metric.id);
            });
            
            togglesContainer.appendChild(toggleDiv);
        });
    }

    // Update chart with current data
    function updateChart() {
        if (!chart) return;
        
        if (!processedData || !processedData.labels) {
            console.warn('No processed data available for chart update');
            return;
        }
        
        const datasets = createDatasets();
        
        chart.data.labels = processedData.labels;
        chart.data.datasets = datasets;
        
        chart.update('active');
    }

    function createDatasets() {
        const datasets = [];
        
        METRICS.forEach(metric => {
            if (!metric.visible) return;
            
            const metricData = processedData[metric.id] || [];
            
            const dataset = {
                label: metric.name,
                data: metricData,
                borderColor: metric.color,
                backgroundColor: metric.backgroundColor,
                borderWidth: 2,
                type: metric.type,
                yAxisID: metric.yAxisID,
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
        const metric = METRICS.find(m => m.id === metricId);
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
        METRICS.forEach(metric => {
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
        METRICS.forEach(metric => {
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
        const controlButtons = document.querySelectorAll('.non-paid-visit-stats-controls .control-btn');
        controlButtons.forEach(btn => {
            btn.classList.remove('active');
            // Add active class to the button that matches the timeRange
            if (btn.textContent.trim() === timeRange || 
                (timeRange === 'ALL' && btn.textContent.trim() === 'All')) {
                btn.classList.add('active');
            }
        });
        
        processData();
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
        const controlButtons = document.querySelectorAll('.non-paid-visit-stats-controls .control-btn');
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

    // Export functions for Mode Analytics usage
    window.NonPaidVisitStatsChart = {
        loadData: loadModeData,
        switchTimeRange: switchTimeRange,
        toggleZoom: toggleZoom,
        resetZoom: resetZoom,
        toggleMetric: toggleMetric,
        selectAll: selectAllMetrics,
        deselectAll: deselectAllMetrics,
        getChart: () => chart,
        getMetrics: () => METRICS,
        getCurrentData: () => processedData
    };

    console.log('Non Paid Visit Stats Chart initialized successfully!');

})(); // End IIFE
