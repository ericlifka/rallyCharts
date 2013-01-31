Ext.define('Rally.ui.chart.ChartComponent', {
    extend: 'Ext.Container',
    alias: 'widget.rallychartcomponent',

    items:[
        {
            xtype:'container',
            itemId:'header',
            cls:'header'
        },
        {
            xtype:'container',
            itemId:'chart',
            cls:'chart'
        }
    ],

    config: {
        queryConfig: undefined,
        calculatorType: undefined,
        calculatorConfig: undefined,
        chartColors: ['#B3B79A', '#E57E3A', '#E5D038', '#B2E3B6', '#3A874F', '#5C9ACB'],
        chartConfig: undefined
    },

    storeType: 'Rally.data.lookback.SnapshotStore',

    // MOAR CHART STUFFZ PLZ =^-^=

    initComponent: function (config) {
        this.callParent(arguments);

        var chartConfig = this.getChartConfig();
        if(chartConfig.credits) {
            chartConfig.credits.enabled = false;
        } else {
            chartConfig.credits = {
                enabled: false
            };
        }

        var calculatorConfig = this.getCalculatorConfig();
        calculatorConfig.startDate = this._getChartStartDate();
        calculatorConfig.endDate = this._getChartEndDate();

        this.calculator = Ext.create(this.getCalculatorType(), this.getCalculatorConfig());

        var queryConfig = this.getQueryConfig();
        var store = window.store = Ext.create(this.storeType, {
            rawFind: queryConfig.find,
            limit: Infinity,
            hydrate: queryConfig.hydrate,
            fetch: queryConfig.fetch
        });
        store.on('load', this._onStoreLoad, this);
        store.load();
    },

    _onStoreLoad: function (store) {
        var numRecords = store.getCount(),
            chartData = null;

        if(numRecords <= 0) {
            console.log("no records");
            return;
        } else if(numRecords !== store.getTotalCount()) {
            console.log("unauthorized for data");
            return;
        } else {
            chartData = this.calculator.prepareChartData(store);
        }

        // chart data!
        this._renderChart(chartData);
    },

    _renderChart: function(chartData) {
        var chartConfig = this.getChartConfig();
        chartConfig.xAxis.categories = chartData.categories;

        this._setChartColors(chartData.series);

        var highChartConfig = {
            xtype: 'highchart',
            chartConfig: chartConfig,
            series: chartData.series
        };

        
        this._highchart = this.add(highChartConfig);
    },

    _setChartColors: function(series) {
        var colors = this.getChartColors(),
            length = Math.min(series.length, colors.length);

        for (var i = 0; i < length; i += 1) {
            series[i].color = colors[i];
        }
    },
    
    _getTimeZone: function() {

    },

    _getChartStartDate: function() {
        return new Date();
    },

    _getChartEndDate: function() {
        return new Date();
    }
});
