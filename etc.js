if( !Object.create ){
	Object.create = function(o){
		var C = function(){};
		C.prototype = o;
		return new C();
	};
}

String.prototype.repeat = function(n){
    n = n || 1;
    return Array(n+1).join(this);
};

if (!Array.prototype.forEach)
{
  Array.prototype.forEach = function(fun /*, thisp */)
  {
    "use strict";

    if (this === void 0 || this === null)
      throw new TypeError();

    var t = Object(this);
    var len = t.length >>> 0;
    if (typeof fun !== "function")
      throw new TypeError();

    var thisp = arguments[1];
    for (var i = 0; i < len; i++)
    {
      if (i in t)
        fun.call(thisp, t[i], i, t);
    }
  };
}