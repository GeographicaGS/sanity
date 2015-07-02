'use strict';

App.View.Sidebar = Backbone.View.extend({
    el: '',
    _template : $('#sidebar-sidebar_template').html(),
    _ctx : null,
    
    initialize: function(options) {
        this._ctx = options.ctx;
        this.listenTo(App.events,'context:change',this.render);
    },

    events: {
        'click ul li' : 'changeSection',
        'click .login' : 'login'
    },

    changeSection:function(e){

        var current = $(e.target).attr('data-section');
        if(App.Cons.TYPES.indexOf(current)==-1){
            alert("Funcionalidad en desarrollo");
        }
        else{
            this._ctx.update({
                type: current
            });
        }
    },

    login:function(){
        alert("Funcionalidad en desarrollo");
    },
    
    onClose: function(){
        this.stopListening();
    },
    
    render: function(ctxData) {
        var view = Mustache.render(this._template, {
                        cons : App.Cons
                    });
        
        this.setElement($(view).replaceAll(this.el));

        this.$el.find('li').removeClass('current');
        this.$el.find('li[class=' + ctxData.type + ']').addClass('current')
        return this;
    }
});