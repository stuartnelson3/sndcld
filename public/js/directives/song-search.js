angular.module('sndcld.directives').directive("songSearch", ['$http', function($http) {
  return {
    restrict: 'E',
    scope: {
      song: "=",
      tracks: "="
    },
    link: function($scope, elem, attr) {
      $scope.addToMixTape = function(track) {
        $scope.tracks.push(track);
      };

      var search = function(query) {
        return $http.get(soundcloudUrl, {params: {
          q: query,
          client_id:  '1182e08b0415d770cfb0219e80c839e8',
          format: 'json',
          '_status_code_map[302]': 200
        }});
      };

      var soundcloudUrl = location.protocol + '//api.soundcloud.com/tracks';
      var searchText = $scope.song.artist + " " + $scope.song.title;
      search(searchText).then(function(payload) {
        // arbitrarily limit results to 5
        var songs = payload.data.slice(0, 5);
        songs.forEach(function(song) {
          song.name = song.title;
          song.artist = song.user.username;
          song.artist_avatar = song.user.avatar_url;
          song.url = song.stream_url + "?client_id=" + this.client_id;
        });
        $scope.songs = songs;
      });

    },
    templateUrl: '/public/js/templates/song-search.html'
  };
}]);
