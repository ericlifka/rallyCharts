Ext.define('Rally.calculators.BurnCalculator', {
    alias: 'widget.burncalculator',

    config: {
        aggregationType: 'count',
        workDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        chartMetricsConfig: undefined
    },

    _defaultChartMetricsConfig: undefined,

    constructor: function(config) {
        Ext.apply(this.config, config);

        var chartMetrics = this.config.chartMetricsConfig || this._defaultChartMetricsConfig;
        this._buildChartMetrics(chartMetrics);
    },

    prepareChartData: function(store) {
        var results = [];
        store.each(function(record) {
            results.push(record.raw);
        });

        return this._calculateBurn(results, this.config);
    },

    _buildChartMetrics: function(chartMetricsConfig) {
        var chartMetrics = [];
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

        this.chartMetrics = chartMetrics;
    },

    _calculateBurn: function(results, config) {
        var lumenize = Rally.data.lookback.Lumenize,
            granularity = lumenize.Time.DAY,
            tz = config.timeZone,
            workDays = config.workDays.join(',');

        // Test data!
        var snapshotsCSV = [
            ["ObjectID", "_ValidFrom", "_ValidTo", "ScheduleState", "PlanEstimate", "TaskRemainingTotal", "TaskEstimateTotal"],
            [1, "2010-10-10T15:00:00.000Z", "2011-01-02T13:00:00.000Z", "Ready to pull", 5, 15, 15],
            [1, "2011-01-02T13:00:00.000Z", "2011-01-02T15:10:00.000Z", "Ready to pull", 5, 15, 15],
            [1, "2011-01-02T15:10:00.000Z", "2011-01-03T15:00:00.000Z", "In progress", 5, 20, 15],
            [2, "2011-01-02T15:00:00.000Z", "2011-01-03T15:00:00.000Z", "Ready to pull", 3, 5, 5],
            [3, "2011-01-02T15:00:00.000Z", "2011-01-03T15:00:00.000Z", "Ready to pull", 5, 12, 12],
            [2, "2011-01-03T15:00:00.000Z", "2011-01-04T15:00:00.000Z", "In progress", 3, 5, 5],
            [3, "2011-01-03T15:00:00.000Z", "2011-01-04T15:00:00.000Z", "Ready to pull", 5, 12, 12],
            [4, "2011-01-03T15:00:00.000Z", "2011-01-04T15:00:00.000Z", "Ready to pull", 5, 15, 15],
            [1, "2011-01-03T15:10:00.000Z", "2011-01-04T15:00:00.000Z", "In progress", 5, 12, 15],
            [1, "2011-01-04T15:00:00.000Z", "2011-01-06T15:00:00.000Z", "Accepted", 5, 0, 15],
            [2, "2011-01-04T15:00:00.000Z", "2011-01-06T15:00:00.000Z", "In test", 3, 1, 5],
            [3, "2011-01-04T15:00:00.000Z", "2011-01-05T15:00:00.000Z", "In progress", 5, 10, 12],
            [4, "2011-01-04T15:00:00.000Z", "2011-01-06T15:00:00.000Z", "Ready to pull", 5, 15, 15],
            [5, "2011-01-04T15:00:00.000Z", "2011-01-06T15:00:00.000Z", "Ready to pull", 2, 4, 4],
            [3, "2011-01-05T15:00:00.000Z", "2011-01-07T15:00:00.000Z", "In test", 5, 5, 12],
            [1, "2011-01-06T15:00:00.000Z", "2011-01-07T15:00:00.000Z", "Released", 5, 0, 15],
            [2, "2011-01-06T15:00:00.000Z", "2011-01-07T15:00:00.000Z", "Accepted", 3, 0, 5],
            [4, "2011-01-06T15:00:00.000Z", "2011-01-07T15:00:00.000Z", "In progress", 5, 7, 15],
            [5, "2011-01-06T15:00:00.000Z", "2011-01-07T15:00:00.000Z", "Ready to pull", 2, 4, 4],
            [1, "2011-01-07T15:00:00.000Z", "9999-01-01T00:00:00.000Z", "Released", 5, 0, 15],
            [2, "2011-01-07T15:00:00.000Z", "9999-01-01T00:00:00.000Z", "Released", 3, 0, 5],
            [3, "2011-01-07T15:00:00.000Z", "9999-01-01T00:00:00.000Z", "Accepted", 5, 0, 12],
            [4, "2011-01-07T15:00:00.000Z", "9999-01-01T00:00:00.000Z", "In test", 5, 3, 15]
        ];
        
        var snapshots = lumenize.csvStyleArray_To_ArrayOfMaps(snapshotsCSV);
        // var deriveFieldsOnInput = [
        var annotatedFields = [
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

        var metrics = this.chartMetrics;

        var summaryMetricsConfig = [
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

        // var deriveFieldsAfterSummary = [
        var annotatedFieldsAfterSummary = [
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

        var burnConfig = {
            deriveFieldsOnInput: annotatedFields,
            metrics: metrics,
            summaryMetricsConfig: summaryMetricsConfig,
            deriveFieldsAfterSummary: annotatedFieldsAfterSummary,
            granularity: granularity,
            tz: tz, // Config
            holidays: [], // Config
            workDays: workDays // Config
        };

        var calculator = new lumenize.TimeSeriesCalculator(burnConfig),
            startOn = new lumenize.Time('2011-01-02').getISOStringInTZ(tz),
            endBefore = new lumenize.Time('2011-01-10').getISOStringInTZ(tz),
            keys = [
                'label',
                'StoryUnitScope',
                'StoryCountScope',
                'StoryCountBurnUp',
                'StoryUnitBurnUp',
                'TaskUnitBurnDown',
                'TaskUnitScope',
                'Ideal',
                'Ideal2'
            ];

        calculator.addSnapshots(snapshots, startOn, endBefore);

        var categories = [],
            series = [],
            seriesData = calculator.getResults().seriesData;

        for(var i = 0, length = seriesData.length; i < length; i++) {
            var dataObject = seriesData[i];
            categories.push(dataObject.label);
        }

        var aggregationConfig = [
            {
                name: 'StoryUnitScope',
                type: 'column',
                color: '#B3B79A'
            },
            {
                name: 'StoryCountScope',
                type: 'column',
                color: '#E57E3A'
            },
            {
                name: 'StoryCountBurnUp',
                type: 'column',
                color: '#E5D038'
            },
            {
                name: 'StoryUnitBurnUp',
                type: 'column',
                color: '#B2E3B6'
            },
            {
                name: 'TaskUnitBurnDown',
                type: 'column',
                color: '#3A874F'
            },
            {
                name: 'TaskUnitScope',
                type: 'column',
                color: '#5C9ACB'
            },
            {
                name: 'Ideal',
                type: 'line',
                yAxis: 1
            },
            {
                name: 'Ideal2',
                type: 'line',
                yAxis: 1
            }
        ];

        series = lumenize.aggregationAtArray_To_HighChartsSeries(seriesData, aggregationConfig);

        return {
            series: series,
            categories: categories
        };
    }
});