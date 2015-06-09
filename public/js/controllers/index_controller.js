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

    // looking for user likes/tracks
    var re = /(\w+):(.+)/;
    var match = searchText.match(re);
    switch (match[1]) {
      case "likes":
      case "tracks":
        promise = resolve({url: match[2].trim()+"/"+match[1].trim()});
        break;
      case "sets":
        var m = match[2].match(re);
        var user = match[2];
        var path = match[1].trim();
        var singleSet = false;
        if (m) {
           user = m[1];
           if (m[2]) {
             singleSet = true;
             path += "/" + m[2].trim();
           }
        }
        promise = resolve({url: user.trim()+"/"+path}).then(function(payload) {
          var tracks;
          if (singleSet) {
            tracks = payload.data.tracks;
          }
          var ts = payload.data.map(function(set) { return set.tracks; });
          tracks = [].concat.apply([], ts);
          return {data: tracks};
        });
        break;
      default:
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
