'use strict';

App.View.Map = Backbone.View.extend({
    _ctx : null,
    _tooltip : null,
    // Posible values are single or comparison
    _currentMapType : null,

    _mapInstances : [],

    _currentLayers : [],

    initialize: function(opts) {       
        this._ctx = opts.ctx;

        this._tooltipModel = new Backbone.Model();
        this._tooltip = new App.View.TooltipMap({
            model: this._tooltipModel
        });
        
        this._createSingleMap();

        this.listenTo(App.events,'context:change',this.render);
    },

    _getMapOptions: function(){
        var southWest = L.latLng(26,-21),
            northEast = L.latLng(47,11),
            bounds = L.latLngBounds(southWest, northEast);
        
        return  {
            zoomControl: true,
            center: [39.90,-4.72],
            zoom: 6,
            bounds : bounds
            //minZoom : 5
        };
    },

    _getMapTileLayer: function(){
        return  L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png', {
            attribution: 'Geographica'
        })
    },

    _createSingleMap: function(){
        if (this._currentMapType =='single')
            // Not recreate the map
            return;

        if (this._currentMapType=='comparison'){
            for (var i=0;i<this._mapInstances.length;i++){
                this._mapInstances[i].remove();
            }
        }

        $('#map').removeClass('comparison').addClass('single')
            .html('')
            .append(this._tooltip.$el);

        this._currentMapType = 'single';

        var mapOpts = this._getMapOptions();
        this._map = new L.Map('map',mapOpts);
        this._map.fitBounds(mapOpts.bounds);
        this._mapInstances = [this._map];
        this._getMapTileLayer().addTo(this._map);


      

        this._currentMapType = 'single';
    },

    _createComparativeMap: function(){

        if (this._currentMapType =='comparison')
            // Not recreate the map
            return;

        if (this._currentMapType=='single'){
            this._mapInstances[0].remove();
            this._map = null;
        }

        $('#map').removeClass('single').addClass('comparison')
            .html('<div id=\'map1\'></div><div id=\'map2\'></div>')
            .append(this._tooltip.$el);

        // Create map objects
        var mapOpts1 = this._getMapOptions();
        mapOpts1.zoomControl = false;
        this._mapInstances[0] = new L.Map('map1',this._getMapOptions());
        this._mapInstances[1] = new L.Map('map2',this._getMapOptions());
        this._mapInstances[0].sync(this._mapInstances[1]);
        this._mapInstances[1].sync(this._mapInstances[0]);

        // Add basemap
        this._getMapTileLayer().addTo(this._mapInstances[0]);
        this._getMapTileLayer().addTo(this._mapInstances[1]);

        // complete process
        this._currentMapType = 'comparison';

    },

    onClose: function(){
        // Remove events on close
        this.stopListening();
        _this._tooltip.close();
    },
    
    render: function(ctxData) {
        if (!ctxData){
            ctxData = this._ctx.toJSON();
        }

        for (var i=0;i<this._currentLayers.length;i++){
            if (this._currentLayers[i].clear)
                this._currentLayers[i].clear();
            this._currentLayers[i].remove();
            
        }

        this._currentLayers = [];
       
        if (ctxData.type == App.Cons.TYPE_COMP){
            this._createComparativeMap();
        }
        else{
            this._createSingleMap();   
        }
        
        if (ctxData.type==App.Cons.TYPE_DISEASES){
            this._diseasesNoAnimated(ctxData);
        }
       
        else if (ctxData.type==App.Cons.TYPE_DASHBOARD){
            this._diseasesDashboard();
        }

        else if (ctxData.type==App.Cons.TYPE_COMP){
            this._comparisonDemo(ctxData);

        }
    },

    _getBubbleCSS: function(opts){

        if (!opts.table || !opts.min || !opts.max){
            throw "Missing opts";
        }

        var color = opts.color ? opts.color : '#ff4646';

        var cartocss = ['#' + opts.table + '{',
                'marker-fill-opacity: 0.5;',
                'marker-line-color: ' + color + ';',
                'marker-line-width: 1;',
                'marker-line-opacity: 1;',
                'marker-placement: point;',
                'marker-multi-policy: largest;',
                'marker-type: ellipse;',
                'marker-fill: '+ color + ';',
                'marker-allow-overlap: true;',
                'marker-clip: false;',
                '}'].join('\n');
            

        var points = this._getBubbleThresholdPoints(opts.min,opts.max,opts.nbuckets);
        for (var i=0;i<points.length;i++){
            cartocss += [
                '#' + opts.table + '[n>=' + points[i].threshold +']{',
                'marker-width:' + points[i].size +';',
                '}'
            ].join('\n');
        }

        return cartocss;

    },

    _getBubbleThresholdPoints: function(min,max,nbuckets){

        nbuckets = nbuckets ? nbuckets : 10;

        var inc = Math.round((max-min) / nbuckets),
            startSize = 20,
            sizeInc = 3,
            points = [];

        for (var i=0;i<=nbuckets+1;i++){

            points.push({
                'threshold' : inc*i + min,
                'size' : startSize+i*sizeInc
            });
        }

        return points;
    },


    _diseasesNoAnimated: function(ctxData){
        var _this = this,
            aggregation = ctxData.aggregation,
            date = ctxData.dateFilter;

        var table = 'diseases_pox';
        var dateQuery = 'date_disease>=\'' + date.min.format('YYYY-MM-DD') + ' 00:00:00\'' +
                            ' AND date_disease<=\'' + date.max.format('YYYY-MM-DD') + ' 23:59:59\'';
        if (aggregation=='noagg'){
            // HEAT MAP or cluster MAP

            var cartocss = [ '#'+table+'{',
                    'marker-fill: #FFCC00;', 
                    'marker-width: 6;',
                    'marker-line-color: #FFF;',
                    'marker-line-width: 0.5;',
                    'marker-line-opacity: 0.3;', 
                    'marker-fill-opacity: 0.8;',
                    'marker-comp-op: multiply;',
                    'marker-type: ellipse;',
                    'marker-placement: point;', 
                    'marker-allow-overlap: true;', 
                    'marker-clip: false;',
                    'marker-multi-policy: largest;',
                '}'].join('\n');

            var query = 'SELECT * FROM ' + table + ' WHERE ' + dateQuery;

            cartodb.createLayer(_this._map,{
                user_name : App.config.account,
                type: 'cartodb',
                sublayers : [{
                    sql : query,
                    cartocss : cartocss,
                    interactivity : 'name,age'
                }]
            })
            .addTo(_this._map)
            .on('done', function(layer) {
                _this._currentLayers.push(layer);
                layer.setInteraction(true);

                var sublayer = layer.getSubLayer(0);
                sublayer.setInteraction(true);
                
                sublayer.on('featureOver', function(e, latlng, pos, data) {
                    _this._tooltipModel.set({
                        'data' : [
                            {
                                'label': 'Nombre',
                                'value': data.name
                            },
                            {
                                'label': 'Edad',
                                'value': data.age
                            }
                        ],
                        'pos': pos
                    });
                });

                sublayer.on('featureOut', function() {
                    _this._tooltipModel.clear();
                });
            })
            .on('error', function(err) {
                alert("some error occurred: " + err);
            });

        }
        else{

            var sql;
            
            if (aggregation==App.Cons.AGG_PROV){
                sql = ' SELECT p.cartodb_id,count(ur.cartodb_id) as n,p.name,p.the_geom,p.the_geom_webmercator' +
                        '    FROM ' + table + ' ur' +
                        '    INNER JOIN alasarr.spain_provinces_centroids p ON p.cod_prov=ur.prov' +
                        '   WHERE ' + dateQuery +
                        ' GROUP BY ur.prov,p.cartodb_id';
            }
            else if (aggregation==App.Cons.AGG_REGION){
                sql = ' SELECT r.cartodb_id,r.name,count(ur.cartodb_id) as n,r.the_geom,r.the_geom_webmercator' +
                        '    FROM ' + table + ' ur' +
                        '    INNER JOIN alasarr.spain_regions_centroids r ON r.cod_region=ur.region' +
                        '   WHERE ' + dateQuery +
                        ' GROUP BY ur.region,r.cartodb_id' ;
            }
            else{
                throw 'Invalid aggregation "' +  aggregation +'"';
            }

            var maxminSQL = 'SELECT MAX(q.n) as max,MIN(q.n) as min FROM (' + sql + ') as q ';

            $.getJSON(App.getAPISQLURL() + '?q='+maxminSQL)
            .done( function(data) {

                var max = data.rows[0].max,
                    min = data.rows[0].min;

                var cartocss = _this._getBubbleCSS({
                    table: table,
                    min : min,
                    max : max
                });

                cartodb.createLayer(_this._map,{
                    user_name : App.config.account,
                    type: 'cartodb',
                    sublayers : [{
                        sql : sql,
                        cartocss : cartocss,
                        interactivity: 'n,name'
                    }]
                })
                .addTo(_this._map)
                .on('done', function(layer) {
                    _this._currentLayers.push(layer);
                    
                    layer.setInteraction(true);

                    var sublayer = layer.getSubLayer(0);
                    sublayer.setInteraction(true);
                    
                    sublayer.on('featureOver', function(e, latlng, pos, data) {
                        _this._tooltipModel.set({
                            'data' : [
                                {
                                    'label': aggregation==App.Cons.AGG_PROV ? 'Provincia' : 'Comunidad autónoma',
                                    'value': data.name
                                },
                                {
                                    'label': 'Casos',
                                    'value': App.formatNumber(data.n,0)
                                }
                            ],
                            'pos': pos
                        });
                    });

                    sublayer.on('featureOut', function() {
                        _this._tooltipModel.clear();
                    });
                })
                .on('error', function(err) {
                    alert("some error occurred: " + err);
                });
            })
            .fail(function(error){
                console.error(error);
            });
        }

    },

    _diseasesDashboard: function(){
        var _this = this;

        cartodb.createLayer(this._map,{
                type: 'torque',
                options:{
                    query : 'select * from diseases_pox where date_disease<=\''+ moment().format('YYYY-MM-DD') + ' 00:00:00'+'\'',
                    user_name : App.config.account,
                    cartocss : this._getAnimatedCartoCSS('diseases_pox','date_disease','#e60000')
                }
            }).addTo(this._map)
            .on('done', function(layer) {
                _this._currentLayers.push(layer);
                layer.on('change:time', function(time,step) {
                    //console.log("Change time");
                    App.events.trigger('animation:change:time',time,step);
                });
            })
            .on('error', function(err) {
              alert("some error occurred: " + err);
            });
    },

    _getAnimatedCartoCSS: function (table,timefield,markercolor){
        return [
        'Map {',
            '-torque-frame-count:512;',
            '-torque-animation-duration:45;',
            '-torque-time-attribute:"'+ timefield + '";',
            '-torque-aggregation-function:"count(cartodb_id)";',
            '-torque-resolution:4;',
            '-torque-data-aggregation:linear;',
        '}',
        '#'+table+'{',
            'comp-op: source-over;',
            'marker-fill-opacity: 0.8;',
            'marker-line-color: '+markercolor+' ;',
            'marker-line-width: 1;',
            'marker-line-opacity: 1;',
            'marker-type: ellipse;',
            'marker-width: 2;',
            'marker-fill: '+ markercolor + '  ;',
        '}',
        '#'+table+'[frame-offset=1] {',
            'marker-width:4;',
            'marker-fill-opacity:0.4    ;', 
        '}',
        '#'+table+'[frame-offset=2] {',
            'marker-width:6;',
            'marker-fill-opacity:0.2;',
        '}'
        ].join('\n');
    },
    _comparisonDemo: function(ctxData){
        var _this = this,
            aggregation = ctxData.aggregation,
            date = ctxData.dateFilter;

        var table = 'diseases_pox';
        var dateQuery = ['date_disease>=\'2013-01-01 00:00:00\'' +
                            ' AND date_disease<=\'2013-12-31 23:59:59\'',
                            'date_disease>=\'2014-01-01 00:00:00\'' +
                            ' AND date_disease<=\'2014-12-31 23:59:59\''];

        if (aggregation=='noagg'){
            // HEAT MAP or cluster MAP

            var cartocss = [ '#'+table+'{',
                    'marker-fill: #FFCC00;', 
                    'marker-width: 6;',
                    'marker-line-color: #FFF;',
                    'marker-line-width: 0.5;',
                    'marker-line-opacity: 0.3;', 
                    'marker-fill-opacity: 0.8;',
                    'marker-comp-op: multiply;',
                    'marker-type: ellipse;',
                    'marker-placement: point;', 
                    'marker-allow-overlap: true;', 
                    'marker-clip: false;',
                    'marker-multi-policy: largest;',
                '}'].join('\n');

            for (var i=0;i<2;i++){
                _this._createLayerClosureDiseases(i,aggregation,cartocss,'SELECT * FROM ' + table + ' WHERE ' + dateQuery[i]);
            }
        }
        else{

            var dateQueryALL = 'date_disease>=\'2013-01-01 00:00:00\'' +
                        ' AND date_disease<=\'2014-12-31 23:59:59\'';

            var sql,nbuckets;
            
            if (aggregation==App.Cons.AGG_PROV){
                sql = ' SELECT p.cartodb_id,count(ur.cartodb_id) as n,p.name,p.the_geom,p.the_geom_webmercator' +
                        '    FROM ' + table + ' ur' +
                        '    INNER JOIN alasarr.spain_provinces_centroids p ON p.cod_prov=ur.prov' +
                        '   WHERE ###filter###' +
                        ' GROUP BY ur.prov,p.cartodb_id';
                nbuckets = 52;
            }
            else if (aggregation==App.Cons.AGG_REGION){
                sql = ' SELECT r.cartodb_id,r.name,count(ur.cartodb_id) as n,r.the_geom,r.the_geom_webmercator' +
                        '    FROM ' + table + ' ur' +
                        '    INNER JOIN alasarr.spain_regions_centroids r ON r.cod_region=ur.region' +
                        '   WHERE ###filter###' +
                        ' GROUP BY ur.region,r.cartodb_id' ;
                nbuckets = 19;
            }
            else{
                throw 'Invalid aggregation "' +  aggregation +'"';
            }

            var maxminSQL = 'SELECT MAX(q.n) as max,MIN(q.n) as min FROM (' + sql.replace('###filter###',dateQueryALL) + ') as q ';

            $.getJSON(App.getAPISQLURL() + '?q='+maxminSQL)
            .done( function(data) {

                var max = data.rows[0].max,
                    min = data.rows[0].min;

                for (var i=0;i<2;i++){
                    var cartocss = _this._getBubbleCSS({
                        table: table,
                        min : min,
                        max : max,
                        nbuckets : nbuckets,
                        color: i==0 ? null : '#cc9900'
                    });

                    _this._createLayerClosureDiseases(i,aggregation,cartocss,sql.replace('###filter###',dateQuery[i]));
                }

            })
            .fail(function(error){
                console.error(error);
            });
        }
    },

    _createLayerClosureDiseases : function (i,agg,cartocss,sql){
        var _this = this;

        cartodb.createLayer(this._mapInstances[i],{
            user_name : App.config.account,
            type: 'cartodb',
            sublayers : [{
                //sql : 'SELECT * FROM ' + table + ' WHERE ' + dateQuery[i],
                sql : sql,
                cartocss : cartocss,
                interactivity : agg==App.Cons.NOAGG ? 'name,age' : 'n,name'
            }]
        })
        .addTo(this._mapInstances[i])
        .on('done', function(layer) {
            _this._currentLayers.push(layer);
            layer.setInteraction(true);

            var sublayer = layer.getSubLayer(0);
            sublayer.setInteraction(true);
            
            sublayer.on('featureOver', function(e, latlng, pos, data) {

                if (i==1){
                    pos.x += $('#map2').position().left;
                }
                
                var modeldata;
                if (agg == App.Cons.NOAGG){
                    modeldata = [
                        {
                            'label': 'Nombre',
                            'value': data.name
                        },
                        {
                            'label': 'Edad',
                            'value': data.age
                        }
                    ];
                }
                else{
                    modeldata =[
                        {
                            'label': agg==App.Cons.AGG_PROV ? 'Provincia' : 'Comunidad autónoma',
                            'value': data.name
                        },
                        {
                            'label': 'Casos',
                            'value': App.formatNumber(data.n,0)
                        }
                    ];
                }

                 _this._tooltipModel.set({
                    'data' : modeldata,
                    'pos': pos
                });
               
            });

            sublayer.on('featureOut', function() {
                _this._tooltipModel.clear();
            });
        })
        .on('error', function(err) {
            alert("some error occurred: " + err);
        });
    },

    _createLayerClosureDiseasesAGG: function(i){
        var _this = this;
        cartodb.createLayer(this._mapInstances[i],{
            user_name : App.config.account,
            type: 'cartodb',
            sublayers : [{
                sql : sql.replace('###filter###',dateQuery[i]),
                cartocss : cartocss,
                interactivity: 'n,name'
            }]
        })
        .addTo(this._mapInstances[i])
        .on('done', function(layer) {
             _this._currentLayers.push(layer);
            layer.setInteraction(true);

            var sublayer = layer.getSubLayer(0);
            
            sublayer.on('featureOver', function(e, latlng, pos, data) {
                if (i==1){
                    pos.x += $('#map2').position().left;
                }
                _this._tooltipModel.set({
                    'data' : [
                        {
                            'label': aggregation==App.Cons.AGG_PROV ? 'Provincia' : 'Comunidad autónoma',
                            'value': data.name
                        },
                        {
                            'label': 'Casos',
                            'value': App.formatNumber(data.n,0)
                        }
                    ],
                    'pos': pos
                });
               
            });

            sublayer.on('featureOut', function() {
               _this._tooltipModel.clear();
            });
        })
        .on('error', function(err) {
            alert("some error occurred: " + err);
        });
    }
});
