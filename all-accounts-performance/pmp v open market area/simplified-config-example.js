// =============================================================================
// SIMPLIFIED EXAMPLE: DIRECT METRIC EXTRACTION IN CHART CONFIG
// =============================================================================
// This shows how to grab metrics directly from dataset within CHART_CONFIG

(function() {
    'use strict';

    // =============================================================================
    // DIRECT METRIC EXTRACTION FUNCTION
    // =============================================================================
    function getMetricsFromDataset(datasetName, fallbackIndex = null) {
        console.log('=== DIRECT METRIC EXTRACTION ===');
        
        if (typeof datasets === 'undefined') {
            console.warn('datasets object not available yet');
            return [];
        }

        // Try to get the dataset
        let targetDataset = null;
        if (datasets[datasetName]) {
            targetDataset = datasets[datasetName];
            console.log(`Found dataset by name: "${datasetName}"`);
        } else if (fallbackIndex !== null && datasets[fallbackIndex]) {
            targetDataset = datasets[fallbackIndex];
            console.log(`Using fallback dataset at index: ${fallbackIndex}`);
        }

        if (!targetDataset) {
            console.error('No dataset found');
            return [];
        }

        // Extract data array
        const dataArray = targetDataset.content || targetDataset;
        if (!Array.isArray(dataArray) || dataArray.length === 0) {
            console.error('Dataset has no data');
            return [];
        }

        // Get column names
        const columns = Object.keys(dataArray[0]);
        console.log('Available columns:', columns);

        // Filter out date/time columns to get metrics
        const dateTimePattern = /^(date|day|time|created|updated|timestamp)$/i;
        const metrics = columns.filter(col => !dateTimePattern.test(col));
        
        console.log('Extracted metrics:', metrics);
        return metrics;
    }

    // =============================================================================
    // CHART CONFIGURATION WITH DIRECT METRIC EXTRACTION
    // =============================================================================

    const CHART_CONFIG = {
        // Chart basic settings
        chartTitle: 'PMP v Open Market Impressions and Spend',
        chartType: 'area',
        defaultTimeRange: '90D',
        
        // Mode Analytics integration
        modeDatasetName: 'PMP vs OpenMarket Imps and Spend (Obj filter does not apply)',
        fallbackDatasetIndex: 6,

        // Data Structure Definition
        dataStructure: {
            dateColumn: 'day',
            alternateDateColumns: ['day', 'date'],
            
            // DIRECT METRIC EXTRACTION - No pattern matching needed!
            getMetrics: function() {
                return getMetricsFromDataset(
                    CHART_CONFIG.modeDatasetName, 
                    CHART_CONFIG.fallbackDatasetIndex
                );
            },

            // Alternative: if you want to cache the metrics
            metrics: null, // Will be populated by loadMetrics()
            
            loadMetrics: function() {
                this.metrics = this.getMetrics();
                console.log('Loaded metrics into config:', this.metrics);
                return this.metrics;
            }
        }
    };

    // =============================================================================
    // INITIALIZATION AND TESTING
    // =============================================================================

    function initializeAndTest() {
        console.log('=== INITIALIZING CHART CONFIG ===');
        
        // Method 1: Get metrics directly
        console.log('Method 1 - Direct call:');
        const directMetrics = CHART_CONFIG.dataStructure.getMetrics();
        console.log('Direct metrics result:', directMetrics);

        // Method 2: Load and cache metrics
        console.log('Method 2 - Load and cache:');
        const cachedMetrics = CHART_CONFIG.dataStructure.loadMetrics();
        console.log('Cached metrics result:', cachedMetrics);
        console.log('Metrics now stored in config:', CHART_CONFIG.dataStructure.metrics);

        // Validation: Check for expected metrics
        const expectedMetrics = ['pmp_spend_pct', 'open_spend_pct'];
        const foundExpected = expectedMetrics.filter(metric => directMetrics.includes(metric));
        
        console.log('=== VALIDATION ===');
        console.log('Expected metrics:', expectedMetrics);
        console.log('Found expected metrics:', foundExpected);
        console.log('Validation success:', foundExpected.length === expectedMetrics.length);

        return {
            allMetrics: directMetrics,
            expectedFound: foundExpected,
            config: CHART_CONFIG
        };
    }

    // Auto-initialize when datasets become available
    if (typeof datasets !== 'undefined') {
        console.log('Datasets available immediately, initializing...');
        initializeAndTest();
    } else {
        // Poll for datasets
        let attempts = 0;
        const maxAttempts = 20;
        
        const poll = setInterval(() => {
            attempts++;
            if (typeof datasets !== 'undefined') {
                console.log('Datasets became available, initializing...');
                clearInterval(poll);
                initializeAndTest();
            } else if (attempts >= maxAttempts) {
                console.error('Datasets never became available');
                clearInterval(poll);
            }
        }, 500);
    }

    // =============================================================================
    // EXPORT FOR TESTING
    // =============================================================================

    window.SimplifiedMetricExtraction = {
        getMetrics: () => CHART_CONFIG.dataStructure.getMetrics(),
        loadMetrics: () => CHART_CONFIG.dataStructure.loadMetrics(),
        getConfig: () => CHART_CONFIG,
        reinitialize: initializeAndTest,
        test: () => {
            console.log('=== MANUAL TEST ===');
            return initializeAndTest();
        }
    };

    console.log('Simplified Metric Extraction loaded!');
    console.log('Test commands:');
    console.log('- SimplifiedMetricExtraction.test()');
    console.log('- SimplifiedMetricExtraction.getMetrics()');
    console.log('- SimplifiedMetricExtraction.getConfig()');

})(); 