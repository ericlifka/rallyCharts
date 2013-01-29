Ext.define('CFDChartApp', {
    extend: 'Rally.app.App',

    items: [
        {
            xtype: 'rallychartcomponent',
            queryConfig: {
                // sorters: [
                //     {
                //         property: '_ValidFrom',
                //         direction: 'ASC'
                //     }
                // ],
                // hydrate: ['ScheduleState'],
                // fetch: ['ScheduleState'],
                // filters: []

                "_TypeHierarchy": -51038,
                "_ItemHierarchy": 5103028089,
                "Children": null,
                "_ValidTo": {
                    "$lte":"2012-12-06T20:11:27Z"
                },
                "_ValidFrom": {
                    "$lte":"2012-12-14T20:40:08.830Z",
                    "$gt":"2012-04-03T13:40:58Z"
                }
            },

            calculatorType: "Rally.calculators.CumulativeFlowCalculator",
            calculatorConfig: {
                aggregateOn: "ScheduleState",
                workdays: ["Monday", "Tuesday", "Wednesday"]
            },

            chartConfig: {
                chart: {
                    defaultSeriesType: 'area',
                    zoomType: 'x'
                },
                legend: {
                    align: 'right',
                    layout: 'vertical',
                    verticalAlign: 'middle'
                },
                xAxis: {
                    categories: [],
                    tickmarkPlacement: 'on',
                    tickInterval: 1,
                    title: {
                        enabled: false
                    }
                    // set dateTimeLabelFormats
                },
                tooltip: {
                    formatter: function() {
                        return '' + this.x + '<br />' + this.series.name + ': ' + this.y;
                    }
                },
                plotOptions: {
                    area: {
                        stacking: 'normal',
                        lineColor: '#666666',
                        lineWidth: 1,
                        marker: {
                            enabled: false
                        }
                    },
                    series: {
                    }
                },
                series: []
            }
        }
    ]
});
