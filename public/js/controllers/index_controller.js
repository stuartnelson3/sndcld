angular.module('sndcld.controllers').controller('IndexController', ['$scope', '$http', '$window', '$timeout', '$document', 'TrackStorage', function($scope, $http, $window, $timeout, $document, TrackStorage) {
  var soundcloudUrl = location.protocol + '//api.soundcloud.com/tracks';

  $scope.currentView = 'search';
  $scope.showMenu = false;

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
    $scope.songs = [];
    $scope.sets = [];

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
        if (m) {
           user = m[1];
           if (m[2]) {
             path += "/" + m[2].trim();
           }
        }
        resolve({url: user.trim()+"/"+path}).then(function(payload) {
          // single sets are returned as just as object.
          // wrap it in an array and flatten so that it can
          // be treated the same as an array of sets.
          $scope.sets = [].concat.apply([], [payload.data]);
        });
        return;
      default:
        promise = search(searchText);
    }

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

  $scope.removeTrack = function(e, i) {
    e.stopPropagation();
    $scope.tracks.splice(i, 1);
    TrackStorage.set($scope.tracks);
  };

  $scope.setTitle = "My New Set";
  $scope.createSet = function() {
    var url = '/create-set';
    var data = {
      title: $scope.setTitle,
      tracks: $scope.tracks.map(function(t) { return t.id; })
    };
    $scope.uploadingSet = true;
    $http.post(url, data).then(function(payload) {}, function(payload) {
      alert('error creating playlist');
      console.log(payload);
    }).finally(function() {
      $scope.uploadingSet = false;
    });
  };

  $scope.songs = [];
  // nextURL is the url that will be queried when a user scrolls low enough to
  // require more tracks appended to their stream.
  // keeps track if a user is looking at search or stream page
  // ideally these would be separate views and not require the state
  // maintainence, but i'm hacking quick
  $scope.getStream = function(ev) {
    $scope.searchText = '';
    $scope.setView('search', ev);
    var url = '/stream';
    // getting additional streams is 401'ing
    $scope.songs = [];
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
      $scope.songs = songs;
    });
  };

  $scope.searchUsername = function(userPermalink) {
    $scope.searchText = 'tracks:'+userPermalink;
    $scope.searchSC({keyCode: 13}, $scope.searchText);
  };

  $scope.searchText = 'likes:stuartnelson3';
  $scope.searchSC({keyCode: 13}, $scope.searchText);
  // $scope.getStream();

  $scope.tracks = TrackStorage.tracks();

  $scope.setView = function(view, ev) {
    $scope.currentView = view;
  };

  $scope.$on('csvUpload', function(e, tracks, csvName) {
    $scope.$apply(function() {
      $scope.playlist = tracks;
      $scope.csvName = csvName;
    });
  });

  $scope.$on('searchUser', function(e, username) {
    $scope.searchUsername(username);
  });

  $scope.loggedIn = false;
  $http.get("/check-auth").then(function(payload) {
    $scope.loggedIn = true;
    $scope.user = payload.data;
  });

  $scope.logout = function() {
    $http.post("/logout").then(function() {
      $scope.user = {};
      $scope.loggedIn = false;
    });
  };

}]);
