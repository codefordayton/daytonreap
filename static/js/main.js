$("document").ready(function() {
  // current marker list
  var markerList = [];
  
  // all the markers
  var allMarkers = [];
  
  // search index for the markers
  var markerSearch = [];
  
  // map context
  var map;
  var markers;
  
  /// Link Helper functions
  function generateTreasurersLink(parcelid){
    return "http://www.mctreas.org/master.cfm?parid=" + parcelid.replace(" ", "%20") + "&taxyr=2015&own1=SMITH";
  };
  
  function generateGISLink(parcelid){
    return "http://www.mcegisohio.org/geobladeweb/default.aspx?config=aud&field='" + parcelid + "'";
  };

  /// typeahead helper
  function substringMatcher(strs) {
    return function findMatches(q, cb) {
      var matches, substrRegex;
  
      // an array that will be populated with substring matches
      matches = [];

      // regex used to determine if a string contains the substring `q`
      substrRegex = new RegExp(q, 'i');
  
      // iterate through the pool of strings and for any string that
      // contains the substring `q`, add it to the `matches` array
      markerList = [];
      $.each(strs, function(i, str) {
        if (substrRegex.test(str)) {
          // the typeahead jQuery plugin expects suggestions to a
          // JavaScript object, refer to typeahead docs for more info
          updateMarkers(i, str);
          matches.push({ value: str });
        }
      });
 
      setMarkers();
      cb(matches);
    };
  };
  
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

  $("#addressInput").typeahead({
    minLength: 0,
    highlight: true,
    hint: false
  }, {
    name: "AllMarkers",
    displayKey: "value",
    source: substringMatcher(markerSearch),
    templates: {
      empty: '<div class="empty-message">No Lot Links eligible properties were found. <br /><span class="error-text">If you provided a complete address, then the property is not eligible for Lot Links at this time.</span></div>'
    }
  });
  
  /// Lookup based on typeahead and updating right bar
  function selectedProperty(address,parcelid, claimed) {
    $('#selectedAddress').text(address);
    $('#selectedParcelId').text(parcelid);
    $('#linkToTreasuresSite').html("<a href=\"" 
      + generateTreasurersLink(parcelid) 
      + "\" target=\"_blank\">View Property on Treasurer's Site</a>");
    $('#linkToGISSite').html("<a href=\"" 
      + generateGISLink(parcelid) 
      + "\" target=\"_blank\">View Property on GIS Site</a>");
    if (claimed) {
      $('#claimedWarning').html("This property has been claimed. It is not available at this time.");
    } else {
      $('#claimedWarning').html("");
    }
    $(".introcontainer").css("margin-top", "255px");
  }

  function updateMarkers(index, value) {
    if (allMarkers[index] !== undefined && 
      (allMarkers[index].parcelid === value || allMarkers[index].address === value))
    {
      markerList.push(allMarkers[index]);
    } else if (index >= allMarkerLength && 
        (allMarkers[index-allMarkerLength].parcelid === value || allMarkers[index-allMarkerLength].address === value))
    {
      markerList.push(allMarkers[index-allMarkerLength]);
    }
  } 

  function clearMarkers() {
    if (markerList.length !== allMarkerLength) {
      markers.clearLayers();
      markerList = allMarkers;
      markers.addLayers(markerList);
    }
  }

  function setMarkers() {
    if (markerList.length === 0) {
      markerList = allMarkers;
    }
    markers.clearLayers();
    markers.addLayers(markerList);
  }
 
  function lookupValue(value) {
    var val = $('#addressInput').val().toUpperCase();
    var refreshNeeded = false;
    var newMarkers = [];

    if (val.length > 3 && val.substring(0,3) === 'R72') {
      for (var i = 0; i < allMarkerLength; i++) {
        if (allMarkers[i].parcelid && allMarkers[i].parcelid.indexOf(val) >= 0) {
          newMarkers.push(allMarkers[i]);
        }
      }
      refreshNeeded = true;
      markerList = newMarkers;
    }
    else if (val.length > 2 && val !== 'R' && val !== 'R7') {
      for (var j = 0; j < allMarkerLength; j++) {
        if (allMarkers[j].address && allMarkers[j].address.indexOf(val) >= 0) {
          newMarkers.push(allMarkers[j]);
        }
      }
      refreshNeeded = true;
      markerList = newMarkers;
    }
    else if (val.length < 3 && markerList.length !== allMarkerLength) {
      markerList = [];
    }
  
    if (newMarkers.length === 0) {
      refreshNeeded = true;
      markerList = allMarkers;
    }
    else if (newMarkers.length === 1) {
      selectedProperty(newMarkers[0].address, newMarkers[0].parcelid, newMarkers[0].claimed);
    }
  
    if (refreshNeeded) {
      markers.clearLayers();
      markers.addLayers(markerList);
    }
  }
  
  /// Site initialization
  function createMap() {
    var satTiles = L.tileLayer('http://otile1.mqcdn.com/tiles/1.0.0/sat/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: 'Tiles Courtesy of <a href="http://www.mapquest.com/" target="_blank">MapQuest</a> <img src="http://developer.mapquest.com/content/osm/mq_logo.png">'
    }),
    mapTiles = L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors, Points &copy 2012 LINZ'
    }),
    latlng = L.latLng(39.758948, -84.191607);
    map = L.map('map', { center: latlng, zoom: 10, layers: [mapTiles] });
    L.control.layers({"Map":mapTiles,"Satellite":satTiles}).addTo(map);
  }

  function popup(street, parcel) {
    return '<p>' + street + '</p>' +
           '<p>' + parcel + '</p>';
  }
 
  function initMarkers() {
    markerList = [];

    var redMarker = L.AwesomeMarkers.icon({
      icon: 'close-round',
      markerColor: 'red',
      prefix: 'ion'
    });

    var blueMarker = L.AwesomeMarkers.icon({
      icon: 'home',
      markerColor: 'blue',
      prefix: 'ion'
    });

    var lotMarker = L.AwesomeMarkers.icon({
      icon: 'leaf',
      markerColor: 'blue',
      prefix: 'ion'
    });

    for (var i = 0; i < points.length; i++) {
      var a = points[i];
      var title = a.street;
      var icon = blueMarker;
      if (a.lot)
        icon = lotMarker;
      if (a.claimed)
        icon = redMarker;
      var marker = L.marker(L.latLng(parseFloat(a.lat), parseFloat(a.lon)), { title: title, icon: icon });
      marker.address = a.street;
      marker.parcelid = a.parcelid;
      marker.claimed = a.claimed;
  
      marker.on('click', function(e) {
        selectedProperty(e.target.address, e.target.parcelid, e.target.claimed);
      });
      marker.bindPopup(popup(title, a.parcelid));
      markerList.push(marker);
    }
    allMarkers = markerList;
    allMarkerLength = allMarkers.length;
  
    for (var i = 0; i < allMarkerLength; i++) {
        markerSearch.push(allMarkers[i].parcelid);
    }
    for (i = 0; i < allMarkerLength; i++) {
        markerSearch.push(allMarkers[i].address);
    }
  
    markers = L.markerClusterGroup({
      chunkedLoading: true,
      chunkInterval: 20,
      chunkDelay: 50
      
    });
    markers.addLayers(markerList);
    map.addLayer(markers);
  }
  
  function initSite() {
    $('#last_update').text(lastupdated);
  
    createMap();
    initMarkers();
    
  }
  
  initSite();
  
  //HTML5 input placeholder fix for < ie10 
  $('input, textarea').placeholder();
 
  function uiFixes() {
     //JS to fix the Twitter Typeahead styling, as it is unmodifyable in the bower folder
    $('.twitter-typeahead').css('display', '');
    //Fix for the Twitter Typeahead styling of the pre tag causing issues with horizontal scrolling in conentpanel
    $('pre').css("margin-left", "-50%");
  }
  
  uiFixes();
  
  //JS FAQ triggers
  
  function clickedFAQ(element) {
    var clickedFAQ = element.id;
    var expandFAQ = clickedFAQ + "-expand";
    var isExpandedFAQ = $("#"+expandFAQ).css("display");
    
    if (isExpandedFAQ === "block"){
      $("#"+expandFAQ).hide("slow");
      $("#"+expandFAQ+" *").hide("slow");
      $("#"+clickedFAQ+" h4 span.expanded-icon").replaceWith("<span class='expand-icon'>+</span>");
      console.log(clickedFAQ+" h4 span.expand-icon");
    }else{
      
      $("#"+expandFAQ).show();
      $("#"+expandFAQ+" *").show("fast");
      $("#"+clickedFAQ+" h4 span.expand-icon").replaceWith("<span class='expanded-icon'>&#8210;</span>");
    }
    
  }
  
  $("[id^=FAQ-]").click( function() {
    clickedFAQ(this);
  });
});


