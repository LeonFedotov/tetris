var Shape = {
	current : [],
	all : [] ,
	init : function (shape) {
		this.all = jsArrayLoop.init(shape);
		this.current = this.all.next();
		return Object.create(this);
	},
	
	nextRotation : function () {
		this.current = this.all.next();
		return this;
	},
	
	getBody : function () {
		return this.current;
	},
	
	getSkirt : function () {
		return this.current[0];
	}
};

var jsArrayLoop = {
	arr : [],
	init : function (arr) {
		this.arr = arr;
		return Object.create(this);
	},
	
	next : function () {
		var last
		this.arr.unshift(last = this.arr.pop());
		return last;
	}
}
var getShape = {
	shapes : [
	[ 
		[[1],[1,1],[1]],
		[[1, 1, 1], [0, 1]], // # # #
		[[0,1],[1,1],[0,1]],//   #  
		[[0,1],[1,1,1]]
	],[
		[[1], [1], [1], [1]],
		[[1,1,1,1]]	// #####
	],[
		[[0,1], [0,1], [1,1]],
		[[1,1,1], [0,0,1]],	// # # #
		[[1,1], [1], [1]], //     #
		[[1], [1,1,1]]
	],[
		[[1,1], [0,1], [0,1]],
	 	[[0,0,1], [1,1,1]],  //     #
		[[1], [1], [1,1]],  // # # #
		[[1,1,1], [0,0,1]]
	],[
		[[1,1],[1,1]]// # #
					// # #
	],[
		[[1], [1,1], [0,1]],     //   # #
		[[0,1,1], [1,1]]		// # #
	],[
		[[0,1], [1,1], [1]],  // # #
		[[1,1], [0,1,1]]	  //  # #
	]],
	
	byId : function (id) {
		return Shape.init(this.shapes[id]);
	}
};