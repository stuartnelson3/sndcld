angular.module('sndcld.resources', []);
angular.module('sndcld.controllers', []);
angular.module('sndcld.directives', []);

var app = angular.module('sndcld', ['ngRoute', 'plangular', 'sndcld.resources', 'sndcld.controllers', 'sndcld.directives']);
app.run(['$rootScope', '$location', '$route', function($rootScope, $location, $route) {}]);

app.config(['$routeProvider', '$locationProvider', 'plangularConfigProvider',
 function($routeProvider, $locationProvider, plangularConfigProvider) {
   $locationProvider.html5Mode(true);

   plangularConfigProvider.clientId = '1182e08b0415d770cfb0219e80c839e8';

   $routeProvider.when('/', {
     templateUrl: '/public/js/templates/index.html',
     controller: 'IndexController'
   }).otherwise({
     redirectTo: '/'
   });
 }]);
