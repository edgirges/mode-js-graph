// Budget vs Spend Performance Chart
// Handles data from "daily bw budget v spend spend pct.sql"

// Global variables
let chart;
let rawData = [];
let processedData = {};
let currentTimeRange = '7D';
let isZoomEnabled = false;

// Define the three metrics for this specific chart
const METRICS = [
    {
        id: 'budget',
        name: 'Budget',
        color: '#007bff',
        backgroundColor: 'rgba(0, 123, 255, 0.8)',
        visible: true,
        type: 'bar',
        yAxisID: 'y',
        order: 1
    },
    {
        id: 'spend',
        name: 'Spend',
        color: '#28a745',
        backgroundColor: 'rgba(40, 167, 69, 0.8)',
        visible: true,
        type: 'bar',
        yAxisID: 'y',
        order: 2
    },
    {
        id: 'spend_pct',
        name: 'Spend %',
        color: '#ffc107',
        backgroundColor: 'rgba(255, 193, 7, 0.1)',
        visible: true,
        type: 'line',
        yAxisID: 'y1',
        order: 3
    }
];

// Initialize the chart when the page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('Budget vs Spend Chart initializing...');
    
    setTimeout(() => {
        initializeChart();
        createMetricToggles();
        
        // Try to load data from Mode Analytics if available
        if (typeof mode !== 'undefined' && mode.datasets) {
            loadModeData();
        }
    }, 100);
});

// For Mode Analytics - polling mechanism to ensure initialization
let initAttempts = 0;
const maxAttempts = 10;

function attemptInitialization() {
    initAttempts++;
    console.log(`Initialization attempt ${initAttempts}/${maxAttempts}`);
    
    const canvas = document.getElementById('budgetSpendChart');
    const togglesContainer = document.querySelector('.metric-toggles');
    
    if (canvas && togglesContainer && typeof Chart !== 'undefined') {
        console.log('All elements found, initializing...');
        if (!chart) {
            initializeChart();
        }
        
        if (!togglesContainer.hasChildNodes()) {
            console.log('Creating metric toggles...');
            createMetricToggles();
        }
        
        // Try to load data from Mode Analytics
        if (typeof mode !== 'undefined' && mode.datasets) {
            loadModeData();
        } else {
            // Start polling for Mode data
            pollForModeData();
        }
        return;
    }
    
    if (initAttempts < maxAttempts) {
        setTimeout(attemptInitialization, 500);
    } else {
        console.error('Max initialization attempts reached');
    }
}

// Start polling after a short delay
setTimeout(attemptInitialization, 200);

