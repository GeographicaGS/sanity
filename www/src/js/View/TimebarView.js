'use strict';

App.View.Timebar = Backbone.View.extend({
    _template : $('#timebar-timebar_template').html(),
    
    initialize: function() {
        this.listenTo(App.events,'context:change',this.render);
    },

    events: {
        'click .btn-play-open, .btn-play-close' : 'displayTimeLine',
    },

    displayTimeLine:function(e){
        this.$el.find(".btn-play-open").toggleClass('hidden');
        this.$el.find(".timebar-container").toggleClass('active');
    },
    
    onClose: function(){
        this.stopListening();
    },
    
    render: function(ctxData) {
        // this.$el.html(Mustache.render(this._template, {}));
        return this;
    }
});