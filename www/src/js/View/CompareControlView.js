'use strict';

App.View.CompareControl = Backbone.View.extend({
    _ctx: null,
    className : 'compare-mode',
    initialize: function(options) {
        this._ctx = options.ctx;
        this.listenTo(App.events,'context:change',this.render);
        this._previousType = App.Cons.TYPE_DISEASES;
    },
    events: {
      'click a' : 'toggle',
    },

    onClose: function(){
      this.stopListening();
    },
    
    render: function(ctxData) {
      if (!ctxData){
        ctxData = this._ctx.toJSON();
      }

      if (ctxData.type == App.Cons.TYPE_DISEASES || ctxData.type== App.Cons.TYPE_COMP){
        this.$el.html('<a href="#" class="split-icon"></a>');

        if (ctxData.type==App.Cons.TYPE_COMP){
          this.$('a').addClass('enabled');
        }
        else{
          this._previousType = ctxData.type;
          this.$('a').removeClass('enabled');
        }  
        this.$el.show();
      }
      else{
        this.$el.hide();
      }
      
    },

    toggle: function(e){
      e.preventDefault();
      var ctxData = this._ctx.toJSON();
      this._ctx.update({
        'type' : ctxData.type==App.Cons.TYPE_COMP ? this._previousType : App.Cons.TYPE_COMP
      });
    }
});