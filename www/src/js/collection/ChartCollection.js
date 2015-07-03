'use strict';

App.Collection.Chart = Backbone.Collection.extend({ 
    _username: null,
    _ctx: null,

    initialize: function(models,options) {
        this._username = options.username;
        this._ctx = options.ctx;
    },

    sync: function(method, model, options) {
        if (method == 'read'){
            var query;
            // this._ctx = options.ctx;
            var date = this._ctx._dateFilter;

            if (this._ctx._type==App.Cons.TYPE_DISEASES){
                query = 'SELECT * from diseasesPoxBySteps(\'' + date.min.format('YYYY-MM-DD') + ' 00:00:00\'::timestamp,\'' + date.max.format('YYYY-MM-DD') + ' 23:59:59\'::timestamp,' + App.Cons.STEPS + ')';
            
                var sql = new cartodb.SQL({ user: this._username });
                sql.execute(query)
                    .done(function(data) {
                        var restult = data.rows;
                        var date;
                        for(var i=0; i<restult.length; i++){
                            date = moment.utc(restult[i].d);
                            restult[i].d = date.format("YYYY-MM-DD HH:mm:ss");
                        }
                        options.success(restult);    
                    })
                    .error(function(errors) {
                        options.error(errors)
                    });
            }
            else if (this._ctx._type==App.Cons.TYPE_COMP){

                query = 'SELECT * from diseasesPoxByStepsNoCumulative(\'2013-01-01 00:00:00\',\'2013-12-31 23:59:59\',' + App.Cons.STEPS + ')';

                var result = [];
            
                var sql = new cartodb.SQL({ user: this._username });
                sql.execute(query)
                    .done(function(data) {
                        
                        for(var i=0; i<data.rows.length; i++){
                            result.push({
                                d : moment.utc(data.rows[i].d).format("YYYY-MM-DD HH:mm:ss"),
                                v2013 : data.rows[i].v
                            });
                        }
                        
                        query = 'SELECT * from diseasesPoxByStepsNoCumulative(\'2014-01-01 00:00:00\',\'2014-12-31 23:59:59\',' + App.Cons.STEPS + ')';
                        
                        sql.execute(query)
                            .done(function(data) {

                                for(var i=0; i<data.rows.length; i++){
                                    result[i]['v2014'] = data.rows[i].v
                                }
                                options.success(result);    

                            })
                            .error(function(errors) {
                                options.error(errors)
                            });
                    })
                    .error(function(errors) {
                        options.error(errors)
                    });
            }
        }
           
        else{
            throw ('Not yet implemented');
        }

    }

});