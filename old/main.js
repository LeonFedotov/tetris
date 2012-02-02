var game = {

};

var display = {
	parent: null, 
	grid: null,
	height: 20,
	width: 10,
	defaultFillColor: '#00f',
	init: function(parent) {
		this.parent = parent;
		var cells = ('<tr>'+('<td></td>'.repeat(this.width))+'</tr>').repeat(this.height);
		this.grid = $('<table>').append(cells);
		this.grid.appendTo(this.parent);
		return this;
	},
	 
	set : function (bool, x, y) {
		var color = bool?this.defaultFillColor:'';
		this.get(x,y).css('background-color', color);
		return this;
	},
	
	getValue : function (x, y) {
		return this.get(x,y).css('background-color')?true:false;
	},
	
	get : function (x,y) {
		var htmlx = x+1;
		var htmly = this.height - y;
		return $('table').find('tr:nth-child('+htmly+') > td:nth-child('+htmlx+')');
	},
	 
	draw: function(shape, x, y) {
		var todraw = shape.body;//.zerofilled();//.reverse();
		var that = this;
		for(var sy in todraw) {
			var line = todraw[sy];//.reverse();
			for(var sx in line) {
				that.set(line[sx], parseInt(x,10)+parseInt(sx,10), parseInt(y,10)+parseInt(sy,10));
			}
		}
		return this;
	},
	
	clear: function() {
		this.grid.find('td').css('background-color', '');
		return this;
	}
};

