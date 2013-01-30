Ext.define('Rally.calculators.CumulativeFlowCalculator', {
    alias: 'widget.cumulativeflowcalculator',

    config: {
        cumulativeFlowConfig: {
            groupByField: 'ScheduleState',
            groupByFieldValues: ['Defined', 'In-Progress', 'Completed', 'Accepted'],
            useAllGroupByFieldValues: false,
            aggregationType: 'count',
            workDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
            holidays: [],
            timeZone: 'America/New_York',
            startDate: new Date(),
            endDate: new Date()
        }
    },

    constructor: function(config) {
        this.cumulativeFlowConfig.workDays = this.cumulativeFlowConfig.workDays.join(',');

        if (this.cumulativeFlowConfig.aggregationType.match(/estimate/i)) {
            this.cumulativeFlowConfig.aggregationField = "PlanEstimate";
            this.cumulativeFlowConfig.aggregationFunction = "$sum";
            this.storeConfig.fetch = Ext.Array.union(this.storeConfig.fetch, ['PlanEstimate']);
        } else {
            this.cumulativeFlowConfig.aggregationField = "ObjectID";
            this.cumulativeFlowConfig.aggregationFunction = "$count";
        }

        // this.storeConfig.hydrate = Ext.Array.union(this.storeConfig.hydrate, [this.cumulativeFlowConfig.groupByField]);
        // this.storeConfig.fetch = Ext.Array.union(this.storeConfig.fetch, [this.cumulativeFlowConfig.groupByField]);

        // this.storeConfig.filters = Ext.Array.union(this.storeConfig.filters, [
        //     {
        //         property: '_ValidFrom',
        //         operator: '>',
        //         value: Rally.util.DateTime.toIsoString(this.cumulativeFlowConfig.startDate, true)
        //     },
        //     {
        //         property: '_ValidTo',
        //         operator: '<=',
        //         value: Rally.util.DateTime.toIsoString(this.cumulativeFlowConfig.endDate, true)
        //     }
        // ]);
    },

    prepareChartData: function(store) {
        var results = [];
        store.each(function(record) {
            results.push(record.raw);
        });
        return this._calculateCumulativeFlow(results, this.getCumulativeFlowConfig());
    },

    _calculateCumulativeFlow: function(results, config) {
        var __hasProp = Object.prototype.hasOwnProperty, __indexOf = Array.prototype.indexOf || function(item) {
            for (var i = 0, l = this.length; i < l; i++) {
                if (__hasProp.call(this, i) && this[i] === item) {
                    return i;
                }
            }
            return -1;
        };

        var lumenize = Rally.data.lookback.Lumenize,
                ChartTime = lumenize.ChartTime;

        ChartTime.setTZPath('');
        /*
         Takes the "results" from a query to Rally's Analytics API (or similar MVCC-based implementation)
         and returns the series for burn charts.
         */
        var aggregationAtArray, aggregations, categories, ct, derivedFields, f, field, i, idealData, idealStep, listOfAtCTs, maxTaskEstimateTotal, name, originalPointCount, pastEnd, rangeSpec, s, series, seriesFound, seriesNames, start, timeSeriesCalculatorConfig, type, yAxis, _i, _len, _ref, _ref2, _ref3;
        start = new ChartTime(config.startDate, config.granularity, config.workspaceConfiguration.TimeZone);
        pastEnd = new ChartTime(config.endDate, config.granularity, config.workspaceConfiguration.TimeZone).add(1);
        rangeSpec = {
            workDays: config.workspaceConfiguration.WorkDays,
            holidays: config.holidays,
            start: start,
            pastEnd: pastEnd
        };
        derivedFields = [];
        if (config.upSeriesType === 'Points') {
            derivedFields.push({
                name: 'Accepted',
                f: function(row) {
                    var _ref = row.ScheduleState;
                    if (__indexOf.call(config.acceptedStates, _ref) >= 0) {
                        return row.PlanEstimate;
                    } else {
                        return 0;
                    }
                }
            });
        } else if (config.upSeriesType === 'Story Count') {
            derivedFields.push({
                name: 'Accepted',
                f: function(row) {
                    var _ref = row.ScheduleState;
                    if (__indexOf.call(config.acceptedStates, _ref) >= 0) {
                        return 1;
                    } else {
                        return 0;
                    }
                }
            });
        }
        seriesNames = [];
        aggregations = [];
        _ref = config.series;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            s = _ref[_i];
            seriesFound = true;
            switch (s) {
                case 'down':
                    name = 'Task To Do (Hours)';
                    f = '$sum';
                    field = 'TaskRemainingTotal';
                    yAxis = 0;
                    type = 'column';
                    break;
                case 'ideal':
                    name = "Ideal (Hours)";
                    f = '$sum';
                    field = 'TaskEstimateTotal';
                    yAxis = 0;
                    type = 'line';
                    break;
                case 'up':
                    name = "Complete";
                    f = '$sum';
                    field = 'Accepted';
                    yAxis = 0;
                    type = 'column';
                    break;
                case 'scope':
                    name = "Planned";
                    if (config.upSeriesType === 'Story Count') {
                        f = '$count';
                    } else if (config.upSeriesType === 'Points') {
                        f = '$sum';
                    }
                    field = 'PlanEstimate';
                    yAxis = 0;
                    type = 'line';
                    break;
                default:
                    if (s.name && s.f && s.field) {
                        name = s.name;
                        f = s.f;
                        field = s.field;
                        type = 'column';
                    } else {
                        seriesFound = false;
                    }
            }
            if (seriesFound) {
                aggregations.push({
                    name: name,
                    as: name,
                    f: f,
                    field: field,
                    yAxis: yAxis,
                    type: type
                });
                seriesNames.push(name);
            }
        }
        timeSeriesCalculatorConfig = {
            rangeSpec: rangeSpec,
            derivedFields: derivedFields,
            aggregations: aggregations,
            timezone: config.workspaceConfiguration.TimeZone,
            snapshotValidFromField: '_ValidFrom',
            snapshotValidToField: '_ValidTo',
            snapshotUniqueID: 'ObjectID'
        };
        _ref2 = lumenize.timeSeriesCalculator(results, timeSeriesCalculatorConfig);
        listOfAtCTs = _ref2.listOfAtCTs;
        aggregationAtArray = _ref2.aggregationAtArray;
        series = lumenize.aggregationAtArray_To_HighChartsSeries(aggregationAtArray, aggregations);
        categories = (function() {
            var _j, _len2, _results;
            _results = [];
            for (_j = 0, _len2 = listOfAtCTs.length; _j < _len2; _j++) {
                ct = listOfAtCTs[_j];
                _results.push("" + (ct.toString()));
            }
            return _results;
        })();
        originalPointCount = categories.length;
        if (__indexOf.call(config.series, "ideal") >= 0) {
            i = 0;
            while (series[i].name.indexOf("Ideal") < 0) {
                i++;
            }
            idealData = series[i].data;
            maxTaskEstimateTotal = lumenize.functions.$max(idealData);
            idealStep = maxTaskEstimateTotal / (originalPointCount - 1);
            for (i = 0, _ref3 = originalPointCount - 2; 0 <= _ref3 ? i <= _ref3 : i >= _ref3; 0 <= _ref3 ? i++ : i--) {
                idealData[i] = (originalPointCount - 1 - i) * idealStep;
            }
            idealData[originalPointCount - 1] = 0;
        }
        return {
            categories: categories,
            series: series
        };
    }
});