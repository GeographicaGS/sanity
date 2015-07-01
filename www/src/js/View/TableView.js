'use strict';

App.View.Table = Backbone.View.extend({
    el: null,
    _ctx : null,
    _template : $('#table-table_template').html(),
    _templatePage : $('#table-table_page_template').html(),
    _collection : null,

    initialize: function(options) {
        this._ctx = options.ctx;

        this._collection = new App.Collection.Table({},{
            'username' : App.config.account,
            'ctx' : this._ctx
        });
        this.listenTo(this._collection, "reset", this._renderTable);
        this.listenTo(App.events,'context:change',this.render);
    },
 
    onClose: function(){
        this.stopListening();  
    },

    render: function(ctxData) {
        var view = {};

        if (!ctxData){
            ctxData = this._ctx.toJSON();
        }

        this._collection.fetch({ reset: true });
        if (ctxData.type == App.Cons.TYPE_DISEASES){
            if(ctxData.aggregation == App.Cons.NOAGG){
                view['registrations_noagg'] = {'col1':App.tr('Provincia'),'col2':App.tr('Nombre'),'col4':App.tr('Fecha')};
            }else if(ctxData.aggregation == App.Cons.AGG_PROV){
                view['registrations_prov'] = {'col1':App.tr('Provincia'),'col2':App.tr('Casos')}
            }
            else if(ctxData.aggregation == App.Cons.AGG_REGION){
                view['registrations_region'] = {'col1':App.tr('Comunidad autónoma'),'col2':App.tr('Casos')}
            }
        }

        this.setElement($(Mustache.render(this._template, view)).replaceAll(this.el));
    },

    _renderTable:function(){
        var type = this._collection._ctx._type,
            aggregation = this._collection._ctx._aggregation;
        var data = {};
        if (type == App.Cons.TYPE_DISEASES){
            if(aggregation == App.Cons.NOAGG){
                data['registrations_noagg'] = this._collection.toJSON();
            }else if(aggregation == App.Cons.AGG_PROV){
                data['registrations_prov'] = this._parseNumbersCollection(this._collection.toJSON(),'total',0);
            }
            else if(aggregation == App.Cons.AGG_REGION){
                data['registrations_region'] = this._parseNumbersCollection(this._collection.toJSON(),'total',0);
            }
        }
        
        this.$('tbody').html(Mustache.render(this._templatePage, data));
        return this;
    },

    _parseNumbersCollection:function(values,key,decimals){
        for(var i=0; i<values.length; i++){
            values[i][key] = App.formatNumber(values[i][key],decimals)
        }
        return values;
    }

});