// Function to load data from Mode Analytics
function loadModeData() {
    console.log('Loading data from Mode Analytics...');
    
    // Debug: Check what's actually available
    console.log('Mode object:', typeof mode !== 'undefined' ? mode : 'undefined');
    console.log('Mode datasets:', typeof mode !== 'undefined' && mode.datasets ? mode.datasets : 'undefined');
    
    try {
        // Mode Analytics typically provides data in mode.datasets
        if (mode && mode.datasets && mode.datasets.length > 0) {
            console.log('Found', mode.datasets.length, 'datasets');
            
            // Debug: Log dataset structure
            mode.datasets.forEach((dataset, index) => {
                console.log(`Dataset ${index}:`, dataset);
                console.log(`Dataset ${index} data:`, dataset.data || 'no data property');
            });
            
            const dataset = mode.datasets[0]; // First dataset
            rawData = dataset.data || [];
            console.log('Mode data loaded:', rawData.length, 'rows');
            
            // Debug: Log first few rows
            if (rawData.length > 0) {
                console.log('First 3 rows:', rawData.slice(0, 3));
            }
            
            processData();
            updateChart();
        } else {
            console.warn('No datasets found in Mode Analytics');
            console.log('Mode available:', typeof mode !== 'undefined');
            console.log('Mode.datasets available:', typeof mode !== 'undefined' && mode.datasets);
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
        console.log(`Polling for Mode data - attempt ${pollAttempts}/${maxPollAttempts}`);
        
        // Check various ways Mode might provide data
        if (typeof mode !== 'undefined') {
            console.log('Mode object found, checking for datasets...');
            
            // Method 1: Standard mode.datasets
            if (mode.datasets && mode.datasets.length > 0) {
                console.log('Found datasets via mode.datasets');
                loadModeData();
                return;
            }
            
            // Method 2: Check for queries
            if (mode.queries && Object.keys(mode.queries).length > 0) {
                console.log('Found queries via mode.queries');
                loadModeDataFromQueries();
                return;
            }
            
            // Method 3: Check for query results
            if (mode.query && mode.query.results) {
                console.log('Found results via mode.query.results');
                loadModeDataFromQuery();
                return;
            }
            
            console.log('Mode object exists but no data found yet');
        }
        
        if (pollAttempts < maxPollAttempts) {
            setTimeout(checkForModeData, 1000);
        } else {
            console.error('Max polling attempts reached - no Mode data found');
        }
    }
    
    checkForModeData();
}

// Alternative method to load data from Mode queries
function loadModeDataFromQueries() {
    console.log('Loading data from Mode queries...');
    
    try {
        const queryKeys = Object.keys(mode.queries);
        console.log('Available queries:', queryKeys);
        
        // Try to find the budget query
        const budgetQuery = queryKeys.find(key => 
            key.toLowerCase().includes('budget') || 
            key.toLowerCase().includes('spend') ||
            key.toLowerCase().includes('daily')
        );
        
        if (budgetQuery) {
            console.log('Found budget query:', budgetQuery);
            const queryData = mode.queries[budgetQuery];
            if (queryData && queryData.results) {
                rawData = queryData.results;
                console.log('Mode query data loaded:', rawData.length, 'rows');
                
                if (rawData.length > 0) {
                    console.log('First 3 rows from query:', rawData.slice(0, 3));
                }
                
                processData();
                updateChart();
            }
        } else {
            // Use first available query
            const firstQuery = queryKeys[0];
            if (firstQuery) {
                console.log('Using first available query:', firstQuery);
                const queryData = mode.queries[firstQuery];
                if (queryData && queryData.results) {
                    rawData = queryData.results;
                    console.log('Mode query data loaded:', rawData.length, 'rows');
                    processData();
                    updateChart();
                }
            }
        }
    } catch (error) {
        console.error('Error loading Mode data from queries:', error);
    }
}

// Alternative method to load data from Mode query
function loadModeDataFromQuery() {
    console.log('Loading data from Mode query...');
    
    try {
        if (mode.query && mode.query.results) {
            rawData = mode.query.results;
            console.log('Mode query data loaded:', rawData.length, 'rows');
            
            if (rawData.length > 0) {
                console.log('First 3 rows from query:', rawData.slice(0, 3));
            }
            
            processData();
            updateChart();
        }
    } catch (error) {
        console.error('Error loading Mode data from query:', error);
    }
}

// Process raw data into chart-friendly format
function processData() {
    console.log('Processing data...');
    
    if (!rawData || rawData.length === 0) {
        console.warn('No data to process');
        return;
    }
    
    // Group data by day and aggregate
    const dailyData = {};
    
    rawData.forEach(row => {
        const day = row.day;
        if (!dailyData[day]) {
            dailyData[day] = {
                budget: 0,
                spend: 0,
                spend_pct_sum: 0,
                count: 0
            };
        }
        
        dailyData[day].budget += parseFloat(row.budget || 0);
        dailyData[day].spend += parseFloat(row.spend || 0);
        dailyData[day].spend_pct_sum += parseFloat(row["spend pct"] || 0);
        dailyData[day].count += 1;
    });
    
    // Convert to arrays sorted by date
    const sortedDays = Object.keys(dailyData).sort();
    
    processedData = {
        labels: sortedDays,
        budget: sortedDays.map(day => dailyData[day].budget),
        spend: sortedDays.map(day => dailyData[day].spend),
        spend_pct: sortedDays.map(day => dailyData[day].spend_pct_sum / dailyData[day].count)
    };
    
    console.log('Data processed:', processedData.labels.length, 'days');
}

// Filter data based on time range
function getFilteredData() {
    if (!processedData.labels) return processedData;
    
    const now = new Date();
    let startDate;
    
    switch (currentTimeRange) {
        case '7D':
            startDate = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
            break;
        case '30D':
            startDate = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
            break;
        case '90D':
            startDate = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000));
            break;
        case 'ALL':
        default:
            return processedData;
    }
    
    const startDateStr = startDate.toISOString().split('T')[0];
    const startIndex = processedData.labels.findIndex(date => date >= startDateStr);
    
    if (startIndex === -1) return processedData;
    
    return {
        labels: processedData.labels.slice(startIndex),
        budget: processedData.budget.slice(startIndex),
        spend: processedData.spend.slice(startIndex),
        spend_pct: processedData.spend_pct.slice(startIndex)
    };
}

