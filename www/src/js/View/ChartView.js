'use strict';

App.View.Chart = Backbone.View.extend({
    _collection:null,
    _ctx : null,
    
    initialize: function(options) {
        this._ctx = options.ctx;
        this._collection = options.collection;
        this.listenTo(this._collection, "reset", this.render);
    },
    
    onClose: function(){
        this.stopListening();
    },
    
    render: function() {
        var data = this._collection.toJSON();
        var margin = {top: 20, right: 25, bottom: 40, left: 65},
            width = $("body").width() - $("header").width() - 105,
            height = ($("body").height() * 0.33) - 70;
        
        var parseDate = d3.time.format("%Y-%m-%d %H:%M:%S").parse;

        data.forEach(function(d) {
          d.d = parseDate(d.d);
        });
        
        var x = d3.time.scale().range([0, width]);
        var y = d3.scale.linear().range([height, 0]);
        var xAxis = d3.svg.axis().scale(x).orient("bottom").tickSize(5).tickPadding(10).tickFormat(d3.time.format("%d-%b"));
        // var xAxis = d3.svg.axis().scale(x).orient("bottom").tickFormat(d3.time.format("%Y-%m-%d %H:%M:%S"));
        var yAxis = d3.svg.axis().scale(y).orient("left").ticks(4).tickPadding(10).tickSize(0, 0).tickFormat(d3.format('.0f'));
        
        var area = d3.svg.area().x(function(d) {
                    return x(d.d); 
                  })
                  .y0(height).y1(function(d) {
                    return y(d.v); 
                  });

        var line = d3.svg.line()
            .x(function(d) { return x(d.d); })
            .y(function(d) { return y(d.v); });

        var svg = d3.select("#data_panel .chart-container").html('').append("svg")
                  .attr("width", width + margin.left + margin.right)
                  .attr("height", height + margin.top + margin.bottom)
                  .append("g")
                  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        var line = d3.svg.line()
            .x(function(d) { return x(d.d); })
            .y(function(d) { return y(d.v); });

        function make_y_axis() {
          return d3.svg.axis()
              .scale(y)
              .orient("left")
              .ticks(4)
        }

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

        svg.append("g")            
            .attr("class", "grid")
            .call(make_y_axis()
                .tickSize(-width, 0, 0)
                .tickFormat("")
            );

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

        svg.append("g")
            .attr("class", "y axis")
            .call(yAxis);

        var textRect = svg.append('rect')
                        .attr('x',0)
                        .attr('y',0)
                        .attr('rx',2)
                        .attr('ry',2)
                        .attr('height', 30)
                        // .attr('width', 165)
                        .attr("class","textRect");
        
        var text = svg.append("text")
                    .attr('class', 'text')
                    .attr("x", 0)
                    .attr("y", 0);

        // var text = svg.append("text")
        //             .attr('class', 'text')
        //             .attr("x", 0)
        //             .attr("y", 0);

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
          circle.transition().duration(300).attr("r","5")

          guideline.attr('transform', 'translate(' + (x-2) + ')');
          text.html('<tspan class="first">' + circle.attr("value") + '</tspan> <tspan> (' + circle.attr("date") + ")</tspan>");
          textLength = text.node().getComputedTextLength() + 20;
         
          textRect.attr("y", parseFloat(circle.attr("cy")) - 16);
          textRect.attr("width", textLength);

          text.attr("y", parseFloat(circle.attr("cy")) + 3);
          
          if(parseFloat(circle.attr("cx")) + textLength > width){
            text.attr("x", x - textLength);
            textRect.attr("x", x - textLength - 10);
          }else{
            text.attr("x", x+20);
            textRect.attr("x", x+10);
          }
      });
    }
});