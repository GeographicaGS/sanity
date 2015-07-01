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

                // if(query){
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
                // }

            }
        }
           
        else{
            throw ('Not yet implemented');
        }

    },
    // _userRegistrationsNoAnimated:function(){
    //     var date = this._ctx.dateFilter;
    //     return 'SELECT * from userRegistrationsBySteps(\'' + date.min.format('YYYY-MM-DD') + '\'::timestamp,\'' + date.max.format('YYYY-MM-DD') + '\'::timestamp,' + App.Cons.STEPS + ')';
    // },

    // _petrolPumpTransactions:function(){
    //     var date = this._ctx.dateFilter;
    //     return 'SELECT * from transactionsBySteps(\'' + date.min.format('YYYY-MM-DD') + '\'::timestamp,\'' + date.max.format('YYYY-MM-DD') + '\'::timestamp,' + App.Cons.STEPS + ')';
    // }

});