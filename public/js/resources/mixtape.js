angular.module('sndcld.resources').factory('MixTape', [function() {
  var tape = [];

  return {
    add: function(track) {
      tape.push(track);
    },
    tape: tape
  };
}]);
