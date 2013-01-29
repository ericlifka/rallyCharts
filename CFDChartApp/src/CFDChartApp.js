Ext.define('CFDChartApp', {
    extend: 'ChartApp',
    
    queryConfig: {
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

    calculator: "Rally.calculators.CumulativeFlowCalculator",
    calculatorConfig: {
        aggregateOn: "ScheduleState",
        workdays: ["Monday", "Tuesday", "Wednesday"]
    },

    chartConfig: {
        useColors: ["blah"]
    }
});
