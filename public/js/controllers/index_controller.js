angular.module('sndcld.controllers').controller('IndexController', ['$scope', '$http', function($scope, $http) {
  var soundcloudUrl = location.protocol + '//api.soundcloud.com/tracks';

  var resolve = function(params) {
    params.url = "https://soundcloud.com/" + params.url;
    params.client_id = '1182e08b0415d770cfb0219e80c839e8';
    var endpoint = 'https://api.soundcloud.com/resolve.json';
    return $http.get(endpoint, {params: params});
  };

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

    var promise;

    // looking for user likes
    var match = searchText.match(/likes:(.+)/);
    if (match) {
      promise = resolve({url: match[1].trim()+"/likes"});
    } else {
      promise = search(searchText);
    }

    $scope.songs = [];
    promise.then(function(payload) {
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


  $scope.searchText = 'likes:stuartnelson3';
  $scope.searchSC({keyCode: 13}, $scope.searchText);

  $scope.addToMixTape = function(track) {
    $scope.tracks.push(track);
  };

  $scope.tracks = [];

}]);
