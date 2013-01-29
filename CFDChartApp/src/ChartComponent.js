Ext.define('Rally.ui.chart.ChartComponent', {
    extend: 'Ext.Container',
    alias: 'widget.rallychartcomponent',

    config: {
        queryConfig: undefined,
        calculatorType: undefined,
        calculatorConfig: undefined,
        chartConfig: undefined
    },

    storeType: 'Rally.data.lookback.SnapshotStore',

    // MOAR CHART STUFFZ PLZ =^-^=

    initComponent: function (config) {
        this.callParent(arguments);

        this.calculator = Ext.create(this.getCalculatorType(), this.getCalculatorConfig());

        var store = window.store = Ext.create(this.storeType, {
            rawFind: this.getQueryConfig(),
            limit: Infinity,
            hydrate: ["ScheduleState"],
            fetch: ['ScheduleState']
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
        var highChartConfig = {
            xtype: 'highchart',
            chartConfig: this.getChartConfig(),
            series: chartData.series
        };

        
        this._highchart = this.add(highChartConfig);
    },
    
    _getTimeZone: function() {

    },

    _getChartStartDate: function() {

    },

    _getChartEndDate: function() {

    },

    _buildChartTitle: function() {

    }
});
