'use strict';

App.View.MiniChart = Backbone.View.extend({
    _ctx : null,
    _template : $('#chart-mini_chart_template').html(),
    _collection:null,
    
    initialize: function(options) {
        this._ctx = options.ctx;
        this._collection = options.collection;
        this.listenTo(this._collection, "reset", this.render);
    },

    events: {
        'click .more-info' : 'moreInfo'
    },

    moreInfo:function(){
        this.trigger("viewPanel");
    },
    
    onClose: function(){
        // Remove events on close
        this.stopListening();
    },
    
    render: function() {
  
        var ctx = this._ctx.toJSON();
        var data = this._collection.toJSON();
        this.$el.html(Mustache.render(this._template, {
            name : App.tr('Casos totales'),
            cons: App.Cons
        }));
        
        this.$('.data-numbers[data-type]').hide();
        this.$('.data-numbers[data-type=\''+ ctx.type + '\']').show();
        if (ctx.type == App.Cons.TYPE_COMP){
            this._drawChartComparison(this._collection.toJSON());  
        }
        else{
            this._drawChartNominal(this._collection.toJSON());
        }
        
        this._getSummaryData();
        return this;
    },

    _drawChartComparison: function(data){
        var margin = {top: 10, right: 16, bottom: 30, left: 25},
            width = 284,
            height = 74;
        
        var parseDate = d3.time.format("%Y-%m-%d %H:%M:%S").parse;

        data.forEach(function(d) {
          d.d = parseDate(d.d);
        });
        
        var x = d3.time.scale().range([0, width]);
        var y = d3.scale.linear().range([height, 0]);
        var xAxis = d3.svg.axis().scale(x).orient("bottom").ticks(5).tickSize(0, 0).tickFormat(d3.time.format("%d-%b"));
        // var xAxis = d3.svg.axis().scale(x).orient("bottom").tickFormat(d3.time.format("%Y-%m-%d %H:%M:%S"));
        var yAxis = d3.svg.axis().scale(y).orient("left");
        
        var area = d3.svg.area().x(function(d) {
                    return x(d.d); 
                  })
                  .y0(height).y1(function(d) {
                    return y(d.v2013); 
                  });

        var line2013 = d3.svg.line()
            .x(function(d) { return x(d.d); })
            .y(function(d) { return y(d.v2013); });

        var line2014 = d3.svg.line()
            .x(function(d) { return x(d.d); })
            .y(function(d) { return y(d.v2014); });

        var svg = d3.select("#charts_panel .data-graph").html('').append("svg")
                  .attr("width", width + margin.left + margin.right)
                  .attr("height", height + margin.top + margin.bottom)
                  .append("g")
                  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        svg.append('rect')
            .attr('x',0)
            .attr('y',0)
            .attr('height', height)
            .attr('width', width)
            .attr("class","interactiveZone");

        x.domain(d3.extent(data, function(d) { 
          return d.d; 
        }));

        y.domain([0, d3.max(data, function(d) { 
          return d3.max([d.v2013,d.v2014]); 
        })]);


        svg.append("path")
            .datum(data)
            .attr("class", "area")
            .attr("d", area);

        svg.append("path")
              .datum(data)
              .attr("class", "line")
              .attr("d", line2013);

        svg.append("path")
              .datum(data)
              .attr("class", "line line2014")
              .attr("d", line2014);

        var guideline = svg.append('line')
          .attr('stroke', '#333')
          .attr('stroke-width', 1)
          .attr('class', 'guide')
          .attr('x1', 1)
          .attr('y1', 1)
          .attr('x2', 1)
          .attr('y2', height)
          .attr('transform', 'translate(' + width + ')');

        var numDecimal = 0;
        
        var circles = svg.selectAll("circle") 
                .data(data) 
                .enter() 
                .append("svg:circle")
                .attr('class', 'circle')
                .attr("r","0")
                .attr("cx", function(d) { return x(d.d); }) 
                .attr("cy", function(d) { return y(d.v2013); })
                .attr("value",function(d) { return App.formatNumber(d.v2013,numDecimal); })
                .attr("date",function(d) { 
                  return d.d.getDate() + "/" + (d.d.getMonth() + 1) + "/" + d.d.getFullYear(); 
                })
                ; 

        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);

        // svg.append("g")
        //     .attr("class", "y axis")
        //     .call(yAxis);

        var text = svg.append("text")
                    .attr('class', 'text')
                    .attr("x", 0)
                    .attr("y", 0);

        svg.selectAll("rect.interactiveZone, path.area, path.line, text.text").on('mousemove', function() {
          var circle,
              minDist = Infinity,
              dist,
              x = d3.mouse(this)[0],
              y = d3.mouse(this)[1],
              textLength;

          circles[0].forEach(function(d) {
            d = d3.select(d);
            dist = Math.abs(d.attr("cx") - x);
            if(dist < minDist){
              minDist = dist;
              circle = d;      
            }
          });

          svg.selectAll("circle.active").classed("active",false).attr("r","0");
          circle.classed("active",true);
          circle.transition().duration(300).attr("r","3")

          guideline.attr('transform', 'translate(' + (x-1) + ')');
          text.html('<tspan class="text_bold">' + circle.attr("value") + '</tspan><tspan> (' + circle.attr("date") + ")<tspan>");
          textLength = text.node().getComputedTextLength();
          text.attr("y", parseInt(circle.attr("cy")) + 3);
          
          if(parseFloat(circle.attr("cx")) + textLength > width){
            text.attr("x", x - textLength - 10);
          }else{
            text.attr("x", x+10);
          }
      });

    },

    _drawChartNominal:function(data){
        var margin = {top: 10, right: 16, bottom: 30, left: 25},
            width = 284,
            height = 74;
        
        var parseDate = d3.time.format("%Y-%m-%d %H:%M:%S").parse;

        data.forEach(function(d) {
          d.d = parseDate(d.d);
        });
        
        var x = d3.time.scale().range([0, width]);
        var y = d3.scale.linear().range([height, 0]);
        var xAxis = d3.svg.axis().scale(x).orient("bottom").ticks(5).tickSize(0, 0).tickFormat(d3.time.format("%d-%b"));
        // var xAxis = d3.svg.axis().scale(x).orient("bottom").tickFormat(d3.time.format("%Y-%m-%d %H:%M:%S"));
        var yAxis = d3.svg.axis().scale(y).orient("left");
        
        var area = d3.svg.area().x(function(d) {
                    return x(d.d); 
                  })
                  .y0(height).y1(function(d) {
                    return y(d.v); 
                  });

        var line = d3.svg.line()
            .x(function(d) { return x(d.d); })
            .y(function(d) { return y(d.v); });

        var svg = d3.select("#charts_panel .data-graph").html('').append("svg")
                  .attr("width", width + margin.left + margin.right)
                  .attr("height", height + margin.top + margin.bottom)
                  .append("g")
                  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        svg.append('rect')
            .attr('x',0)
            .attr('y',0)
            .attr('height', height)
            .attr('width', width)
            .attr("class","interactiveZone");

        x.domain(d3.extent(data, function(d) { 
          return d.d; 
        }));

        y.domain([0, d3.max(data, function(d) { 
          return d.v; 
        })]);

        svg.append("path")
            .datum(data)
            .attr("class", "area")
            .attr("d", area);

        svg.append("path")
              .datum(data)
              .attr("class", "line")
              .attr("d", line);


        var guideline = svg.append('line')
          .attr('stroke', '#333')
          .attr('stroke-width', 1)
          .attr('class', 'guide')
          .attr('x1', 1)
          .attr('y1', 1)
          .attr('x2', 1)
          .attr('y2', height)
          .attr('transform', 'translate(' + width + ')');

        var numDecimal = 0;
        if(this._ctx._type == App.Cons.TYPE_PETROLPUMP){
          numDecimal = 2     
        }

        var circles = svg.selectAll("circle") 
                .data(data) 
                .enter() 
                .append("svg:circle")
                .attr('class', 'circle')
                .attr("r","0")
                .attr("cx", function(d) { return x(d.d); }) 
                .attr("cy", function(d) { return y(d.v); })
                .attr("value",function(d) { return App.formatNumber(d.v,numDecimal); })
                .attr("date",function(d) { 
                  return d.d.getDate() + "/" + (d.d.getMonth() + 1) + "/" + d.d.getFullYear(); 
                })
                ; 

        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);

        // svg.append("g")
        //     .attr("class", "y axis")
        //     .call(yAxis);

        var text = svg.append("text")
                    .attr('class', 'text')
                    .attr("x", 0)
                    .attr("y", 0);

        svg.selectAll("rect.interactiveZone, path.area, path.line, text.text").on('mousemove', function() {
          var circle,
              minDist = Infinity,
              dist,
              x = d3.mouse(this)[0],
              y = d3.mouse(this)[1],
              textLength;

          circles[0].forEach(function(d) {
            d = d3.select(d);
            dist = Math.abs(d.attr("cx") - x);
            if(dist < minDist){
              minDist = dist;
              circle = d;      
            }
          });

          svg.selectAll("circle.active").classed("active",false).attr("r","0");
          circle.classed("active",true);
          circle.transition().duration(300).attr("r","3")

          guideline.attr('transform', 'translate(' + (x-1) + ')');
          text.html('<tspan class="text_bold">' + circle.attr("value") + '</tspan><tspan> (' + circle.attr("date") + ")<tspan>");
          textLength = text.node().getComputedTextLength();
          text.attr("y", parseInt(circle.attr("cy")) + 3);
          
          if(parseFloat(circle.attr("cx")) + textLength > width){
            text.attr("x", x - textLength - 10);
          }else{
            text.attr("x", x+10);
          }
      });
    },

    _getSummaryData:function(){
      var query;
      var _this = this;
      var aggregation = this._ctx.aggregation,
          date = this._ctx._dateFilter;
      var sql = new cartodb.SQL({ user: App.config.account });
                            
      if (this._ctx._type==App.Cons.TYPE_DISEASES){

        var queryTotal = 'SELECT count(*) as total FROM diseases_pox' + ' WHERE ' + 
                'date_disease >=\'' + date.min.format('YYYY-MM-DD') + ' 00:00:00\' ::timestamp' +
                          ' AND date_disease <=\'' + date.max.format('YYYY-MM-DD') + ' 23:59:59\' ::timestamp'

        var queryDays = 'count(*) as last_days FROM diseases_pox' + ' WHERE ' + 
                  'date_disease >= \'' + date.max.subtract('7','days').format('YYYY-MM-DD') + ' 00:00:00\' ::timestamp' +
                  ' AND date_disease <=\'' + date.max.add('7','days').format('YYYY-MM-DD') + ' 23:59:59\' ::timestamp'

        var query = 'SELECT (' + queryTotal + ') as total, ' + queryDays

        sql.execute(query)
            .done(function(data) {
                var data = data.rows[0];
                _this.$('.tot-applications .data').text(App.formatNumber(data.total,0));   
                _this.$('.timeframe .data').text(App.formatNumber(data.last_days,0));
            })
            .error(function(errors) {
                options.error(errors)
            });

      }

      else if (this._ctx._type==App.Cons.TYPE_COMP){
        var query = 'SELECT  ' +
                      '(SELECT count(*) FROM diseases_pox'+
                      ' WHERE date_disease >=\'2013-01-01 00:00:00\' AND date_disease <=\'2013-12-31 23:59:59\'' +
                      ' ) as total_2013,'+
                      '(SELECT count(*) FROM diseases_pox'+
                      ' WHERE date_disease >=\'2014-01-01 00:00:00\' AND date_disease <=\'2014-12-31 23:59:59\'' +
                      ' ) as total_2014';

        sql.execute(query)
            .done(function(data) {
                var data = data.rows[0];
                _this.$('.data[data-year=\'2013\']').text(App.formatNumber(data.total_2013,0));   
                _this.$('.data[data-year=\'2014\']').text(App.formatNumber(data.total_2014,0));
            })
            .error(function(errors) {
                options.error(errors)
            });
      }


    }

});