/* Utility class to handle creation of an interactive layer.
This places a rectangle on top of the chart. When you mouse move over it, it sends a dispatch
containing the X-coordinate. It can also render a vertical line where the mouse is located.

*/
nv.interactiveGuideline = function() {
	var tooltip = nv.models.tooltip();
	//Public settings
	var width = null
	, height = null
	, xScale = d3.scale.linear()
	, yScale = d3.scale.linear()
	, dispatch = d3.dispatch('elementMousemove', 'elementMouseout')
	, showGuideLine = true
	;

	//Private variables
	var previousXCoordinate = null
	;

	function layer(selection) {
		selection.each(function(data) {
				var container = d3.select(this);

				var availableWidth = (width || 960), availableHeight = (height || 400);

				var wrap = container.selectAll("g.nv-wrap.nv-interactiveLineLayer").data([data]);
				var wrapEnter = wrap.enter()
								.append("g").attr("class", " nv-wrap nv-interactiveLineLayer");
								
				
				wrapEnter.append("g").attr("class","nv-interactiveGuideLine");
				wrapEnter.append("rect").attr("class", "nv-mouseMoveLayer");
				

				wrap.select(".nv-mouseMoveLayer")
					  .attr("width",availableWidth)
				      .attr("height",availableHeight)
				      .attr("opacity", 0)
				      .on("mousemove",function() {
				          var mouseX = d3.mouse(this)[0];
				          var mouseY = d3.mouse(this)[1];
				          var pointXValue = xScale.invert(mouseX);
				          dispatch.elementMousemove({
				          		mouseX: mouseX,
				          		mouseY: mouseY,
				          		pointXValue: pointXValue,
				          });
				      	  
				      })
				      .on("mouseout",function() {
				          var mouseX = d3.mouse(this)[0];
				          var mouseY = d3.mouse(this)[1];
				          
					      dispatch.elementMouseout({
					          		mouseX: mouseX,
					          		mouseY: mouseY,
					      });

					      layer.renderGuideLine(null);
				     
				      })
				      ;

				 //Draws a vertical guideline at the given X postion.
				 layer.renderGuideLine = function(x) {
				 	if (!showGuideLine) return;
				 	var line = wrap.select(".nv-interactiveGuideLine")
				 	      .selectAll("line")
				 	      .data((x != null) ? [x] : [], String);

				 	line.enter()
				 		.append("line")
				 		.attr("class", "nv-guideline")
				 		.attr("x1", function(d) { return d;})
				 		.attr("x2", function(d) { return d;})
				 		.attr("y1", availableHeight)
				 		.attr("y2",0)
				 		;
				 	line.exit().remove();

				 }
		});
	}

	layer.dispatch = dispatch;
	layer.tooltip = tooltip;

	layer.width = function(_) {
		if (!arguments.length) return width;
		width = _;
		return layer;
	};

	layer.height = function(_) {
		if (!arguments.length) return height;
		height = _;
		return layer;
	};

	layer.xScale = function(_) {
		if (!arguments.length) return xScale;
		xScale = _;
		return layer;
	};

	layer.showGuideLine = function(_) {
		if (!arguments.length) return showGuideLine;
		showGuideLine = _;
		return layer;
	};


	return layer;
};

/* Utility class that uses d3.bisect to find the index in a given array, where a search value can be inserted.
This is different from normal bisectLeft; this function finds the nearest index to insert the search value.

For instance, lets say your array is [1,2,3,5,10,30], and you search for 28. 
Normal d3.bisectLeft will return 4, because 28 is inserted after the number 10.  But interactiveBisect will return 5
because 28 is closer to 30 than 10.

Has the following known issues:
   * Will not work if the data points move backwards (ie, 10,9,8,7, etc) or if the data points are in random order.
   * Won't work if there are duplicate x coordinate values.
*/
nv.interactiveBisect = function (values, searchVal, xAccessor) {
      if (! values instanceof Array) return null;
      if (typeof xAccessor !== 'function') xAccessor = function(d) { return d.x;}

      var bisect = d3.bisector(xAccessor).left;
      var index = d3.max([0, bisect(values,searchVal) - 1]);
      var currentValue = xAccessor(values[index]);
      if (typeof currentValue === 'undefined') currentValue = index;

      if (currentValue === searchVal) return index;  //found exact match

      var nextIndex = d3.min([index+1, values.length - 1]);
      var nextValue = xAccessor(values[nextIndex]);
      if (typeof nextValue === 'undefined') nextValue = nextIndex;

      if (Math.abs(nextValue - searchVal) >= Math.abs(currentValue - searchVal))
          return index;
      else
          return nextIndex
};