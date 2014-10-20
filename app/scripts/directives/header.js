'use strict';

angular.module('daytonreapApp').directive('header', function() {
  return {
    restrict: 'A',
    replace: true,
    templateUrl: 'views/header.html',
    controller: ['$scope', '$filter', '$window', '$location', 
      function ($scope, $filter, $window, $location) {
        $scope.menu = [{
          'title': 'Home',
          'link': '/'
        },
        {
          'title': 'About',
          'link': '#/about'
        },
        {
          'title': 'Contact',
          'link': '#/contact'
        }];

        $scope.isActive = function(route) {
          return route === '#' + $location.path();
        };
      }
    ]
  };
});
