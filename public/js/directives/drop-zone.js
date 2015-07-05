angular.module('sndcld.directives').directive("dropZone", [function() {
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
            reader.onload = function (evt) {
              var rows = evt.target.result.split("\n");
              var body = rows.slice(1);
              var tracks = [];
              body.forEach(function(r) {
                var d = r.replace(/"/g, "").split(",");
                if (d[1] && d[2]) {
                  tracks.push({
                    title: d[1],
                    artist: d[2]
                  });
                }
              });
              $scope.$emit('csvUpload', tracks);
            };
            reader.onerror = function (evt) {
              alert("error reading file " + f.name);
            };

          } else {
            alert("not a csv!")
          }
        }
      });
    },
    templateUrl: 'public/js/templates/drop-zone.html'
  };
}]);
