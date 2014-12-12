'use strict';

/**
 * @ngdoc function
 * @name daytonreapApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the daytonreapApp
 */
angular.module('daytonreapApp')
  .controller('MainCtrl', function ($scope, $http, leafletEvents) {
    var DATA_SOURCE = 'http://localhost:9000/reaps.json';
    var allMarkers = [];

    $http.get(DATA_SOURCE).success(function(data) {
      var length = data.length;
      for (var i = 0; i < length; i++) {
        allMarkers.push({ lat: parseFloat(data[i].locationdata.latitude),
                          lng: parseFloat(data[i].locationdata.longitude),
                          address: data[i].street,
                          parcelid: data[i].parcelid,
                          focus: false,
                          layer: 'properties'
                        });
      }
    });

    $scope.searchBox = '';
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
          disable: leafletEvents.getAvailableMarkerEvents(),
          enable: ['click'],
          logic: 'emit'
        },
        map: {
          disable: leafletEvents.getAvailableMapEvents()
        }
      },
      layers: {
        baselayers: {
          osm: {
            name: 'OpenStreetMap',
            type: 'xyz',
            url: 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            layerOptions: {
              subdomains: ['a', 'b', 'c'],
              attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
              continuousWorld: true
            }
          }
        },
        overlays: {
          properties: {
            name: 'Properties',
            type: 'markercluster',
            visible: true,
            layerOptions: {
              "chunkedLoading": true,
              "showCoverageOnHover": true,
              "removeOutsideVisibleBounds": true
            } 
          }
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
      if (val.length > 3 && val.substring(0,3) === 'R72') {
        for (var i = 0; i < $scope.markers.length; i++) {
          if ($scope.markers[i].parcelid && $scope.markers[i].parcelid.indexOf(val) >= 0) {
            newMarkers.push($scope.markers[i]);
          }
        }
        $scope.markers = newMarkers;
      }
      else if (val.length > 0 && val !== 'R' && val !== 'R7') {
        for (var j = 0; j < $scope.markers.length; j++) {
          if ($scope.markers[j].address && $scope.markers[j].address.indexOf(val) >= 0) {
            newMarkers.push($scope.markers[j]);
          }
        }
        $scope.markers = newMarkers;
      }
      if (newMarkers.length === 0) {
        $scope.markers = allMarkers;
      }
    };
  });
