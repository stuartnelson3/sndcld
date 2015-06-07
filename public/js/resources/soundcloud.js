angular.module('sndcld.resources').factory('Soundcloud', ['$http', function($http) {
  var soundcloudUrl = location.protocol + '//api.soundcloud.com/tracks';

  return {
    search: function(query) {
      return $http.get(soundcloudUrl, {params: {
        q: query,
        client_id:  '1182e08b0415d770cfb0219e80c839e8',
        format: 'json',
        '_status_code_map[302]': 200
      }});
    }
  };
}]);
