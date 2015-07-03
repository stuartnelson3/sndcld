angular.module('sndcld.controllers').controller('IndexController', ['$scope', '$http', '$window', '$timeout', '$document', function($scope, $http, $window, $timeout, $document) {
  var soundcloudUrl = location.protocol + '//api.soundcloud.com/tracks';

  $scope.login = function() {
    var form = document.createElement("form");
    form.action = "/authorize";
    form.method = "POST";
    form.innerHTML = '<input name="redirect" value="' + window.location.href + '"/>';
    form.submit();
  };

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
    switch ((match||[])[1]) {
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
          if (singleSet) {
            return {data: payload.data.tracks};
          }
          var ts = payload.data.map(function(set) { return set.tracks; });
          var tracks = [].concat.apply([], ts);
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

  $scope.songs = [];
  // nextURL is the url that will be queried when a user scrolls low enough to
  // require more tracks appended to their stream.
  var nextURL;
  // keeps track if a user is looking at search or stream page
  // ideally these would be separate views and not require the state
  // maintainence, but i'm hacking quick
  var onStream = true;
  $scope.getStream = function() {
    var url = '/stream';
    if (onStream && nextURL) {
      url = nextURL;
    }
    // getting additional streams is 401'ing
    $http.get(url).then(function(payload) {
      var d = payload.data;
      nextURL = d.next_href;
      var songs = d.collection.filter(function(r) {
        // TODO: handle playlists
        var re = /track/;
        return r.type.match(re);
      }).map(function(r) {
        var song = r.origin;
        return {
          permalink_url: r.origin.permalink_url,
          name: song.title,
          artist: song.user.username,
          artist_avatar: song.user.avatar_url,
          url: song.stream_url + "?client_id=" + this.client_id,
        };
      });
      if (onStream) {
        $scope.songs = $scope.songs.concat(songs);
        return;
      }
      $scope.songs = songs;
    });
  };

  var debounce;
  angular.element($window).bind("scroll", function() {
    var html = document.querySelector("html");
    var totalHeight = html.offsetHeight;
    var songContainer = document.querySelector(".song-container");
    var reloadThreshold = songContainer.offsetHeight * 8;

    var reload = html.offsetHeight - (this.pageYOffset + this.innerHeight + reloadThreshold) < 0;
    if (reload && onStream) {
      $timeout.cancel(debounce);
      debounce = $timeout($scope.getStream, 500);
    }
  });

  $scope.searchUsername = function(userPermalink) {
    $scope.searchText = 'tracks:'+userPermalink;
    $scope.searchSC({keyCode: 13}, $scope.searchText);
  };


  // $scope.searchText = 'likes:stuartnelson3';
  // $scope.searchSC({keyCode: 13}, $scope.searchText);
  // $scope.getStream();

  $scope.addToMixTape = function(track) {
    $scope.tracks.push(track);
  };

  $scope.tracks = [];

  $scope.$on('csvUpload', function(e, tracks) {
    debugger
    // create a new search object for each track, each track has it's own
    // resultant tracks and those are what get displayed with the search as the
    // header
    // tracks.forEach
  });

}]);
