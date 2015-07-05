angular.module('sndcld.directives').directive("song", ['$http', function($http) {
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

      $scope.searchUsername = function(username) {
        $scope.$emit('searchUser', username);
      };
    },
    templateUrl: '/public/js/templates/song.html'
  };
}]);
