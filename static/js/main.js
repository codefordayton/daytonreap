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

  function generateEmailLink(parcelid, address) {
    return "mailto:lotlinks@daytonohio.gov?subject=Parcel%20" + encodeURI(parcelid) + "%20Availability&body=Lot%20Links%20Team,%0D%0AI%20am%20interested%20in%20the%20following%20parcel,%20which%20LotLinker%20said%20was%20eligible%20for%20Lot%20Links.%20Can%20you%20confirm%20that%20it%20is%20available?%0D%0A%0D%0A" + encodeURI(parcelid) + '%0D%0A' + encodeURI(address);
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
      $.each(strs, function(i, str) {
        if (substrRegex.test(str)) {
          // the typeahead jQuery plugin expects suggestions to a
          // JavaScript object, refer to typeahead docs for more info
          matches.push({ value: str });
        }
      });
  
      cb(matches);
    };
  };
  
  $('#addressInput').on("keyup", function(e) {
    lookupValue($('#addressInput').val());
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
  
  $("#addressInput").typeahead({
    minLength: 3,
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
  function selectedProperty(address,parcelid) {
    $('#selectedAddress').text(address);
    $('#selectedParcelId').text(parcelid);
    $('#linkToTreasuresSite').html("<a href=\"" 
      + generateTreasurersLink(parcelid) 
      + "\" target=\"_blank\">View Property on Treasurer's Site</a>");
    $('#linkToGISSite').html("<a href=\"" 
      + generateGISLink(parcelid) 
      + "\" target=\"_blank\">View Property on GIS Site</a>");
    $('#linkToEmail').html("<a href=\"" 
      + generateEmailLink(parcelid, address) 
      + "\" >Confirm Availability via Email</a>");
    var intropanel = $(".intropanel");
    var height;
    if (intropanel.data("init-height")) {
        height = intropanel.data("init-height");
    } else {
        height = intropanel.height();
        intropanel.data("init-height", height);
    } 
    intropanel.css("max-height", height - 149);
  }
  
  function lookupValue(value) {
    var val = $('#addressInput').val();
    var refreshNeeded = false;
    var newMarkers = [];
    var allMarkerLength = allMarkers.length;
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
    else if (val.length < 3 && markerList.length !== allMarkers.length) {
      markerList = [];
    }
  
    if (newMarkers.length === 0) {
      refreshNeeded = true;
      markerList = allMarkers;
    }
    else if (newMarkers.length === 1) {
      selectedProperty(newMarkers[0].address, newMarkers[0].parcelid);
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
  
  function initMarkers() {
    markerList = [];
    for (var i = 0; i < points.length; i++) {
      var a = points[i];
      var title = a.street;
      var marker = L.marker(L.latLng(parseFloat(a.locationdata.latitude), parseFloat(a.locationdata.longitude)), { title: title});
      marker.address = a.street;
      marker.parcelid = a.parcelid;
  
      marker.on('click', function(e) {
        selectedProperty(e.target.address, e.target.parcelid);
      });
      marker.bindPopup(title);
      markerList.push(marker);
    }
    allMarkers = markerList;
  
    for (var i = 0; i < allMarkers.length; i++) {
      if (allMarkers[i].parcelid) {
        markerSearch.push(allMarkers[i].parcelid);
      }
      if (allMarkers[i].address) {
        markerSearch.push(allMarkers[i].address);
      }
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
      $("#"+clickedFAQ+" h4 span.expand-icon").replaceWith("<span class='expanded-icon'>x</span>");
    }
    
  }
  
  
  $("[id^=FAQ-]").click( function() {
    clickedFAQ(this);
  });
});