// Create datasets for Chart.js
function createChartDatasets() {
    const filteredData = getFilteredData();
    
    return METRICS.map(metric => {
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

// Initialize the chart
function initializeChart() {
    console.log('Initializing chart...');
    
    // Check if Chart.js is available
    if (typeof Chart === 'undefined') {
        console.error('Chart.js not available!');
        return;
    }
    
    // Check if canvas element exists
    const canvas = document.getElementById('budgetSpendChart');
    if (!canvas) {
        console.error('Canvas element not found!');
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
    
    // Chart configuration
    const config = {
        type: 'bar', // Mixed chart with bar as base type
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
                    display: false // We'll use custom toggles instead
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
                            if (context.dataset.label === 'Spend %') {
                                return `${context.dataset.label}: ${(value * 100).toFixed(1)}%`;
                            } else {
                                return `${context.dataset.label}: $${value.toLocaleString()}`;
                            }
                        }
                    }
                },
                ...(typeof ChartZoom !== 'undefined' ? {
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
                } : {})
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
                        text: 'Spend Percentage'
                    },
                    grid: {
                        drawOnChartArea: false,
                    },
                    ticks: {
                        callback: function(value) {
                            return (value * 100).toFixed(0) + '%';
                        }
                    }
                }
            },
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
    
    // Add resize listener for responsiveness
    window.addEventListener('resize', function() {
        if (chart) {
            chart.resize();
        }
    });
}

// Update chart with current data
function updateChart() {
    if (!chart) return;
    
    const filteredData = getFilteredData();
    const datasets = createChartDatasets();
    
    chart.data.labels = filteredData.labels;
    chart.data.datasets = datasets;
    
    // Update y-axis visibility based on active metrics
    const hasBarMetrics = METRICS.filter(m => m.type === 'bar' && m.visible).length > 0;
    const hasLineMetrics = METRICS.filter(m => m.type === 'line' && m.visible).length > 0;
    
    chart.options.scales.y.display = hasBarMetrics;
    chart.options.scales.y1.display = hasLineMetrics;
    
    chart.update('active');
}

// Create metric toggle controls
function createMetricToggles() {
    const togglesContainer = document.querySelector('.metric-toggles');
    if (!togglesContainer) return;
    
    togglesContainer.innerHTML = '';
    
    // Add select/deselect all buttons
    const metricsHeader = document.querySelector('.metric-controls-title');
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
        buttonsContainer.appendChild(selectAllBtn);
        buttonsContainer.appendChild(deselectAllBtn);
        
        // Insert after the title
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
            if (e.target.type !== 'checkbox') {
                const checkbox = toggleDiv.querySelector('.metric-checkbox');
                checkbox.checked = !checkbox.checked;
            }
            toggleMetric(metric.id);
        });
        
        togglesContainer.appendChild(toggleDiv);
    });
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

// Utility function to update chart with new data (for Mode Analytics integration)
function updateChartData(newData) {
    if (newData) {
        rawData = newData;
        processData();
        updateChart();
    }
}

// Export functions for Mode Analytics usage
window.BudgetSpendChart = {
    loadData: loadModeData,
    updateData: updateChartData,
    switchTimeRange: switchTimeRange,
    toggleZoom: toggleZoom,
    resetZoom: resetZoom,
    toggleMetric: toggleMetric,
    selectAll: selectAllMetrics,
    deselectAll: deselectAllMetrics,
    getChart: () => chart,
    getMetrics: () => METRICS,
    getCurrentData: () => processedData,
    debug: () => {
        console.log('=== DEBUG INFO ===');
        console.log('Chart exists:', !!chart);
        console.log('Canvas exists:', !!document.getElementById('budgetSpendChart'));
        console.log('Mode available:', typeof mode !== 'undefined');
        
        if (typeof mode !== 'undefined') {
            console.log('Mode object:', mode);
            console.log('Mode.datasets:', mode.datasets);
            console.log('Mode.queries:', mode.queries);
            console.log('Mode.query:', mode.query);
        }
        
        console.log('Raw data length:', rawData.length);
        console.log('Processed data:', processedData);
        console.log('Current time range:', currentTimeRange);
        console.log('METRICS:', METRICS);
    },
    forceLoad: () => {
        console.log('Force loading Mode data...');
        pollForModeData();
    }
};

console.log('Budget vs Spend Chart initialized successfully!');
