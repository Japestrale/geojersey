var map;
var panorama;
var marker;
var locationPosition;
var guessPosition;
var jerseyPosition = new google.maps.LatLng(49.21, -2.135);
var geocoder = new google.maps.Geocoder();
var geocoderIndex = 0;
var distance;
var markerListener;

var pinColor = "2F76EE"; // a random blue color that i picked
var pinImage = new google.maps.MarkerImage("http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|" + pinColor);

// Initialize the maps on window load
google.maps.event.addDomListener(window, 'load', initialize);

// Returns a random location as a google maps object
function getRandomLocation() {

	var lngMin = -2.255;
  var lngMax = -2.024;
  var latMin = 49.173;
  var latMax = 49.258;

  var lngDiff = lngMax - lngMin;
  var latDiff = latMax - latMin;

  var lat = latMin + ( Math.random() * latDiff );
  var lng = lngMin + ( Math.random() * lngDiff );

  return new google.maps.LatLng(lat, lng);
}

// Initialize the two maps
function initialize() {

	// Create the map and center it on Jersey
	var mapOptions = {
        center: jerseyPosition,
        zoom: 11,
        minZoom: 11,
        streetViewControl: false,
        overviewMapControl: false,
        mapTypeControl: false
	};	
	map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);

	// Find a random location
	locationPosition = getRandomLocation();
	
	// Run geocoder
	runGeocoder();
}

function runGeocoder() {

	geocoder.geocode({'latLng': locationPosition}, function(results, status) {

    if (status == google.maps.GeocoderStatus.OK) {

      if (results[1]) {

      	//console.log('SUCCESS');

        locationPosition = results[0].geometry.location;	

        // Create the panorama at this location
				var panoramaOptions = {
				  position: locationPosition,
				  pov: {
				    heading: 34,
				    pitch: 0
				  },
				  addressControl: false,
				  panControl: false,
				  zoomControl: false,
				  clickToGo: false,
				  disableDefaultUI: true
				};

				panorama = new google.maps.StreetViewPanorama(document.getElementById("pano"), panoramaOptions);

				// Check to see that the panorama loaded properly and if not re-run
				setTimeout(function(){ 
					if ( panorama.getPano() == undefined ) {
	
						// Find another random location
						locationPosition = getRandomLocation();

						geocoderIndex++;
						setTimeout(runGeocoder,geocoderIndex*200);
					}
				}, 1000);
				
				//map.setStreetView(panorama);

				markerListener = google.maps.event.addListener(map, 'click', function(event) {
            mapZoom = map.getZoom();
            setTimeout(function(){placeMarker(event.latLng);}, 200);
        });


      } else {

      	// console.log('Geocoder failed due to: ' + status);
      	geocoderIndex++;
      	locationPosition = getRandomLocation();
      	setTimeout(runGeocoder,geocoderIndex*200);

      }

    } else {

      // console.log('Geocoder failed due to: ' + status);
      geocoderIndex++;
      locationPosition = getRandomLocation();
      setTimeout(runGeocoder,geocoderIndex*200);

    }
  });
}

function placeMarker(location) {

	if (mapZoom == map.getZoom()) {

		if ( marker ) {

	    marker.setPosition(location);
	    marker.setAnimation(google.maps.Animation.DROP);
	    marker.setMap(map);

	  } else {

	    marker = new google.maps.Marker({
	      position: location,
	      map: map,
	      animation: google.maps.Animation.DROP
	    });

	  }
	}
}

$(document).ready(function() {

	// Reload the page in order to give the user a new round
	$('#new-round').on('click', function() {
		// location.reload();

		// Get a new location
		locationPosition = getRandomLocation();

		// Run the geocoder and update the streetview
    runGeocoder();

    // Remove any markers if we have them
    if (marker) {
    	marker.setMap(null);
    	marker = null;
    }
    if (locationMarker) {
    	locationMarker.setMap(null);
    	locationMarker = null;
    }

    // Reset the distance
    if (distance) {
    	distance = undefined;
    }

    // Make map small
    makeMapSmall();

    // Center map on Jersey
    setTimeout(function(){ map.setCenter(jerseyPosition) }, 500);

    // Reset zoom
    map.setZoom(11);

    // Add the place guess button
    $('#place-guess').show();

    // Hide the new round button
    $('#new-round').hide();

    // Remove the distance display
    $('#result').remove();

    // Show the resize button
    $('#resize-map').show();


	});

	// What to do if the user places a guess
	$('#place-guess').on('click', function() {
		
		// Do nothing if there is no marker set on the map
		if (!marker) {
			return false;
		}

		// Remove the event listener that allows user to place a marker
		google.maps.event.removeListener(markerListener);	

		// Get the position of their guess marker
		var guessPosition = marker.getPosition();

		// Compute the distance between the guess and the actual location
		distance = google.maps.geometry.spherical.computeDistanceBetween(guessPosition, locationPosition);
		distance = Math.round( distance );

		// Add the actual location marker to the map
		locationMarker = new google.maps.Marker({
      position: locationPosition,
      map: map,
      animation: google.maps.Animation.DROP,
  		icon: pinImage
    });

		// Resize our map and zoom in and center on the two markers
    $('#map-canvas').animate({width: 800, height: 600}, 200, function() {

    	triggerResize();

    	//  Make an array of the LatLng's of the markers you want to show
			var LatLngList = new Array (guessPosition, locationPosition);

			//  Create a new viewpoint bound
			var bounds = new google.maps.LatLngBounds();

			//  Go through each and increase the bounds to take this point
			for (var i = 0, LtLgLen = LatLngList.length; i < LtLgLen; i++) {
			  bounds.extend(LatLngList[i]);
			}

			// Fit these bounds to the map
			map.fitBounds(bounds);
			map.setCenter(bounds.getCenter());

		});

		// Add and indicator of how far away they were
    $('#map-canvas-wrap').append('<p id="result">You were ' + distance.number_with_delimiter() + ' metres away</p>');

    // Hide the place guess button
    $('#place-guess').hide();

    // Show the new round button
    $('#new-round').show();

    // Hide the resize button
    $('#resize-map').hide();

	});

	$('#resize-map').click(function(){

		if ($('#map-canvas').height() == 300) {
			makeMapLarge();    
		} else {
			makeMapSmall();
	  }

	});

	function triggerResize() {
		google.maps.event.trigger(map, "resize");
	}

	function makeMapSmall() {

		$('#map-canvas').animate({width: 400, height: 300}, 200, function(){
	    	
    	triggerResize();
    	
    	if ( marker ) {
    		map.setCenter(marker.getPosition());
    	} else {
				map.setCenter(jerseyPosition);
			}

    });
	}

	function makeMapLarge() {

	  $('#map-canvas').animate({width: 800, height: 600}, 200, function() {
	  	
	  	triggerResize()

			if ( marker ) {
    		map.setCenter(marker.getPosition());
    	} else {
				map.setCenter(jerseyPosition);
			}

			if ( map.getZoom() == 11 ) {
				map.setZoom(12);
			} 

	  });
	}

});

// Prints a number with a delimiter
Number.prototype.number_with_delimiter = function(delimiter) {
  var number = this + '', delimiter = delimiter || ',';
  var split = number.split('.');
  split[0] = split[0].replace(
      /(\d)(?=(\d\d\d)+(?!\d))/g,
      '$1' + delimiter
  );
  return split.join('.');    
};