'use strict';

App.View.Map = Backbone.View.extend({
    _ctx : null,
    _tooltip : null,

    initialize: function(opts) {       
        this._ctx = opts.ctx;

        var southWest = L.latLng(27.37, -18.39),
            northEast = L.latLng(43.24, 4.92),
            bounds = L.latLngBounds(southWest, northEast);
        
        this._map  = new L.Map('map', {
            zoomControl: true,
            center: [39.90,-4.72],
            zoom: 7//,
            //maxBounds : bounds,
            //minZoom : 5
        });

        L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png', {
            attribution: 'Geographica'
        }).addTo(this._map);

        this._tooltipModel = new Backbone.Model();
        this._tooltip = new App.View.TooltipMap({
            model: this._tooltipModel
        });
        $('#map').append(this._tooltip.$el);

        this.listenTo(App.events,'context:change',this.render);
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

        if (this._currentLayer){
            this._currentLayer.remove();
            this._tooltipModel.clear();
        }

        if (ctxData.type==App.Cons.TYPE_DISEASES){
            this._diseasesNoAnimated(ctxData);
        }
       
        else if (ctxData.type==App.Cons.TYPE_DASHBOARD){
            this._diseasesDashboard();
        }
    },

    _getBubbleCSS: function(opts){

        if (!opts.table || !opts.min || !opts.max){
            throw "Missing opts";
        }

        var cartocss = ['#' + opts.table + '{',
                'marker-fill-opacity: 0.5;',
                'marker-line-color: #e60000;',
                'marker-line-width: 1;',
                'marker-line-opacity: 1;',
                'marker-placement: point;',
                'marker-multi-policy: largest;',
                'marker-type: ellipse;',
                'marker-fill: #e60000;',
                'marker-allow-overlap: true;',
                'marker-clip: false;',
                '}'].join('\n');
            

        var points = this._getBubbleThresholdPoints(opts.min,opts.max);
        for (var i=0;i<points.length;i++){
            cartocss += [
                '#' + opts.table + '[n>=' + points[i].threshold +']{',
                'marker-width:' + points[i].size +';',
                '}'
            ].join('\n');
        }

        return cartocss;

    },

    _getBubbleThresholdPoints: function(min,max){
         var nbuckets = 10,
            inc = Math.round((max-min) / nbuckets),
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
                _this._currentLayer = layer;
                layer.setInteraction(true);

                var sublayer = layer.getSubLayer(0);
                
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
                    _this._currentLayer = layer;
                    _this._currentLayer = layer;
                    layer.setInteraction(true);

                    var sublayer = layer.getSubLayer(0);
                    
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
                _this._currentLayer = layer;
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
    }
});
