$("#foundpanel").hide();
var markerList = [];
var allMarkers = [];
var markerSearch = [];
var markers = L.markerClusterGroup({
    chunkedLoading: true,
    chunkProgress: updateProgressBar
});

var substringMatcher = function(strs) {
  return function findMatches(q, cb) {
    var matches, substrRegex;
    var newMarkers = [];
    // an array that will be populated with substring matches
    matches = [];

    // regex used to determine if a string contains the substring `q`
    strings = q.split(' ');
    if (strings.length > 1) {
      q = strings.join('.*');
    }
    else if (q.length > 3 && (q.substring(0,3) === 'R72' || q.substring(0,3) === 'r72')) {
      if (q.length > 8) {
        q = 'R72\\s'+ q.substring(3,8) + '\\s' + q.substring(8,12);
      }
      else {
        q = 'R72\\s' + q.substring(3);
      }
    }
    substrRegex = new RegExp(q, 'i');

    // iterate through the pool of strings and for any string that
    // contains the substring `q`, add it to the `matches` array
    if (q === 'R72' || q === 'r72' || q === 'R72 ' || q === 'r72 ') {
      $.each(strs, function(i, str) {
        if (substrRegex.test(str.val)) {
          matches.push({ value: str.val });
        }
      });
      newMarkers = [];
    } else {
      $.each(strs, function(i, str) {
        if (substrRegex.test(str.val)) {
          // the typeahead jQuery plugin expects suggestions to a
          // JavaScript object, refer to typeahead docs for more info
          matches.push({ value: str.val });
          newMarkers.push(allMarkers[str.id]);
        }
      });
    }

    markerList = newMarkers;
    if (newMarkers.length === 0) {
      markerList = allMarkers;
      $("#intropanel").show();
      $("#foundpanel").hide();
    }
    else if (newMarkers.length === 1) {
      $('#selectedAddress').text(newMarkers[0].address);
      $('#selectedParcelId').text(newMarkers[0].parcelid);
      $("#intropanel").hide();
      $("#foundpanel").show();
    }

    markers.clearLayers();
    markers.addLayers(markerList);

    cb(matches);
  };
};

var lookupValue = function(value) {
  var loneMarker;
  for (var i = 0; i < allMarkers.length; i++) {
    if (allMarkers[i].address === value || allMarkers[i].parcelid === value) {
      loneMarker = allMarkers[i];
      markerList = [];
      markerList.push(loneMarker);
      markers.clearLayers();
      markers.addLayers(markerList);
      $('#selectedAddress').text(loneMarker.address);
      $('#selectedParcelId').text(loneMarker.parcelid);
      $("#intropanel").hide();
      $("#foundpanel").show();
      break;
    }
  }
}

var shortInput = function(value) {
  var val = $('#addressInput').val();
  if (val.length < 3 && markerList.length !== allMarkers.length) {
    markerList = allMarkers;
    markers.clearLayers();
    markers.addLayers(markerList);
    $("#foundpanel").hide();
    $("#intropanel").show();
  }
};

$('#addressInput').on("keyup", function(e) {
  shortInput($('#addressInput').val());
});

/* Highlight search box text on click */
$("#addressInput").click(function () {
  $(this).select();
});

/* Prevent hitting enter from refreshing the page */
$("#addressInput").keypress(function (e) {
  if (e.which == 13) {
    e.preventDefault();
  }
});

$("#addressInput").on('typeahead:selected', function(evt, item) {
  lookupValue(item.value);
});

$("#addressInput").on('typeahead:cursorchanged', function(evt, item) {
  lookupValue(item.value);
});

$("#addressInput").typeahead({
  minLength: 3,
  highlight: true,
  hint: false
}, {
  name: "AllMarkers",
  displayKey: "value",
  source: substringMatcher(markerSearch),
  templates: {
    empty: '<div class="empty-message">No properties were found that match the current query.</div>'
  }
});

var satTiles = L.tileLayer('http://otile1.mqcdn.com/tiles/1.0.0/sat/{z}/{x}/{y}.png', {
  maxZoom: 18,
  attribution: 'Tiles Courtesy of <a href="http://www.mapquest.com/" target="_blank">MapQuest</a> <img src="http://developer.mapquest.com/content/osm/mq_logo.png">'
}),
  mapTiles = L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
  maxZoom: 18,
  attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors, Points &copy 2012 LINZ'
}),
latlng = L.latLng(39.758948, -84.191607);
var map = L.map('map', { center: latlng, zoom: 10, layers: [mapTiles] });
L.control.layers({"Map":mapTiles,"Satellite":satTiles}).addTo(map);
var progress = document.getElementById('progress');
var progressBar = document.getElementById('progress-bar');
function updateProgressBar(processed, total, elapsed, layersArray) {
  if (elapsed > 1000) {
    // if it takes more than a second to load, display the progress bar:
    progress.style.display = 'block';
    progressBar.style.width = Math.round(processed/total*100) + '%';
  }
  if (processed === total) {
    // all markers processed - hide the progress bar:
    progress.style.display = 'none';
  }
}

$('#last_update').text(lastupdated);

markerList = [];
for (var i = 0; i < points.length; i++) {
  var a = points[i];
  var title = a.street;
  var marker = L.marker(L.latLng(parseFloat(a.locationdata.latitude), parseFloat(a.locationdata.longitude)), { title: title});
  marker.address = a.street;
  marker.parcelid = a.parcelid;

  marker.on('click', function(e) {
    $('#selectedAddress').text(e.target.address);
    $('#selectedParcelId').text(e.target.parcelid);
    $("#intropanel").hide();
    $("#foundpanel").show();
  });
  marker.bindPopup(title);
  markerList.push(marker);
}
allMarkers = markerList;

for (var i = 0; i < allMarkers.length; i++) {
  if (allMarkers[i].parcelid) {
    markerSearch.push({id: i, val: allMarkers[i].parcelid});
  }
  if (allMarkers[i].address) {
    markerSearch.push({id: i, val: allMarkers[i].address});
  }
}

markers.addLayers(markerList);
map.addLayer(markers);

