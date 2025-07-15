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
        id: 'spend',
        name: 'Spend',
        color: '#007bff',
        backgroundColor: 'rgba(0, 123, 255, 0.8)',
        visible: true,
        type: 'bar',
        yAxisID: 'y',
        order: 1
    },
    {
        id: 'budget',
        name: 'Budget',
        color: '#28a745',
        backgroundColor: 'rgba(40, 167, 69, 0.8)',
        visible: true,
        type: 'bar',
        yAxisID: 'y',
        order: 2
    },
    {
        id: 'spend_pct',
        name: 'Avg. Spend %',
        color: '#ffc107',
        backgroundColor: 'rgba(255, 193, 7, 0.1)',
        visible: true,
        type: 'line',
        yAxisID: 'y1',
        order: 0
    }
];

// Initialize the chart when the page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== DOMContentLoaded fired ===');
    console.log('Document ready state:', document.readyState);
    console.log('Available elements at DOMContentLoaded:');
    console.log('- Canvas:', !!document.getElementById('budgetSpendChart'));
    console.log('- Metric toggles container:', !!document.querySelector('.metric-toggles'));
    console.log('- Metric controls container:', !!document.querySelector('.metric-controls'));
    console.log('- Chart.js available:', typeof Chart !== 'undefined');
    
    setTimeout(() => {
        console.log('=== Delayed initialization (100ms) ===');
        console.log('- Canvas:', !!document.getElementById('budgetSpendChart'));
        console.log('- Metric toggles container:', !!document.querySelector('.metric-toggles'));
        console.log('- Chart.js available:', typeof Chart !== 'undefined');
        
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
    console.log(`=== Initialization attempt ${initAttempts}/${maxAttempts} ===`);
    
    const canvas = document.getElementById('budgetSpendChart');
    const togglesContainer = document.querySelector('.metric-toggles');
    const metricsContainer = document.querySelector('.metric-controls');
    
    console.log('Element status in attemptInitialization:');
    console.log('- Canvas:', !!canvas);
    console.log('- Toggles container:', !!togglesContainer);
    console.log('- Metrics container:', !!metricsContainer);
    console.log('- Chart.js available:', typeof Chart !== 'undefined');
    console.log('- Current chart exists:', !!chart);
    
    if (togglesContainer) {
        console.log('- Toggles container has children:', togglesContainer.hasChildNodes());
        console.log('- Toggles container innerHTML:', togglesContainer.innerHTML);
    }
    
    if (canvas && togglesContainer && typeof Chart !== 'undefined') {
        console.log('✅ All elements found, proceeding with initialization...');
        if (!chart) {
            console.log('Creating chart...');
            initializeChart();
        }
        
        // Check for actual HTML elements, not comments or text nodes
        const hasActualElements = togglesContainer.children.length > 0;
        if (!hasActualElements) {
            console.log('Creating metric toggles via attemptInitialization...');
            createMetricToggles();
        } else {
            console.log('Toggles container already has actual elements, skipping toggle creation');
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
    console.log('Datasets object:', typeof datasets !== 'undefined' ? datasets : 'undefined');
    
    try {
        // Mode Analytics provides data via global datasets object
        if (typeof datasets !== 'undefined') {
            console.log('Found datasets object');
            
            // Debug: Log available datasets
            console.log('Available datasets:', Object.keys(datasets));
            
            // Target the specific budget query dataset
            const targetQueryName = 'Daily BW Budget vs Spend (channel filter does not apply)';
            let targetDataset = null;
            let datasetName = null;
            
            console.log('Looking for specific query:', targetQueryName);
            
            if (datasets[targetQueryName]) {
                console.log('Found target query dataset:', targetQueryName);
                targetDataset = datasets[targetQueryName];
                datasetName = targetQueryName;
            } else {
                console.warn('Target query not found, available queries:', Object.keys(datasets));
                // Fallback to index 0 as specified
                if (datasets[0]) {
                    console.log('Fallback: Using datasets[0]');
                    targetDataset = datasets[0];
                    datasetName = 'datasets[0] (fallback)';
                } else {
                    console.error('No datasets available at all');
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

// Poll for Mode data if not immediately available
function pollForModeData() {
    let pollAttempts = 0;
    const maxPollAttempts = 20;
    
    function checkForModeData() {
        pollAttempts++;
        console.log(`Polling for Mode data - attempt ${pollAttempts}/${maxPollAttempts}`);
        
        // Check if datasets object is available
        if (typeof datasets !== 'undefined') {
            console.log('Datasets object found!');
            loadModeData();
            return;
        }
        
        console.log('Datasets object not yet available...');
        
        if (pollAttempts < maxPollAttempts) {
            setTimeout(checkForModeData, 1000);
        } else {
            console.error('Max polling attempts reached - no Mode datasets found');
            console.log('Please check that your SQL query is running and named properly');
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
    
    console.log('Raw data type:', typeof rawData);
    console.log('Raw data is array:', Array.isArray(rawData));
    console.log('Raw data sample:', rawData.slice(0, 2));
    
    // Group data by day and aggregate
    const dailyData = {};
    
    try {
        rawData.forEach((row, index) => {
            if (index < 3) {
                console.log(`Row ${index} structure:`, row);
                console.log(`Row ${index} keys:`, Object.keys(row));
                console.log(`Row ${index} raw values:`, {
                    day: row.day,
                    budget: row.budget,
                    spend: row.spend,
                    spend_pct: row["spend pct"]
                });
            }
            
            const budget = parseFloat(row.budget || 0);
            const spend = parseFloat(row.spend || 0);
            const spend_pct = parseFloat(row["spend pct"] || 0);
            
            // Skip rows with zero budget or invalid spend_pct (matching Mode Analytics filtering)
            if (budget <= 0 || isNaN(spend_pct) || row["spend pct"] === "" || row["spend pct"] == null) {
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
            
            if (index < 5) {
                console.log(`Row ${index} - Day: ${day}, Budget: ${budget}, Spend: ${spend}, Running totals - Budget: ${dailyData[day].budget}, Spend: ${dailyData[day].spend}, Count: ${dailyData[day].count}`);
            }
        });
        
        console.log('Sample daily aggregated data:');
        Object.entries(dailyData).slice(0, 3).forEach(([day, data]) => {
            console.log(`${day}: Budget=${data.budget}, Spend=${data.spend}, Count=${data.count} campaign groups`);
        });
        
        // Check if we're over-aggregating
        const totalCampaignGroups = Object.values(dailyData).reduce((sum, day) => sum + day.count, 0);
        console.log(`Total campaign group records: ${totalCampaignGroups} across ${Object.keys(dailyData).length} days`);
        console.log(`Average campaign groups per day: ${totalCampaignGroups / Object.keys(dailyData).length}`);
        
        // Show comparison with Mode chart expectation
        const firstDay = Object.keys(dailyData)[0];
        if (firstDay) {
            const firstDayData = dailyData[firstDay];
            console.log(`First day (${firstDay}): Our values - Budget=${firstDayData.budget}, Spend=${firstDayData.spend}`);
            console.log(`Mode chart shows: Budget=648k, Spend=584k`);
            console.log(`Our values are ${(firstDayData.budget/648000).toFixed(1)}x larger for budget, ${(firstDayData.spend/584000).toFixed(1)}x larger for spend`);
        }
        
    } catch (error) {
        console.error('Error processing raw data:', error);
        console.log('Raw data structure:', rawData);
        return;
    }
    
    // Convert to arrays sorted by date
    const sortedDays = Object.keys(dailyData).sort();
    
    processedData = {
        labels: sortedDays,
        budget: sortedDays.map(day => Math.max(0, dailyData[day].budget - dailyData[day].spend)), // Remaining budget, minimum 0
        spend: sortedDays.map(day => dailyData[day].spend),
        spend_pct: sortedDays.map(day => {
            return dailyData[day].count > 0 ? dailyData[day].spend_pct_sum / dailyData[day].count : 0;
        }) // Average of individual campaign group spend percentages (matching Mode's "average and continuous")
    };
    
    console.log('Data processed:', processedData.labels.length, 'days');
    console.log('Expected from Mode chart: total budget ~648k, spend ~584k');
    console.log('Our processed values - Budget shows remaining budget (stacked on top of spend):');
    processedData.labels.slice(0, 5).forEach((day, index) => {
        const remainingBudget = processedData.budget[index];
        const spend = processedData.spend[index];
        const totalBudget = remainingBudget + spend;
        console.log(`${day}: Remaining Budget=${remainingBudget}, Spend=${spend}, Total Budget=${totalBudget}, Spend%=${processedData.spend_pct[index]}`);
    });
    console.log('Remaining Budget range:', Math.min(...processedData.budget), 'to', Math.max(...processedData.budget));
    console.log('Spend range:', Math.min(...processedData.spend), 'to', Math.max(...processedData.spend));
    console.log('Total Budget range:', Math.min(...processedData.budget.map((b, i) => b + processedData.spend[i])), 'to', Math.max(...processedData.budget.map((b, i) => b + processedData.spend[i])));
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
                                return `${context.dataset.label}: ${value.toFixed(3)}`;
                            } else if (context.dataset.label === 'Budget') {
                                // For budget, show total budget (remaining + spend)
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
                        // Auto-scale y1 axis based on spend percentage data range
                        const datasets = scale.chart.data.datasets;
                        const spendPctDataset = datasets.find(d => d.label === 'Avg. Spend %');
                        
                        if (spendPctDataset && spendPctDataset.data && spendPctDataset.data.length > 0) {
                            const values = spendPctDataset.data.filter(v => v != null && !isNaN(v));
                            if (values.length > 0) {
                                const min = Math.min(...values);
                                const max = Math.max(...values);
                                const range = max - min;
                                const padding = range * 0.05; // 5% padding
                                
                                scale.min = Math.max(0, min - padding);
                                scale.max = Math.min(1, max + padding);
                            }
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
    console.log('=== Creating metric toggles ===');
    console.log('Document state:', document.readyState);
    console.log('Body exists:', !!document.body);
    console.log('Head exists:', !!document.head);
    
    // Debug: Log all available elements
    console.log('All elements with class containing "metric":', document.querySelectorAll('[class*="metric"]'));
    console.log('Available divs:', document.querySelectorAll('div').length);
    console.log('Document HTML preview:', document.documentElement.outerHTML.substring(0, 500) + '...');
    
    const togglesContainer = document.querySelector('.metric-toggles');
    const metricsContainer = document.querySelector('.metric-controls');
    
    console.log('Container search results:');
    console.log('- .metric-toggles found:', !!togglesContainer);
    console.log('- .metric-controls found:', !!metricsContainer);
    
    if (!togglesContainer) {
        console.error('❌ Metric toggles container (.metric-toggles) not found!');
        console.log('Available classes in document:');
        const allElements = document.querySelectorAll('*');
        const classes = new Set();
        allElements.forEach(el => {
            if (el.className) {
                el.className.split(' ').forEach(cls => classes.add(cls));
            }
        });
        console.log('All classes found:', Array.from(classes).sort());
        return;
    }
    
    console.log('✅ Found toggles container:', togglesContainer);
    console.log('Container parent:', togglesContainer.parentElement);
    console.log('Container existing innerHTML:', togglesContainer.innerHTML);
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
        buttonsContainer.style.marginBottom = '15px'; // Add spacing between buttons and toggles
        buttonsContainer.appendChild(selectAllBtn);
        buttonsContainer.appendChild(deselectAllBtn);
        
        // Insert after the title
        metricsHeader.parentNode.insertBefore(buttonsContainer, togglesContainer);
        console.log('Created select/deselect buttons');
    }
    
    console.log('Creating toggles for metrics:', METRICS.map(m => m.name));
    
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
            // Prevent default behavior for checkboxes to avoid double-toggling
            if (e.target.type === 'checkbox') {
                e.preventDefault();
            }
            
            // Always toggle the metric state directly
            const checkbox = toggleDiv.querySelector('.metric-checkbox');
            
            // Toggle the METRICS array state
            metric.visible = !metric.visible;
            
            // Update checkbox to match metric state
            checkbox.checked = metric.visible;
            
            // Update visual state
            if (metric.visible) {
                toggleDiv.classList.add('active');
            } else {
                toggleDiv.classList.remove('active');
            }
            
            // Update the chart
            updateChart();
        });
        
        togglesContainer.appendChild(toggleDiv);
        console.log('Created toggle for:', metric.name);
    });
    
    console.log('Metric toggles creation complete');
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
        console.log('Datasets available:', typeof datasets !== 'undefined');
        
        if (typeof datasets !== 'undefined') {
            console.log('Datasets object:', datasets);
            console.log('Available dataset names:', Object.keys(datasets));
            
            // Show each dataset structure
            Object.keys(datasets).forEach(name => {
                console.log(`Dataset "${name}":`, datasets[name]);
                if (datasets[name] && datasets[name].length > 0) {
                    console.log(`First row of "${name}":`, datasets[name][0]);
                }
            });
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