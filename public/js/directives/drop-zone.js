angular.module('sndcld.directives').directive("dropZone", [function() {
  var parseCSV = function(scope, name) {
    return function (evt) {
      var rows = evt.target.result.split("\n").map(function(e) { return e.replace(/"/g, "").split(","); });
      // rows is mutate and now is just the track data rows
      var header = rows.shift();
      var trackIDX = header.indexOf("Track Name");
      var artistIDX = header.indexOf("Artist Name");
      var tracks = [];
      rows.forEach(function(d) {
        var title = d[trackIDX];
        var artist = d[artistIDX];
        if (title && artist) {
          tracks.push({
            title: title,
            artist: artist
          });
        }
      });
      scope.$emit('csvUpload', tracks, name);
    };
  };

  var alertError = function(name) {
    return function (evt) {
      alert("error reading file " + f.name);
    };
  };

  return {
    restrict: 'E',
    link: function($scope, elem, attr) {

      elem.bind('dragover', function (e) {
        e.stopPropagation();
        e.preventDefault();
      });

      elem.bind('dragenter', function(e) {
        e.stopPropagation();
        e.preventDefault();
        $scope.$apply(function() {
          $scope.divClass = 'on-drag-enter';
        });
      });

      elem.bind('dragleave', function(e) {
        e.stopPropagation();
        e.preventDefault();
        $scope.$apply(function() {
          $scope.divClass = '';
        });
      });

      elem.bind('drop', function(e) {

        e.stopPropagation();
        e.preventDefault();
        var dt = e.originalEvent.dataTransfer;
        for (var i = 0; i < dt.files.length; i++) {
          var f = dt.files[i];

          var ext = f.name.split('.').pop().toLowerCase();

          if (ext === "csv") {
            var reader = new FileReader();
            reader.readAsText(f, "UTF-8");
            reader.onload = parseCSV($scope, f.name);
            reader.onerror = alertError(f.name);

          } else {
            alert("not a csv!");
          }
        }
      });
    },
    templateUrl: 'public/js/templates/drop-zone.html'
  };
}]);
