(function() {
    var Ext = window.Ext4 || window.Ext;

    Ext.define('Rally.calculators.CumulativeFlowCalculator', {
        extend: 'Ext.Component',
        alias: 'cumulativeflowcalculator',


        config: {
            cumulativeFlowConfig: {}
        },

        constructor: function(config) {

        },

        prepareChartData: function(store, results) {

        },

        _calculateComulativeFlow: function(results, config) {
            var lumenize = Rally.data.lookback.Lumenize,
                    timeSeriesGroupByCalculator = lumenize.timeSeriesGroupByCalculator,
                    ChartTime = lumenize.ChartTime;
            ChartTime.setTZPath('');

            /*
             Takes the "results" from a query to Rally's Analytics API (or similar MVCC-based implementation)
             and returns the data points for a cumulative flow diagram (CFD).
             */
            var categories, ct, drillDownObjectIDs, firstTrackingCT, firstTrackingDate, groupByAtArray, i, lastTrackingCT, lastTrackingDate, listOfAtCTs, maxDaysBackCT, rangeSpec, row, series, timeSeriesGroupByCalculatorConfig, uniqueValues, _len, _ref;
            lastTrackingDate = results[results.length - 1]._ValidFrom;
            lastTrackingCT = new ChartTime(lastTrackingDate, 'day', config.timeZone).add(1);
            firstTrackingDate = results[0]._ValidFrom;
            firstTrackingCT = new ChartTime(firstTrackingDate, 'day', config.timeZone);
            if (config.maxDaysBack) {
                maxDaysBackCT = lastTrackingCT.add(-1 * config.maxDaysBack, 'day');
                if (firstTrackingCT.$lt(maxDaysBackCT)) {
                    firstTrackingCT = maxDaysBackCT;
                }
            }
            rangeSpec = {
                workDays: config.workDays,
                holidays: config.holidays,
                start: firstTrackingCT,
                pastEnd: lastTrackingCT
            };
            timeSeriesGroupByCalculatorConfig = {
                rangeSpec: rangeSpec,
                timezone: config.timeZone,
                groupByField: config.groupByField,
                groupByFieldValues: config.groupByFieldValues,
                useAllGroupByFieldValues: config.useAllGroupByFieldValues,
                aggregationField: config.aggregationField,
                aggregationFunction: config.aggregationFunction,
                snapshotValidFromField: '_ValidFrom',
                snapshotValidToField: '_ValidTo',
                snapshotUniqueID: 'ObjectID'
            };
            _ref = timeSeriesGroupByCalculator(results, timeSeriesGroupByCalculatorConfig);
            listOfAtCTs = _ref.listOfAtCTs;
            groupByAtArray = _ref.groupByAtArray;
            uniqueValues = _ref.uniqueValues;
            if (config.useAllGroupByFieldValues) {
                series = lumenize.groupByAtArray_To_HighChartsSeries(groupByAtArray, config.groupByField, 'GroupBy');
                drillDownObjectIDs = lumenize.groupByAtArray_To_HighChartsSeries(groupByAtArray, config.groupByField, 'DrillDown', uniqueValues, true);
            } else {
                series = lumenize.groupByAtArray_To_HighChartsSeries(groupByAtArray, config.groupByField, 'GroupBy', config.groupByFieldValues);
                drillDownObjectIDs = lumenize.groupByAtArray_To_HighChartsSeries(groupByAtArray, config.groupByField, 'DrillDown', config.groupByFieldValues, true);
            }
            categories = (function() {
                var _i, _len2, _results;
                _results = [];
                for (_i = 0, _len2 = listOfAtCTs.length; _i < _len2; _i++) {
                    ct = listOfAtCTs[_i];
                    _results.push("" + (ct.toString()));
                }
                return _results;
            })();
            return {
                series: series,
                categories: categories,
                drillDownObjectIDs: drillDownObjectIDs
            };
        }
    });
})();