angular.module('sndcld.directives').directive("song", ['$http', 'TrackStorage', function($http, TrackStorage) {
  return {
    restrict: 'E',
    scope: {
      song: "=",
      tracks: "="
    },
    link: function($scope, elem, attr) {
      $scope.addToMixTape = function(track) {
        $scope.tracks.push(track);
        TrackStorage.set($scope.tracks);
      };

      $scope.searchUsername = function(username) {
        $scope.$emit('searchUser', username);
      };
    },
    templateUrl: '/public/js/templates/song.html'
  };
}]);
