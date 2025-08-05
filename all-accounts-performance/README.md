# Mode Analytics Dashboard - Shared Chart Library

## Overview

This repository contains a **shared library architecture** for Mode Analytics dashboard charts. All charts use a common shared library (`shared-chart-library.js`) with individual chart-specific files for unique functionality, eliminating code duplication and improving maintainability.

## Project Status: ✅ Complete & Production Ready

All 9 dashboard charts have been refactored to use the shared library architecture with a global custom date picker system.

## Architecture

### Files Structure

```
all-accounts-performance/
├── shared-chart-library.js              # Shared functionality (all common code)
├── budget-vs-spend.js                   # Budget vs Spend Performance chart
├── spend-categories.js                  # Daily BW Spend Categories chart
├── non-paid-visit-stats.js              # Non Paid Visit Stats chart
├── pmp-open-market-line.js              # PMP vs Open Market Line chart
├── performance-trends.js               # Performance Trends by Progressing Days
├── campaign-groups-30-days.js          # Campaign Groups (First 30 Days)
├── campaign-groups-month.js            # Campaign Groups (That Month)
├── overall-performance-trends.js       # Overall Performance Trends (Monthly)
├── raw-visits-conv.js                  # RAW Visits and Conv (Monthly)
└── README.md                           # This documentation
```

### mode.html Purpose

The `mode.html` file in this repository is **NOT used directly** in the project. It serves as:

- **Reference**: Current representation of the HTML code needed in the actual Mode report
- **Backup**: Safety copy in case HTML in the Mode report gets accidentally deleted
- **Documentation**: Shows how to properly connect these JavaScript files in Mode

**To use these charts**: Copy the HTML from `mode.html` into your Mode Analytics report's HTML panel.

## How It Works

### Shared Library (`shared-chart-library.js`)

Contains all common functionality used across charts:

#### Core Utilities

- `getMetricsFromDataset()` - Extract metrics from Mode datasets by query name
- `loadDatasetContent()` - Robust dataset loading with query name + index fallback
- `findDatasetByQueryName()` - Reliable dataset lookup independent of query order

#### UI Components

- `createStandardMetricToggles()` - Metric visibility controls with Select/Deselect All
- `registerWithCustomDatePicker()` - Global date picker integration
- `getStandardTimeScale()` - Chart.js time axis configuration
- `getStandardTooltipConfig()` - Consistent tooltip styling

#### HTML Generation

- `injectChartSmart()` - Auto-generates chart HTML (header, controls, canvas, metrics)
- `generateChartContentHTML()` - Creates complete chart UI structure

#### Initialization & Export

- `setupStandardInitialization()` - DOM ready handlers and retry logic
- `createStandardExport()` - Window object exports for Mode integration

### Individual Chart Files

Each chart file contains **only** chart-specific logic:

#### Chart-Specific Configuration

```javascript
const CONFIG = {
  chartTitle: "Budget vs Spend Performance",
  datasetName: "Daily BW Budget vs Spend (channel filter does not apply)",
  fallbackIndex: 0, // Backup if query name lookup fails
  displayMetrics: ["spend", "budget", "spend_pct"],
  canvasId: "budgetSpendChart",
  // ... other chart-specific settings
};
```

#### Chart-Specific Functions

- `createDynamicMetrics()` - Unique metric definitions and colors
- `processData()` - Data processing logic specific to each chart type
- `createChart()` - Chart.js configuration (chart type, axes, styling)
- `createDatasets()` - Dataset creation for specific chart requirements

## Key Features

### 🗓️ Global Custom Date Picker

- **Single date picker** at the top controls all charts simultaneously
- **Default**: Last 30 days of available data
- **Auto-sync**: All charts update when date range changes
- **No Mode dependencies**: Self-contained system

### 📊 Dynamic HTML Generation

- **Minimal HTML required**: Only container `<div>` tags needed in Mode
- **Auto-generated content**: Headers, controls, canvas, and metric toggles created by JavaScript
- **Smart positioning**: Container divs control chart order and layout

### 🔄 Robust Data Loading

- **Query name-based**: Charts find data by SQL query name, not index position
- **Index fallback**: Backup system if query names change
- **Independent of query order**: Queries can be reordered without breaking charts

## Important Maintenance Considerations

### ⚠️ Query Name Dependencies

Charts are configured to load data by **SQL query name**. If you change a query name in Mode, you must update the corresponding chart file:

```javascript
// In individual chart files - UPDATE THIS if query name changes
const CONFIG = {
  datasetName: "Daily BW Budget vs Spend (channel filter does not apply)", // Must match Mode query name exactly
  fallbackIndex: 0, // Backup - safe to change query order
};
```

**Safe to change**: Query order/position (only if the query names match)  
**Must update**: Query names (update `datasetName` in chart files)

### 🔧 How the Backup Index System Works

The chart loading follows this priority:

1. **Primary**: Search for query by `datasetName` (query name)
2. **Fallback**: If query name not found, use `fallbackIndex` (position-based)

**⚠️ Critical Warning**: If both the query name AND the index are wrong, the chart will load data from whatever query is at that index position, potentially displaying completely incorrect data.

**Example Scenario:**

```javascript
// Chart configured for "Budget vs Spend" data
const CONFIG = {
  datasetName: "Daily BW Budget vs Spend (channel filter does not apply)", // Query renamed in Mode
  fallbackIndex: 5, // Index now points to "Campaign Performance" query
};
// Result: Chart will load Campaign Performance data and display it as Budget vs Spend!
```

**Best Practice**: When updating query names in Mode, also verify the `fallbackIndex` points to the correct query position as a safety net.

### 🔧 Adding New Charts

To add a new chart:

1. **Create new chart file** following existing patterns
2. **Use shared library**: Access via `const lib = window.ChartLibrary;`
3. **Add to mode.html**: Include container div + script loading
4. **Configure unique IDs**: Ensure canvas IDs and selectors don't conflict

### 📝 Chart Configuration

Each chart requires unique:

- `canvasId` - Must be unique across all charts
- `containerClass` - CSS class for the HTML container
- `datasetName` - Must exactly match Mode query name
- `chartObject` - Global export name (e.g., `BudgetSpendChart`)

### **Approach: Container in HTML + Auto-Generated Content**

## Usage in Mode Analytics

1. **Copy HTML**: Use `mode.html` as template for your Mode report HTML panel
2. **Verify URLs**: Ensure GitHub URLs point to this repository
3. **Check query names**: Confirm `datasetName` in chart files match your Mode query names
4. **Test date picker**: Verify the custom date picker controls all charts

The system is designed to be resilient to Mode Analytics changes while providing a unified, maintainable codebase for complex dashboard visualizations. This code currently does not alter or touch Mode's native quick charts or its datepicker.
