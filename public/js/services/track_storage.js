angular.module('sndcld.services').factory('TrackStorage', [function() {
  var s = localStorage;
  var k = 'tracks';
  return {
    set: function(tracks) {
      s.setItem(k, JSON.stringify(tracks));
      return this.tracks();
    },
    tracks: function() {
      t = s.getItem(k);
      if (t) {
        return JSON.parse(t);
      }
      return [];
    },
  };
}]);
