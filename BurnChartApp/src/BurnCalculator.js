Ext.define('Rally.calculators.BurnCalculator', {
    alias: 'widget.burncalculator',

    config: {
        aggregationType: 'count',
        workDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        holidays: [],
        chartMetricsConfig: undefined
    },

    _defaultChartMetricsConfig: {
        sum: {
            "PlanEstimate": "StoryUnitScope",
            "AcceptedStoryCount": "StoryCountBurnUp",
            "AcceptedStoryPoints": "StoryUnitBurnUp",
            "TaskRemainingTotal": "TaskUnitBurnDown",
            "TaskEstimateTotal": "TaskUnitScope"
        },
        count: {
            "StoryCountScope": "StoryCountScope"
        }
    },

    constructor: function(config) {
        Ext.apply(this.config, config);
    },

    prepareChartData: function(store) {
        var results = [];
        store.each(function(record) {
            results.push(record.raw);
        });

        //-------------mocking
        results = snapshotsCSV;
        //-------------mocking

        return this._calculateBurn(results);
    },

    _buildChartMetrics: function() {
        var chartMetrics = [],
            chartMetricsConfig = this.config.chartMetricsConfig || this._defaultChartMetricsConfig;

        for(var func in chartMetricsConfig) {
            var fields = chartMetricsConfig[func];
            for(var field in fields) {
                chartMetrics.push({
                    field: field,
                    as: fields[field],
                    f: func
                });
            }
        }

        return chartMetrics;
    },

    _buildAggregationConfig: function (chartMetrics) {
        var aggregationConfig = [];

        for (var i = 0, length = chartMetrics.length; i < length; i += 1) {
            var metric = chartMetrics[i];
            aggregationConfig.push({
                name: metric.as,
                type: 'column'
            });
        }

        aggregationConfig.push({
            name: 'Ideal',
            type: 'line',
            yAxis: 1
        });

        aggregationConfig.push({
            name: 'Ideal2',
            type: 'line',
            yAxis: 1
        });

        return aggregationConfig;
    },

    _getIdealLines: function() {
        return [
            {
                as: 'Ideal',
                f: function(row, index, summaryMetrics, seriesData) {
                    var max = summaryMetrics.TaskUnitScope_max,
                        increments = seriesData.length - 1,
                        incrementAmount = max / increments;
                    return Math.floor(100 * (max - index * incrementAmount)) / 100;
                }
            },
            {
                as: 'Ideal2',
                f: function(row, index, summaryMetrics, seriesData) {
                    if(index < summaryMetrics.TaskUnitBurnDown_max_index) {
                        return null;
                    } else {
                        var max = summaryMetrics.TaskUnitBurnDown_max,
                            increments = seriesData.length - 1 - summaryMetrics.TaskUnitBurnDown_max_index,
                            incrementAmount = max / increments;
                        return Math.floor(100 * (max - (index - summaryMetrics.TaskUnitBurnDown_max_index) * incrementAmount)) / 100;
                    }
                }
            }
        ];
    },

    _getSummariesConfig: function () {
        return [
            {
                field: 'TaskUnitScope',
                f: 'max'
            },
            {
                field: 'TaskUnitBurnDown',
                f: 'max'
            },
            {
                as: 'TaskUnitBurnDown_max_index',
                f: function(seriesData, summaryMetrics) {
                    for(var i = 0, length = seriesData.length; i < length; i++) {
                        var row = seriesData[i];
                        if(row.TaskUnitBurnDown === summaryMetrics.TaskUnitBurnDown_max) {
                            return i;
                        }
                    }
                }
            }
        ];
    },

    _getAnnotatedFieldsConfig: function () {
        return [
            {
                field: 'AcceptedStoryCount',
                f: function(row) {
                    var state = row.ScheduleState;
                    if(state === 'Accepted' || state === 'Released') {
                        return 1;
                    } else {
                        return 0;
                    }
                }
            },
            {
                field: 'AcceptedStoryPoints',
                f: function(row) {
                    var state = row.ScheduleState;
                    if(state === 'Accepted' || state === 'Released') {
                        return row.PlanEstimate;
                    } else {
                        return 0;
                    }
                }
            }
        ];
    },

    _calculateBurn: function(results) {
        var lumenize = Rally.data.lookback.Lumenize,
            tz = this.config.timeZone;
        
        //--------mocking
        var snapshots = lumenize.csvStyleArray_To_ArrayOfMaps(results);
        //--------mocking

        var chartMetrics = this._buildChartMetrics(),
            aggregationConfig = this._buildAggregationConfig(chartMetrics);

        var burnConfig = {
            deriveFieldsOnInput: this._getAnnotatedFieldsConfig(),
            metrics: chartMetrics,
            summaryMetricsConfig:  this._getSummariesConfig(),
            deriveFieldsAfterSummary: this._getIdealLines(),
            granularity: lumenize.Time.DAY,
            tz: tz,
            holidays: this.config.holidays,
            workDays: this.config.workDays.join(',')
        };

        var calculator = new lumenize.TimeSeriesCalculator(burnConfig),
            startOn = new lumenize.Time('2011-01-02').getISOStringInTZ(tz),
            endBefore = new lumenize.Time('2011-01-10').getISOStringInTZ(tz);

        calculator.addSnapshots(snapshots, startOn, endBefore);

        var categories = [],
            series = [],
            seriesData = calculator.getResults().seriesData;

        for(var i = 0, length = seriesData.length; i < length; i++) {
            var dataObject = seriesData[i];
            categories.push(dataObject.label);
        }

        series = lumenize.aggregationAtArray_To_HighChartsSeries(seriesData, aggregationConfig);

        return {
            series: series,
            categories: categories
        };
    }
});