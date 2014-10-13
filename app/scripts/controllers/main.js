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
    var allMarkers = [
      {
        lat: 39.75693,
        lng: -84.19460,
        message: "Marker 1",
        address: "123 Sesame St.",
        parcelid: "R72123123",
        focus: false 
      },
      {
        lat: 39.75895,
        lng: -84.1917,
        message: "Marker 2",
        address: "234 Sesame St.",
        parcelid: "R72134234",
        focus: false 
      },
      {
        lat: 39.76,
        lng: -84.1317,
        message: "Marker 3",
        address: "345 Sesame St.",
        parcelid: "R72345345",
        focus: false 
      },
      {
        lat: 39.77895,
        lng: -84.2917,
        message: "Marker 4",
        address: "456 Sesame St.",
        parcelid: "R72456456",
        focus: false 
      },
      {
        lat: 39.74895,
        lng: -84.3,
        message: "Marker 5",
        address: "567 Sesame St.",
        parcelid: "R72567567",
        focus: false 
      }
    ];

    $scope.searchBox = "";
    $scope.markers = allMarkers;

    angular.extend($scope, {
      dayton: {
        lat: 39.758948,
        lng: -84.191607,
        zoom: 10 
      },
      markers: $scope.markers,
      events: {
        markers: {
          enable: ['click'],
          logic: 'emit'
        }
      }
    });


    $scope.$on('leafletDirectiveMarker.click', function(event, args){
      console.log( $scope.markers[args.markerName]);
      $scope.selectedMarker = $scope.markers[args.markerName];
    });

    $scope.liveSearch = function(val) {
      $scope.selectedMarker = val;
      var newMarkers = [];
      if (val.length > 3 && val.substring(0,3) === "R72") {
        for (var i = 0; i < allMarkers.length; i++) {
          if (allMarkers[i].parcelid.indexOf(val) >= 0) {
            newMarkers.push(allMarkers[i]);
          }
        }
        $scope.markers = newMarkers;
      }
      else if (val.length > 0 && val !== 'R' && val !== 'R7') {
        for (var i = 0; i < allMarkers.length; i++) {
          if (allMarkers[i].address.indexOf(val) >= 0) {
            newMarkers.push(allMarkers[i]);
          }
        }
        $scope.markers = newMarkers;
      }
      if (newMarkers.length === 0) {
        $scope.markers = allMarkers;
      }
    };
  });
