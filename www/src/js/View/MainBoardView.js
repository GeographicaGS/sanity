'use strict';

App.View.MainBoard = Backbone.View.extend({
	_template : $('#mainBoard-main_board_template').html(),
    _ctx : null,
    _sidebar:null,
    _filterContent:null,
    _filterHeader:null,
    _groupChart : null,
    _dataPanel:null,
    _timebar:null,
	
    initialize: function(options) {
        this._ctx = options.ctx;
        this._sidebar = new App.View.Sidebar({ctx: this._ctx})
        this._filterContent = new App.View.Filter({ctx: this._ctx});
        this._filterHeader = new App.View.FilterHeader({ctx: this._ctx, filterContent:this._filterContent});
        this._groupChart = new App.View.GroupChart({ctx: this._ctx}),
        this._dataPanel = new App.View.DataPanel({ctx: this._ctx, miniChart:this._groupChart.getMiniChart(), filterContent:this._filterContent}),
        this._timebar = new App.View.Timebar({ctx: this._ctx});
        this.render();
    },

    onClose: function(){
        this._sidebar.close();
        this._filterContent.close();
        this._filterHeader.close();
        this._groupChart.close();
        this._dataPanel.close();
        this._timebar.close();
        this.stopListening();
    },
    
    render: function(ctxData) {
    	this.$el.html(this._template);
        this.$('header').html(this._sidebar.el);
        this.$('#filter_content').html(this._filterContent.el);
        this.$('#filter_header').html(this._filterHeader.el);
        this.$('#charts_panel').html(this._groupChart.getMiniChart().el);
        this.$('#data_panel').html(this._dataPanel.el);
        this.$('#timebar_panel').html(this._timebar.el);
		return this;
    }
});