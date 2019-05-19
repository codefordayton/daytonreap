$("document").ready(function() {
  // all the markers
  var allMarkers = [];

  // search index for the markers
  var markerSearch = [];

  // flag for only showing new properties
  var onlyNew = false;

  // map context
  var map;
  var markers;

  /// Link Helper functions
  function generateTreasurersLink(parcelid){
    return `https://www.mcohio.org/government/elected_officials/treasurer/mctreas/master.cfm?parid=${parcelid.replace(/ /g, '%20')}&taxyr=2018&own1=SMITH`;
  };

  function generateGISLink(parcelid){
    return "//www.mcegisohio.org/VPWeb/VPWeb.html?config=aud";
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

      // Practically clearing the previous search results
      // Does using .map change the performance?
      for (var i = 0; i < allMarkers.length; i++) {
        allMarkers[i].found = false;
      }

      $.each(strs, function(i, str) {
        if (substrRegex.test(str)) {
          // the typeahead jQuery plugin expects suggestions to a
          // JavaScript object, refer to typeahead docs for more info

          // Update the found attribute on the master marker list
          // This will later used to update the markers on the map
          allMarkers[i % allMarkers.length].found = true;
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
    // User selected a text from the search results box
    // We need to update the map with the markers matching exactly that text
    // If there's only one result, we will select that property
    // This is going to be a subset of all the markers on the map, 
    //    however Leaflet update efficiency should be considered.

    var value = item.value;     
    // Clearing the previous search results and searching for the selected marker(s)
    for (var i = 0; i < allMarkers.length; i++) {
      allMarkers[i].found = false;
      if (allMarkers[i].parcelid === value || allMarkers[i].address === value) allMarkers[i].found = true;
    }

    // Let's update the markers on the map to selected markers
    // This will also select the marker if there's only one result
    setMarkers();
  });

  $("#addressInput").typeahead({
    minLength: 0,
    highlight: true,
    hint: false
  }, {
    name: "AllMarkers",
    displayKey: "value",
    source: substringMatcher(markerSearch),
    limit: 15,
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

  function clearMarkers() {
    // Let's not update the map if all the markers are already in there
    if (markers.getLayers().length === allMarkers.length) return;

    // Leaflet says it's more efficient to remove all the markers and then inseart the new ones.
    markers.clearLayers();

    // Let's put everything back onto the map
    // We should also set the found attributes to false on the master list
    var cleanMarkers = [];
    for (var i = 0; i < allMarkers.length; i++) {
      allMarkers[i].found = false;
      // We are already looping over all the markers
      // It might be more efficient to update cleanMarkers in this loop
      cleanMarkers.push(allMarkers[i]);
    }
    markers.addLayers(cleanMarkers);
  }

  function setMarkers() {
    // Original design calls for putting all the markers back if there's nothing found during the search
    // This feature is removed due to search slugishness

    // Let's find all the found markers, filtering for newness if necessary
    var foundMarkers = [];
    for (var i = 0; i < allMarkers.length; i++) {
      if (allMarkers[i].found &&
           (!onlyNew || (onlyNew && allMarkers[i].new))) { 
        foundMarkers.push(allMarkers[i]);
      }
    }
    // Let's not update the map if we found all markers in the search and they are already on the map
    if (foundMarkers.length === allMarkers.length && markers.getLayers().length === allMarkers.length) return;

    // Marker attributes such as .claim and .new can be used here to filter search results.

    // Leaflet says it's more efficient to remove all the markers and then insert the new ones.
    markers.clearLayers();
    markers.addLayers(foundMarkers);

    // Let's select the marker if there's only one of them is found
    if (foundMarkers.length === 1 ) {
      selectedProperty(foundMarkers[0].address, foundMarkers[0].parcelid, foundMarkers[0].claimed);
    }
  }

  function showOnlyNewProperties(showNew) {
    onlyNew = showNew;
    setMarkers();
  }

  // NEEDS UPDATE: Broken by search update
  //Filter new properties
  $("#showOnlyNewProperties").change(function () {
    $(this).is(":checked") ? showOnlyNewProperties(true) : showOnlyNewProperties(false);
  });

  /// Site initialization
  function createMap() {
    var satTiles = L.tileLayer('//server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 18,
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    }),
    mapTiles = L.tileLayer('//{s}.tile.osm.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; <a href="//osm.org/copyright">OpenStreetMap</a> contributors, Points &copy 2012 LINZ'
    }),
    latlng = L.latLng(39.758948, -84.191607);
    map = L.map('map', { center: latlng, zoom: 10, layers: [mapTiles] });
    L.control.layers({"Map":mapTiles,"Satellite":satTiles}).addTo(map);
  }

  function popup(street, parcel, image1, image2) {
    var returnStr = '<p>' + street + '</p>';
    returnStr += '<p>' + parcel + '</p>';
    if (image1 != '') {
        returnStr += '<p><a href="' + image1 + '" target="_blank">';
        returnStr += '<img src="' + image1 + '" width=300></a></p>';
    }
    if (image2 != '') {
        returnStr += '<p><a href="' + image2 + '" target="_blank">';
        returnStr += '<img src="' + image2 + '" width=300></a></p>';
    }
    return returnStr;
  }

  function initMarkers() {

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

    // points object is loaded from the data file
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
      marker.new = a.new;
      marker.found = true; // Helper attribute for the search function.

      marker.on('click', function(e) {
        selectedProperty(e.target.address, e.target.parcelid, e.target.claimed);
      });
      marker.bindPopup(popup(title, a.parcelid, a.image1, a.image2));
      allMarkers.push(marker);
    }


    // markerSearch array contains the search terms
    // Its size should be kept as multiples of allMarkers.length
    for (var i = 0; i < allMarkers.length; i++) {
        markerSearch.push(allMarkers[i].parcelid);
    }
    for (var i = 0; i < allMarkers.length; i++) {
        markerSearch.push(allMarkers[i].address);
    }

    markers = L.markerClusterGroup({
      chunkedLoading: true,
      chunkInterval: 20,
      chunkDelay: 50
    });

    markers.addLayers(allMarkers);
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
