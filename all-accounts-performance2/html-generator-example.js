// =============================================================================
// HTML Generator Extension for Shared Library (Optional Enhancement)
// =============================================================================

// This could be added to the shared library to auto-generate HTML structure

window.ChartLibrary.generateChartHTML = function(config) {
    const containerHTML = `
        <div class="chart-container ${config.containerClass}">
            <div class="chart-header ${config.headerClass}">
                <h2 class="chart-title ${config.titleClass}">${config.chartTitle}</h2>
                <div class="chart-controls ${config.controlsClass}">
                    <button class="control-btn" onclick="${config.chartObject}.switchTimeRange('7D')">7D</button>
                    <button class="control-btn" onclick="${config.chartObject}.switchTimeRange('30D')">30D</button>
                    <button class="control-btn active" onclick="${config.chartObject}.switchTimeRange('90D')">90D</button>
                    <button class="control-btn" onclick="${config.chartObject}.switchTimeRange('ALL')">All</button>
                    <button class="control-btn" onclick="${config.chartObject}.toggleZoom()">Zoom</button>
                    <button class="control-btn" onclick="${config.chartObject}.resetZoom()">Reset</button>
                </div>
            </div>
            <div class="chart-canvas ${config.canvasClass}">
                <canvas id="${config.canvasId}"></canvas>
            </div>
            <div class="metric-controls ${config.metricsClass}">
                <h3 class="metric-controls-title ${config.metricsHeaderClass}">Metrics</h3>
                <div class="metric-toggles ${config.togglesClass}">
                    <!-- Metric toggles will be dynamically generated -->
                </div>
            </div>
        </div>
    `;
    
    return containerHTML;
};

// Usage example for Budget vs Spend chart:
/*
const htmlConfig = {
    containerClass: 'budget-spend-container',
    headerClass: 'budget-spend-header', 
    titleClass: 'budget-spend-title',
    chartTitle: 'Daily BW Budget V. Spend / Spend Pct',
    controlsClass: 'budget-spend-controls',
    chartObject: 'BudgetSpendChart',
    canvasClass: 'budget-spend-canvas',
    canvasId: 'budgetSpendChart',
    metricsClass: 'budget-spend-metrics',
    metricsHeaderClass: 'budget-spend-metrics-title',
    togglesClass: 'budget-spend-toggles'
};

// Generate and inject HTML
document.body.innerHTML += ChartLibrary.generateChartHTML(htmlConfig);
*/ 