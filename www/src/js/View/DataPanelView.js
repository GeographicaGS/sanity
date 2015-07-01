'use strict';

App.View.DataPanel = Backbone.View.extend({
    _template : $('#dataPanel-data_panel_template').html(),
    _ctx : null,
    _tableView: null,
    _chartView:null,
    _filterContent:null,
    
    initialize: function(options) {
        this._ctx = options.ctx;
        this._tableView = new App.View.Table({ctx: this._ctx});
        this._chartView = options.miniChart;
        this._filterContent = options.filterContent;
        this.listenTo(this._chartView, 'viewPanel', this.viewPanel);

        this.listenTo(App.events,'context:change',this.render);
        // this.render();
    },

    events: {
        'click .toggle' : 'viewPanel',
        'click .view-mode' : 'expandPanel', 
        'click .view-controls .btn' : 'changePanel', 
        'click .view-map' : 'viewMap', 
    },

    viewPanel:function(){
        this._chartView.$el.find('.more-info').toggleClass('hide');
        this.$el.closest('#data_panel').toggleClass('open');
    },

    expandPanel:function(){
         var data_panel = this.$el.closest('#data_panel');
         data_panel.toggleClass('expand');
         if(data_panel.hasClass('expand')){
            this.$el.find('.chart-container').removeClass('hide');
            this.$el.find('.table-container').removeClass('hide');

            var filterOpts = this._filterContent.$el.find('.filters-row-opt select option:selected[value!=all]');
            var dateActiveFilter = this._filterContent.$el.find(".date-range .active");
            if(filterOpts.length > 0 || dateActiveFilter.length > 0){
                this.$('.alert').removeClass('hide');
            }else{
               this.$('.alert').addClass('hide'); 
            }

         }else{
            this.$el.find('.chart-container').addClass('hide');
            this.$el.find('.table-container').addClass('hide');
            this.$el.find('.' + this.$el.find('.view-controls .btn.active').attr('type')).removeClass('hide');
         }
    },

    changePanel:function(e){
        this.$el.find('.view-controls .btn').removeClass('active');
        this.$el.find('.chart-container').addClass('hide');
        this.$el.find('.table-container').addClass('hide');
        $(e.currentTarget).addClass('active');
        this.$el.find('.' + $(e.currentTarget).attr('type')).removeClass('hide');        
    },

    viewMap:function(){
        var data_panel = this.$el.closest('#data_panel');
        data_panel.removeClass('open');
        data_panel.removeClass('expand');
        this._chartView.$el.find('.more-info').toggleClass('hide');
    },
    
    onClose: function(){
        if(this._tableView){
            this._tableView.close();
        }
        if(this._chartView){
            this._chartView.close();
        }
        this.stopListening();
    },
    
    render: function(ctxData) {

        if (ctxData.type==App.Cons.TYPE_TWEETS){
            this.$el.closest('#data_panel').hide();
            return this;
        }
        else{
            this.$el.closest('#data_panel').show();
        }
        
        var sectionTitles = {};
        sectionTitles[App.Cons.TYPE_REG] =  App.tr('Altas en España');

        if(ctxData.aggregation == App.Cons.NOAGG){
            sectionTitles[App.Cons.TYPE_REG] =  App.tr('Últimas 20 Altas en España');
            sectionTitles[App.Cons.TYPE_PETROLPUMP] =  App.tr('Últimos 20 pagos en España');
        }else{
            sectionTitles[App.Cons.TYPE_REG] =  App.tr('Altas en España');
            sectionTitles[App.Cons.TYPE_PETROLPUMP] =  App.tr('Pagos en España');
        }
        sectionTitles[App.Cons.TYPE_TWEETS] =  App.tr('Tuits');

        var view = Mustache.render(this._template, {
                        dateMin : ctxData.dateFilter.min.format('L'),
                        dateMax : ctxData.dateFilter.max.format('L'),
                        name:sectionTitles[ctxData.type]
                    });
        this.setElement($(view).replaceAll(this.el));
        if(this.$el.closest('#data_panel').hasClass('expand')){
            this.$('.chart-container').removeClass('hide');
        }

        // this.$el.html(Mustache.render(this._template, {
        //     dateMin : ctxData.dateFilter.min.format('L'),
        //     dateMax : ctxData.dateFilter.max.format('L'),
        //     name:sectionTitles[ctxData.type]
        // }));

        this.$el.find('.table-container').html(this._tableView.$el);
        return this;
    }
});