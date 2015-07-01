'use strict';

App.View.Filter = Backbone.View.extend({
    _template : $('#filter-filter_template').html(),
    _ctx : null,
    
    initialize: function(options) {
        this._ctx = options.ctx;    
    
        this.listenTo(App.events,'context:change',this.render);
    },

    events: {
        'change .txt-big input' : 'changeDate',
        'click .dropdown-container' : 'displayDrow',
        'click .dropdown-container .dropdown li' : 'changeDropdown',
        //'click .dropdown-container .dropdown[type="aggregation"] li' : 'changeAggregation',
        'change select#aggregation' : 'changeAggregation',
        'change .filters-row-opt select' : 'changeFilter',
        'click .filters-reset' : 'resetFilters'
    },

    changeDate: function(){
        
        this._ctx.update({
            dateFilter: {
                min: moment(this.$('#startDate').val(),moment.localeData().longDateFormat('L').substring(0,8)),
                max: moment(this.$('#endDate').val(),moment.localeData().longDateFormat('L').substring(0,8)),
            }
        });
    },

    displayDrow:function(e){
        $(e.currentTarget).toggleClass('open');
    },

    changeDropdown:function(e){     
        var text = $(e.currentTarget).text();
        $(e.currentTarget).closest('.dropdown-container').find('.label').text(text);
        $(e.currentTarget).closest('.dropdown-container').find('li').removeClass('hidden');
        $(e.currentTarget).closest('.dropdown-container').find('li:contains("' + text + '")').addClass('hidden');
    },

    changeAggregation:function(e){
        this._ctx.update({
            aggregation : $(e.currentTarget).val()
        });
    },

    changeFilter:function(){
        var filters = [];

        this.$('.filters-row-opt select[filter-name]').each(function(){
             filters.push({
                'name' : $(this).attr('filter-name'),
                'value' : $(this).val()
            })
        });

        this._ctx.update({
            filters : filters
        });
    },

    openFilter:function(){
        this.$el.parent().toggleClass('open');
    },

    resetFilters:function(){
        var filters = this._ctx._filters;
        for(var i=0; i<filters.length; i++){
            filters[i].value = 'all'
        }
        this._ctx.update({
            dateFilter: {
                min: moment(App.Cons.INI_MIN_DATE),
                max: moment(App.Cons.INI_MAX_DATE)
            },
            filters:filters
        });
    },
    
    onClose: function(){
        this.stopListening();
    },
    
    render: function(ctxData) {
        // this.$el.find('.filters-row-opt').hide();

        if (ctxData.type==App.Cons.TYPE_TWEETS){
            this.$el.hide();
            return this;
        }
        else{
            this.$el.show();
        }

        var view = Mustache.render(this._template, {
                        dateMin : ctxData.dateFilter.min.format('DD/MM/YY'),
                        dateMax : ctxData.dateFilter.max.format('DD/MM/YY'),
                        noaggTitle: App.tr('por Localización')
                    });

        this.setElement($(view).replaceAll(this.el));

        if(ctxData.dateFilter.min.diff(App.Cons.MIN_DATE,'days') == 0){
            this.$('#startDateLabel').removeClass('active');
        }else{
            this.$('#startDateLabel').addClass('active');
        }

        if(ctxData.dateFilter.max.diff(moment(),'days') == 0){
            this.$('#endDateLabel').removeClass('active');
        }else{
            this.$('#endDateLabel').addClass('active');
        }

        this.$('.filters-row-opt').addClass('hide');
        var typeFilters =  this.$('.filters-row-opt[type=' + ctxData.type + ']');
        // make filters visible
        typeFilters.removeClass('hide');

        for (var i=0;i<ctxData.filters.length;i++){
            var $sel = this.$('select[filter-name="' + ctxData.filters[i].name + '"]');
            $sel.val(ctxData.filters[i].value);
        }

        this.$('.filters-reveal-wrapper').removeClass('registrations recharges').addClass(ctxData.type);

        this.$('select#aggregation').val(ctxData.aggregation);
        
        this.$('.txt-big input').datepicker({
            dateFormat: moment.localeData().longDateFormat('L').toLowerCase().substring(0,7),
            minDate : new Date(App.Cons.MIN_DATE),
            maxDate : new Date()
        });

        return this;
    }
});