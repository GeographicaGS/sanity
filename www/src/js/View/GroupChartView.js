'use strict';

App.View.GroupChart = Backbone.View.extend({
	_ctx : null,
	_collection:null,
	_chartView:null,
	_miniChartView:null,

    initialize: function(options) {
        this._ctx = options.ctx;
        this._collection = new App.Collection.Chart({},{
            'username' : 'alasarr',
            'ctx' : this._ctx
        });
        this._chartView = new App.View.Chart({collection:this._collection, ctx:this._ctx});
        this._miniChartView = new App.View.MiniChart({collection:this._collection, ctx:this._ctx});
		this.listenTo(App.events,'context:change',this.render);
    },

    getMiniChart:function(){
    	return this._miniChartView;
    },
    
    onClose: function(){
        this._chartView.close();
        this._miniChartView.close();
        this.stopListening();
    },
    
    render: function(ctxData) {
    	this._collection.fetch({ reset: true });
    }
});