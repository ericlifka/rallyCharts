Ext.define('BurnChartApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',

    items: [
        {
            xtype: 'rallychartcomponent',
            queryConfig: {
                find: {
                    "_ValidFrom":{
                        "$lte":"2012-12-14T20:40:08.830Z",
                        "$gt":"2012-04-03T13:40:58Z"
                    },
                    "_TypeHierarchy":-51038,
                    "_ItemHierarchy":5103028089,
                    "Children":null,
                    "_ValidTo":{
                        "$lte":"2012-12-06T20:11:27Z"
                    }
                },
                fetch: ['ScheduleState', 'PlanEstimate', 'TaskRemainingTotal', 'TaskEstimateTotal'],
                hydrate: ['ScheduleState']
            },

            calculatorType: "Rally.calculators.BurnCalculator",
            calculatorConfig: {
                workDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
                timeZone: 'America/New_York',
                holidays: [],
                chartMetricsConfig: {
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
                }
            },

            chartConfig: {
                chart: {
                    defaultSeriesType: 'area',
                    zoomType: 'xy'
                },
                xAxis: {
                    categories: [],
                    tickmarkPlacement: 'on',
                    tickInterval: 1,
                    title: {
                        text: 'Days'
                    }
                },
                yAxis: [
                    {
                        title: {
                            text: "Count"
                        }
                    },
                    {
                        title: {
                            text: "Other Y Axis"
                        },
                        opposite: true,
                        min: 0
                    }
                ],
                tooltip: {
                    formatter: function() {
                        return '' + this.x + '<br />' + this.series.name + ': ' + this.y;
                    }
                },
                plotOptions: {
                    series: {
                        marker: {
                            enabled: false,
                            states: {
                                hover: {
                                    enabled: true
                                }
                            }
                        },
                        groupPadding: 0.01
                    },
                    line: {
                        color: "#000"
                    },
                    column: {
                        stacking: null,
                        color: "#6AB17D",
                        lineColor: '#666666',
                        lineWidth: 1,
                        marker: {
                            lineWidth: 1,
                            lineColor: '#666666'
                        },
                        shadow: false
                    }
                }
            }
        }
    ]
});
