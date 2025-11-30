var Shape = {
	body : null,
	me : 3,
	color: '#00f',
	init : function (shape) {
		this.body = shape.body;
		this.me   = shape.me;
		this.color = shape.color || '#00f';
		return this;
	},
	
	nextRotation : function () {
		this.zeroFill();
		var rotated = [];
		var newY = 0;
		for(var x in this.body) {
			for(var y in this.body[x]) {
				if(this.body[x][y] == 1) {
					newY = 1 - (y - (this.me - 2));
					!rotated[newY]  && (rotated[newY] = []);
					rotated[newY][x] = this.body[x][y];	
				}
			}

		}
		
		this.body = rotated;
		console.log(rotated);
		this.zeroReduce();
		console.log(this.body);
		return this;
	},
	
	zeroReduce : function (body) {
		body = body || this.body;
		this.body = [];
		while(body.length > 0) {
			var row = body.pop();
			if(row !== undefined) {
				this.body.unshift(row);
			}
		}
		return this;
	},
	
	zeroFill : function (body) {
		body = body || this.body;
		while(body.length < 4) {
			body.push([0,0,0,0]);
		}

		for(var i in body) {
			while(body[i].length < 4) {
				body[i].push(0);
			}
		}
		this.body = body;
		return this;
	},
	getSkirt : function () {
		return this.body[0];
	}
};


var getShape = {
	shapes : {
		1 : { body : [[1, 1, 1], [0, 1]], me : 3, color: '#a000f0'}, // T - purple
		2 : { body : [[1,1,1,1]], me : 4, color: '#00f0f0'}, // I - cyan
		3 : { body : [[1,1], [1], [1]], me : 3, color: '#f0a000'}, // L - orange
		4 : { body : [[1,1],[1,1]], me : 2, color: '#f0f000'}, // O - yellow
		5 : { body : [[0,1,1],[1,1]], me : 3, color: '#00f000'}, // S - green
		6 : { body : [[1,1],[0,1,1]], me : 3, color: '#f00000'}, // Z - red
		7 : { body : [[1,1],[0,1],[0,1]], me : 3, color: '#0000f0'} // J - blue
	},

	byId : function (id) {
		var shape = Object.create(Shape);

		return shape.init(this.shapes[id]);
	}
};