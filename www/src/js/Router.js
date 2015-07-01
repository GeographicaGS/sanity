"use strict";

var app = app || {};

App.Router = Backbone.Router.extend({
    _ctx : null,
    _map : null,

    routes : function(){
        var routes = {}
        routes[''] = 'start';
        routes['('+ App.Cons.TYPES.join('|') +'):type/(noagg|prov|region):agg/(running|pause|noanimation):animation/:date/:filter'] = 'request';
        routes['notfound'] = 'notfound';
        routes['error'] = 'error';
        routes['*other'] = 'notfound';
        return routes;
    },

    initialize: function(opts) {
        this._ctx = opts.ctx;
        this._map = opts.map;
    },
    
    start: function(){
        // this.navigate(this._ctx.url(),{trigger: false});
        
        // Nothind to do with the context. Default values
        this._ctx.update({
            type : App.Cons.TYPE_DASHBOARD
        },false);

        //this._map._userRegistrationsAnimated();
        App.showView(new App.View.Dashboard({ctx:this._ctx}));
    },  

    request: function(type,agg,animation,date,filter){
        if (!this._ctx.fromURL(type,agg,animation,date,filter)){
            this.navigate("notfound",{trigger: true});
        }
        else{
            // force to render all
            App.showView(new App.View.MainBoard({ctx:this._ctx}));
            this._ctx.update({});
        }

    },

    notfound: function(){
        App.showView(new App.View.NotFound());
    },

    error: function(){
        App.showView(new App.View.Error());
    }
    
});