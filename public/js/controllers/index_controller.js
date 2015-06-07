angular.module('sndcld.controllers').controller('IndexController', ['$scope', '$http', 'MixTape', function($scope, $http, MixTape) {
  var soundcloudUrl = location.protocol + '//api.soundcloud.com/tracks';

  var search = function(query) {
    return $http.get(soundcloudUrl, {params: {
      q: query,
      client_id:  '1182e08b0415d770cfb0219e80c839e8',
      format: 'json',
      '_status_code_map[302]': 200
    }});
  };

  $scope.searchSC = function(event, searchText) {
    if (event.keyCode !== 13 || !searchText) {
      return;
    }
    if (!/\S/.test(searchText)) {
      // string is just whitespace
      return;
    }

    $scope.songs = [];
    search(searchText).then(function(payload) {
      var songs = payload.data;
      songs.forEach(function(song) {
        song.name = song.title;
        song.artist = song.user.username;
        song.artist_avatar = song.user.avatar_url;
        song.url = song.stream_url + "?client_id=" + this.client_id;
      });
      $scope.songs = songs;
    });
  };

  $scope.searchSC({keyCode: 13}, 'moderat');

  $scope.addToMixTape = function(track) {
    MixTape.add(track);
  };

  $scope.MixTape = MixTape;

}]);
