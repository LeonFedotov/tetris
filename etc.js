if( !Object.create ){
	Object.create = function(o){
		var C = function(){};
		C.prototype = o;
		return new C();
	};
}

String.prototype.repeat= function(n){
    n= n || 1;
    return Array(n+1).join(this);
}