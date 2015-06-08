angular.module('sndcld.resources').factory('MixTape', [function() {
  var mt = function(tape) {
    this.tape = tape || [];
  };

  return function(tape) {
    return new mt(tape);
  };
}]);
