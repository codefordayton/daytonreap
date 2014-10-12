'use strict';

/**
 * @ngdoc function
 * @name daytonreapApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the daytonreapApp
 */
angular.module('daytonreapApp')
  .controller('MainCtrl', function ($scope) {
    angular.extend($scope, {
      dayton: {
        lat: 39.758948,
        lng: -84.191607,
        zoom: 10 
      }
    });
    $scope.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];
  });
