'use strict';

/**
 * @ngdoc overview
 * @name daytonreapApp
 * @description
 * # daytonreapApp
 *
 * Main module of the application.
 */
angular
  .module('daytonreapApp', ['ngRoute', 'leaflet-directive'])

  .config(function($routeProvider) {
    $routeProvider
      .when('/', {
        controller:'MainCtrl',
        templateUrl:'views/main.html'
      })
      .when('/about', {
        controller:'AboutCtrl',
        templateUrl:'views/about.html'
      })
      .when('/contact', {
        controller:'ContactCtrl',
        templateUrl:'views/contact.html'
      })
      .otherwise({
        redirectTo:'/'
      });
});

