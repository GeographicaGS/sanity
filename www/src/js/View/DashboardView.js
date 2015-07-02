'use strict';

App.View.Dashboard = Backbone.View.extend({
	_ctx : null,
	_template : $('#dashboard-dashboard_template').html(),
	
    initialize: function(options) {
        this._ctx = options.ctx;
        this.render();
    },

    events: {
        'click a[data-type]' : 'moveSection',
    },

    moveSection:function(e){
        e.preventDefault();

        var $e = $(e.currentTarget),
            type = $e.attr('data-type');


        this._ctx._type = type;

        App.router.navigate(this._ctx.url(), {trigger: true});
    },
    
    onClose: function(){
        this.stopListening();
    },
    
    render: function(ctxData) {

    	var _this = this;
    	var sql = new cartodb.SQL({ user: App.config.account});
    	
    	// sql.execute('SELECT '+
     //      '(SELECT count(cartodb_id) FROM alasarr.diseases_pox) as total' +
     //      ',(SELECT count(cartodb_id) ' +
     //      ' FROM alasarr.diseases_pox ' +
     //      '  WHERE date_disease>=\'2013-01-01 00:00\' AND date_disease<=\'2013-12-31 23:59:59\') as total_2013,' +
     //      '(SELECT count(cartodb_id) ' +
     //      '  FROM alasarr.diseases_pox ' +
     //      '  WHERE date_disease>=\'2014-01-01 00:00\' AND date_disease<=\'2014-12-31 23:59:59\') as total_2014')
        sql.execute('SELECT count(cartodb_id) as total FROM diseases_pox')
              .done(function(data) {
                  var data = data.rows[0];
                  _this.$el.html(Mustache.render(_this._template,{
                          total : App.formatNumber(data.total),
                          //total_2013 : App.formatNumber(data.total_2013),
                          //total_2014 : App.formatNumber(data.total_2014),
                          cons: App.Cons
                        }));
                  
              })
              .error(function(errors) {
                  throw errors;
              });

      

		return this;
    }
});