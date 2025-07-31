# Shared Chart Library Architecture

## Overview

This folder contains the new **shared library architecture** for Mode Analytics dashboard charts. The goal is to eliminate code duplication by extracting common functionality into a single shared library file.

## Architecture

### Files Structure

```
all-accounts-performance2/
├── shared-chart-library.js   # Contains ALL shared functionality
├── individual-charts/         # Individual chart files (to be created)
│   ├── budget-vs-spend.js    # Chart-specific logic only
│   ├── spend-categories.js   # Chart-specific logic only
│   └── ...                   # Other chart files
└── README.md                 # This documentation
```

### Benefits

- **Reduced File Sizes**: Individual chart files become much smaller
- **Less Upload Load**: Shared code uploaded once instead of duplicated 10+ times
- **Better Maintainability**: Bug fixes and improvements in one place
- **Consistent Behavior**: All charts use same underlying functions

## What's in the Shared Library

### Core Utilities

- `getMetricsFromDataset()` - Extract metrics from Mode datasets
- `findDatasetByQueryName()` - Reliable dataset lookup by query name
- `loadDatasetContent()` - Standard dataset loading with fallbacks

### Initialization Patterns

- `createStandardInit()` - Standard chart initialization
- `createStandardAttemptInit()` - Retry logic for Mode Analytics
- `setupStandardInitialization()` - DOM ready handlers

### UI Controls

- `createStandardMetricToggles()` - Metric visibility toggles with select/deselect all
- `createStandardToggleMetric()` - Metric toggle functionality
- `selectAllMetrics()` / `deselectAllMetrics()` - Bulk selection

### Time Range & Filtering

- `createStandardSwitchTimeRange()` - Time range button handlers
- `filterByTimeRange()` - Data filtering by time periods

### Zoom Controls

- `createStandardToggleZoom()` - Zoom toggle functionality
- `createStandardResetZoom()` - Zoom reset functionality

### Chart Configuration Helpers

- `registerStandardPlugins()` - Chart.js plugin registration
- `getStandardTooltipConfig()` - Standard tooltip configuration
- `getStandardTimeScale()` - Time axis configuration with date adapters
- `getStandardZoomConfig()` - Zoom plugin configuration

### Export & Utilities

- `createStandardExport()` - Standard window object exports
- `findDateColumn()` - Find date columns in data
- `normalizeDate()` - Consistent date formatting

## How Individual Charts Will Use It

### Example Structure (Individual Chart File)

```javascript
(function () {
  "use strict";

  // Access shared library
  const lib = window.ChartLibrary;

  // Chart-specific configuration
  const CONFIG = {
    chartTitle: "My Chart",
    datasetName: "My Query Name",
    fallbackIndex: 0,
    // ... other chart-specific config
  };

  // Chart-specific data processing
  function processData() {
    // Unique logic for this chart
  }

  // Chart-specific metric creation
  function createDynamicMetrics(availableMetrics) {
    // Unique metric definitions for this chart
  }

  // Chart-specific Chart.js setup
  function createChart() {
    // Use lib.getStandardTooltipConfig(), lib.getStandardTimeScale(), etc.
  }

  // Use shared functions
  const init = lib.createStandardInit(
    "myChartCanvas",
    ".my-chart-toggles",
    createChart,
    loadData
  );

  const attemptInit = lib.createStandardAttemptInit(init);

  // Export using shared pattern
  lib.createStandardExport("MyChart", {
    loadData,
    switchTimeRange: lib.createStandardSwitchTimeRange(/* ... */),
    toggleZoom: lib.createStandardToggleZoom(/* ... */),
    // ... other functions
  });

  // Use shared initialization
  lib.setupStandardInitialization(attemptInit);
})();
```

### What Stays Chart-Specific

1. **CONFIG objects** - Unique per chart (titles, dataset names, metrics)
2. **processData()** - Data processing logic varies significantly between charts
3. **createDynamicMetrics()** - Metric definitions and colors specific to each chart
4. **createChart()** - Chart.js configuration unique to each chart type
5. **createDatasets()** - Dataset creation specific to chart type (bar, line, etc.)

### What Gets Shared

- All initialization, retry, and polling logic
- All UI control creation and event handling
- All time range and zoom functionality
- All standard Chart.js configurations
- All dataset loading and metric extraction
- All export patterns and DOM ready handlers

## Implementation Benefits

### Before (Current)

```
budget-vs-spend.js:     30KB (795 lines)
spend-categories.js:    22KB (688 lines)
non-paid-stats.js:      24KB (693 lines)
pmp-area.js:           23KB (670 lines)
... 6 more charts ...
Total:                 ~200KB+ with massive duplication
```

### After (Proposed)

```
shared-chart-library.js: 25KB (562 lines) - uploaded once
budget-vs-spend.js:      ~8KB  (~150 lines) - chart-specific only
spend-categories.js:     ~6KB  (~120 lines) - chart-specific only
non-paid-stats.js:       ~7KB  (~130 lines) - chart-specific only
pmp-area.js:            ~6KB  (~120 lines) - chart-specific only
... 6 more charts ...
Total:                  ~85KB with zero duplication
```

**Result: ~60% reduction in total code size and upload load!**

## Next Steps

1. ✅ Create shared library (Done)
2. ⏳ Examine individual chart specifics
3. ⏳ Create individual chart files using shared library
4. ⏳ Test functionality equivalence
5. ⏳ Update Mode Analytics HTML to import shared library first
