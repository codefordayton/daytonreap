#!/usr/bin/env node
//in_file should be a json array of objects
//ex cat in_file.json | node transform > out_file.json

/**
 * Partial Application in JavaScript by John Resig
 * http://ejohn.org/blog/partial-functions-in-javascript/
 * curry - returns a function using a single argument
 * partial - returns a function utilizing multiple arguments & undefined
 */
(function(){
if (typeof Function.prototype.curry !== "function") {
    Function.prototype.curry = function() {
        var fn = this,
            args = Array.prototype.slice.call(arguments);
        return function() {
            return fn.apply(this, args.concat(Array.prototype.slice.call(arguments)));
        };
    };
  }
})();
 

var get=function(prop,obj){
    return obj[prop]
}
 
var location_data=get.curry('locationdata');
var longitude=get.curry('longitude');
var latitude=get.curry('latitude');
var street=get.curry('street');
var parcelid=get.curry('parcelid');

var transform=function(obj){
    var locationdata=location_data(obj)
    return {
        'parcelid':parcelid(obj),
        'street':street(obj),
        'longitude':longitude(locationdata),
        'latitude':latitude(locationdata)
    }
};

var stdin = process.openStdin();

var data = "";

stdin.on('data', function(chunk) {
  data += chunk;
});

stdin.on('end', function() {
  var input_array=JSON.parse(data)
  var array=input_array.map(transform);		
  
  process.stdout.write(JSON.stringify(array));
});
