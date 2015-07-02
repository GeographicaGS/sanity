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
                view['diseases_noagg'] = {'col1':App.tr('Provincia'),'col2':App.tr('Nombre'),'col4':App.tr('Fecha')};
            }else if(ctxData.aggregation == App.Cons.AGG_PROV){
                view['diseases_prov'] = {'col1':App.tr('Provincia'),'col2':App.tr('Casos')}
            }
            else if(ctxData.aggregation == App.Cons.AGG_REGION){
                view['diseases_region'] = {'col1':App.tr('Comunidad autónoma'),'col2':App.tr('Casos')}
            }
        }

        else if (ctxData.type == App.Cons.TYPE_COMP){
            if(ctxData.aggregation == App.Cons.AGG_PROV){
                view['comp'] = {'col1':App.tr('Provincia'),'col2':App.tr('Casos año 2013'),'col3':App.tr('Casos año 2014')}
            }
            else if(ctxData.aggregation == App.Cons.AGG_REGION){
                view['comp'] = {'col1':App.tr('Comunidad autónoma'),'col2':App.tr('Casos año 2013'),'col3':App.tr('Casos año 2014')}
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
                data['diseases_noagg'] = this._collection.toJSON();
            }else if(aggregation == App.Cons.AGG_PROV){
                data['diseases_prov'] = this._parseNumbersCollection(this._collection.toJSON(),'total',0);
            }
            else if(aggregation == App.Cons.AGG_REGION){
                data['diseases_region'] = this._parseNumbersCollection(this._collection.toJSON(),'total',0);
            }
        }
        else if (type == App.Cons.TYPE_COMP){
            
            var data = this._collection.toJSON();
            this._parseNumbersCollection(data,'total_2013',0);
            this._parseNumbersCollection(data,'total_2014',0);
            data['comp_data'] = data;

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