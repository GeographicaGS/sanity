'use strict';

App.Collection.Table = Backbone.Collection.extend({ 
    _username: null,
    _ctx: null,

    initialize: function(models,options) {
        this._username = options.username;
        this._ctx = options.ctx
    },

    sync: function(method, model, options) {
        if (method == 'read'){
            var query;
            
            if (this._ctx._type==App.Cons.TYPE_DISEASES){
                query = this._getQueryDiseasesPox();
                
                var sql = new cartodb.SQL({ user: this._username });
                sql.execute(query)
                    .done(function(data) {
                        options.success(data.rows);    
                    })
                    .error(function(errors) {
                        options.error(errors)
                    });
            }
            else if (this._ctx._type==App.Cons.TYPE_COMP){

              
                if (this._ctx._aggregation == App.Cons.NOAGG){
                    options.success([]);
                    return;
                }

                query = this._getQueryDiseasesPoxComparison();

                
                var sql = new cartodb.SQL({ user: this._username });
                sql.execute(query)
                    .done(function(data) {
                        options.success(data.rows);    
                    })
                    .error(function(errors) {
                        options.error(errors)
                    });
            }
            
        }
           
        else{
            throw ('Not yet implemented');
        }

    },
    _getQueryDiseasesPox:function(){

        var aggregation = this._ctx._aggregation,
            date = this._ctx._dateFilter;

        var table = 'diseases_pox';
        var dateQuery = 'date_disease >=\'' + date.min.format('YYYY-MM-DD') + ' 00:00:00\'' +
                            ' AND date_disease <=\'' + date.max.format('YYYY-MM-DD') + ' 23:59:59\'';

        var query;

        if(aggregation == App.Cons.NOAGG){

            query = 'SELECT p.name, ur.name as user, to_char(ur.date_disease, \'DD/MM/YYYY - HH24:MI:SS\') as date FROM '+
            '( '+
                'SELECT * FROM ' + table + ' WHERE ' + dateQuery + 'ORDER BY date_disease DESC LIMIT 20 ' +
            ') as ur '+
            'INNER JOIN spain_provinces_centroids p ON p.cod_prov=ur.prov ' +
            'ORDER BY date DESC';

        }else if(aggregation == App.Cons.AGG_PROV){
            
            query = ' SELECT p.name, count(*) as total' +
                        '    FROM ' + table + ' ur' +
                        '    INNER JOIN spain_provinces_centroids p ON p.cod_prov=ur.prov' +
                        '   WHERE ' + dateQuery +
                        ' GROUP BY ur.prov,p.cartodb_id ORDER BY p.name';

        }else if(aggregation == App.Cons.AGG_REGION){

            query = ' SELECT r.name, count(*) as total' +
                        '    FROM ' + table + ' ur' +
                        '    INNER JOIN spain_regions_centroids r ON r.cod_region=ur.region' +
                        '   WHERE ' + dateQuery +
                        ' GROUP BY ur.region,r.cartodb_id ORDER BY r.name' ;

        }else{
            throw 'Invalid aggregation "' +  aggregation +'"';
        }

        return query;
    },
     _getQueryDiseasesPoxComparison:function(options){

        var aggregation = this._ctx._aggregation,
            date = this._ctx._dateFilter;

        var table = 'diseases_pox';
        var dateQuery = ['date_disease>=\'2013-01-01 00:00\' AND date_disease<=\'2013-12-31 23:59:59\'',
                           'date_disease>=\'2014-01-01 00:00\' AND date_disease<=\'2014-12-31 23:59:59\''];

        var query;

        if(aggregation == App.Cons.AGG_PROV){

            var template =
                'SELECT p.name, ###2013### as total_2013, ###2014### as total_2014 ' +
                        '    FROM ' + table + ' ur' +
                        '    INNER JOIN spain_provinces_centroids p ON p.cod_prov=ur.prov' +
                        '   WHERE ###where###' +
                        ' GROUP BY ur.prov,p.cartodb_id ORDER BY p.name';

        }
        else if(aggregation == App.Cons.AGG_REGION){

            var template = ' SELECT r.name, ###2013### as total_2013, ###2014### as total_2014' +
                        '    FROM ' + table + ' ur' +
                        '    INNER JOIN spain_regions_centroids r ON r.cod_region=ur.region' +
                        '   WHERE ###where###' +
                        ' GROUP BY ur.region,r.cartodb_id ORDER BY r.name' ;

        }else{
            throw 'Invalid aggregation "' +  aggregation +'"';
        }

        return  ' SELECT name, SUM(total_2013) as total_2013, SUM(total_2014) as total_2014 FROM (' +
                '('+
                    template.replace('###2013###','count(*)')
                        .replace('###2014###','0')
                        .replace('###where###',dateQuery[0]) + 
                ') UNION (' + 
                    template.replace('###2013###','0')
                    .replace('###2014###','count(*)')
                    .replace('###where###',dateQuery[1]) +
                ')' +
                ') as q' +
                ' GROUP by name ORDER BY name';
    }


});

