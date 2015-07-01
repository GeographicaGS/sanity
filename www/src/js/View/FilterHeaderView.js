'use strict';

App.View.FilterHeader = Backbone.View.extend({
    _template : $('#filter-filter_header_template').html(),
    _ctx : null,
    _filterContent:null,
    
    initialize: function(options) {
        this._ctx = options.ctx; 
        this._filterContent = options.filterContent;
        this.listenTo(App.events,'context:change',this.render);
    },

    events: {
        'click .btn.config' : 'displayFilterPanel'
    },

    displayFilterPanel:function(e){
    	this._filterContent.openFilter();
        // $(e.currentTarget).toggleClass('enabled');
    },
    
    onClose: function(){
        this.stopListening();
    },
    
    render: function(ctxData) {
    	var sectionTitles = {};
        
        this.$el.html(Mustache.render(this._template, {
            dateMin : ctxData.dateFilter.min.format('L'),
            dateMax : ctxData.dateFilter.max.format('L'),
            sectionTitle : App.tr('Casos de varicela')
        }));

        var filterOpts = this._filterContent.$el.find('.filters-row-opt select option:selected[value!=all]');
        var dateActiveFilter = this._filterContent.$el.find(".date-range .active");
        if(filterOpts.length > 0 || dateActiveFilter.length > 0){
            this.$('.btn.config').toggleClass('enabled');
        }else{
           this.$('.btn.config').removeClass('enabled'); 
        }

        return this;
    }
});