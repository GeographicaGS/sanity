var deps = {};

deps.templateFolder = 'js/template';

deps.JS = [
    'js/lib/jquery-2.1.4.js',
    'js/lib/underscore-1.8.3.js',
    'js/lib/mustache.min.js',
    'js/lib/backbone-1.2.0.js',
    'js/lib/jquery-ui-1.11.4.js',
    'js/lib/jquery.countTo.js',
    'js/lib/moment-with-locales-2.10.3.js',
    'js/lib/sprintf.js',


    // Namespace
    'js/Namespace.js',
    'js/Config.js',
    'js/Cons.js',
    'js/Context.js',
    
    // --------------------
    // ------  Views ------
    // --------------------
    'js/View/ErrorView.js',
    'js/View/NotFoundView.js',
    'js/View/MapView.js',
    'js/View/MiniChartView.js',
    'js/View/ChartView.js',
    'js/View/GroupChartView.js',
    'js/View/DataPanelView.js',
    'js/View/TableView.js',
    'js/View/SidebarView.js',
    'js/View/TimebarView.js',
    'js/View/FilterHeaderView.js',
    'js/View/FilterView.js',
    'js/View/TooltipMapView.js',
    'js/View/DashboardView.js',
    'js/View/MainBoardView.js',
    

    // --------------------
    // ---  Collections ---
    // --------------------
    'js/collection/TableCollection.js',
    'js/collection/ChartCollection.js',

    // router
    'js/Router.js',
    // app
    'js/App.js'
];

deps.lessFile = 'css/styles.less';

if (typeof exports !== 'undefined') {
    exports.deps = deps;
}