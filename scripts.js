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

$(document).ready(function() {

	var map;
	var mapHeightSmall = 273;
	var mapHeightLarge = 506;
	var mapWidthSmall = 346;
	var mapWidthLarge = 728;
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

	// Define the defaults and set them in the page
	var maxGuesses = 6;
	var guesses = 0;
	var score = 0;
	var bestScore = null;

	$('#max-guesses').text(maxGuesses);
	$('#guesses').text(guesses);
	$('#score').text(score);

	// Initialize the maps on window load
	google.maps.event.addDomListener(window, 'load', initialize);

	// If we've got localstorage available
	if ( typeof(Storage) !== "undefined" ) {

		// console.log( localStorage.getItem("best-score") );

		// If the user has a defined best score then retrieve it and update the view
		if ( localStorage.getItem("best-score") ) {

			bestScore = parseInt(localStorage.getItem("best-score"));
			$('#best-score').text( bestScore.number_with_delimiter() );
			// console.log(bestScore);

		} 
		
	} else {
		alert('The browser you are using is outdated.\n\nPlease upgrade to enable the scoring system.\n\nI recommend downloading Google Chrome');
	}

	// Updates the score information above the map
	function updateScoreInfo() {
		// console.log(score);
		$('#score').text(score.number_with_delimiter());
		$('#guesses').text(guesses);

	}

	function saveScoreInfo() {
		localStorage.setItem("geojersey_guesses", guesses);
		localStorage.setItem("geojersey_score", score);
		localStorage.setItem("geojersey_midround", true);
	}


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
						// mode : 'webgl'
					};

					panorama = new google.maps.StreetViewPanorama(document.getElementById("pano"), panoramaOptions);

					// Check to see that the panorama loaded properly and if not re-run
					setTimeout(function(){ 

						// The panorama didn;t load properly
						if ( panorama.getPano() === undefined ) {
		
							// Find another random location
							locationPosition = getRandomLocation();

							geocoderIndex++;
							setTimeout(runGeocoder,geocoderIndex*200);

						} else {

							// The panorama loaded properly
							
							// Reset the geocoder index
							geocoderIndex = 0;

							//map.setStreetView(panorama);

							// Add an event listener to the map that places a marker on click
							markerListener = google.maps.event.addListener(map, 'click', function(event) {
									mapZoom = map.getZoom();
									setTimeout(function(){placeMarker(event.latLng);}, 200);
							});


						}
					}, 1000);

				} else {

					// Status is OK but no results...

					// console.log('Geocoder failed due to: ' + status);
					geocoderIndex++;
					locationPosition = getRandomLocation();
					setTimeout(runGeocoder,geocoderIndex*200);

				}

			} else {

				// Status is not OK, probalby due to an invalid location

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


	// New guess saves score and updates total, then chooses new location
	$('#new-guess').on('click', newGuess);

	function newGuess() {

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
		setTimeout(function(){ map.setCenter(jerseyPosition); }, 500);

		// Reset zoom
		map.setZoom(11);

		// Add the place guess button
		$('#place-guess').show();

		// Hide the new guess button
		$('#new-guess').hide();

		// Hide the new round button
		$('#new-round').hide();

		// Remove the distance display
		$('#result').remove();

		// Show the resize button
		$('#resize-map').show();

		// If we're on a mobile then we're goign to want to hide the map temporarily
		if ( $('#hide-map').is(':visible') ) {

			$('#info-container').slideToggle(200);
			triggerResize();

		}

	}

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

		// If we're on a small screen then we dont want to make the map large
		if ( $('#hide-map').is(':visible') ) {

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

		} else {

			// Resize our map and zoom in and center on the two markers
			$('#map-canvas').animate({width: mapWidthLarge, height: mapHeightLarge}, 200, function() {

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

		}

		// Add and indicator of how far away they were
		$('#map-canvas-wrap').append('<p id="result">You were ' + distance.number_with_delimiter() + ' metres away</p>');

		// Hide the place guess button
		$('#place-guess').hide();

		// Show the new guess button
		$('#new-guess').show();

		// Hide the resize button
		// $('#resize-map').hide();

		// Update the number of guesses
		guesses++;

		// Increase the total score value so far
		score += distance;

		// Update the values in the info pane
		updateScoreInfo();

		// If the user is mid-round then update their info
		if (guesses < maxGuesses) {

			// Save the values to localstorage
			saveScoreInfo();

		} else {
			
			// What to do if we already have a best score
			if ( bestScore !== null ) {

				// Check to see if this score beats the old best one 
				if ( score < bestScore ) {

					// If it does then set it in local storage and update the view
					bestScore = score;
					localStorage.setItem("best-score", bestScore);
					$('#best-score').text( bestScore.number_with_delimiter() );

				}

				// Post score at the end of a round no matter what
				postScore();

			} else {

				bestScore = score;
				localStorage.setItem("best-score", bestScore);
				$('#best-score').text( bestScore.number_with_delimiter() );

			}

			$('#new-guess').hide();
			$('#new-round').show();	
			// alert("You got " + score + " points");
			

		}

	});
	

	// Clicking the new round button resets everything and starts a new game
	$('#new-round').click(function(){

		// Reset our localstorage values
		localStorage.removeItem('score');
		localStorage.removeItem('guesses');

		// Reset the actual values
		guesses = 0;
		score = 0;

		// Reset the values in the info pane
		updateScoreInfo();

		newGuess();

	});


	// Clicking thes resize button on the map on dekstops and tablets
	$('#resize-map').click(function(){

		// console.log($('#map-canvas').height());

		if ($('#map-canvas').height() == mapHeightSmall) {
			makeMapLarge();  
			// console.log('Map is small');  
		} else {
			makeMapSmall();
			// console.log('Map is large');  
		}

	});


	// For mobiles hide map when user clicks button
	$('#hide-map').click(function(){

		$('#info-container').slideToggle(200);
		triggerResize();
		if ( marker ) {
			map.setCenter(marker.getPosition());
		} else {
			map.setCenter(jerseyPosition);
		}

	});

	// For mobiles show map when user clicks button next to logo
	$('#show-map').click(function(){

		$('#info-container').slideToggle(200);
		triggerResize();
		if ( marker ) {
			map.setCenter(marker.getPosition());
		} else {
			map.setCenter(jerseyPosition);
		}

	});

	function triggerResize() {
		google.maps.event.trigger(map, "resize");
	}

	function makeMapSmall() {

		$('#map-canvas').animate({ width: mapWidthSmall, height: mapHeightSmall }, 200, function(){
				
			triggerResize();
			
			if ( marker ) {
				map.setCenter(marker.getPosition());
			} else {
				map.setCenter(jerseyPosition);
			}

		});
	}

	function makeMapLarge() {

		$('#map-canvas').animate({width: mapWidthLarge, height: mapHeightLarge}, 200, function() {
			
			triggerResize();

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


	// Get scores
	function getAndLoadScores() {
		$.ajax({
			url: "submit.php",
			type: "post",
			dataType: "json",
			data: "get_scores=true",
			success: function (data) {
				// console.log(data);
				$('#leaderboard').empty();
				$.each(data, function(index,value) {
					// console.log(value);
					$("#leaderboard").append('<li><img src="https://graph.facebook.com/' + value.facebook_id + '/picture" alt="' + value.name + '">' + value.name + ' <span>(' + value.score + ')</span></li>');
				});
			},
			error: function (data, xhr, status) {
				// console.log(data);
				// console.log(xhr);
				// console.log(status);
			}
		});
	}

	function postScore() {

		var id = $('#post-score').data('id');

		// Only post the score if we have a valid facebook id
		if (id) {
			
			var dataStr = "post_score=true&score=" + bestScore + "&id=" + id;
			// console.log(dataStr);

			$.ajax({
				url: "submit.php",
				type: "post",
				dataType: "json",
				data: dataStr,
				success: function (data) {
					// console.log(data);
					getAndLoadScores();
				},
				error: function (data) {
					// console.log(data);
				}
			});		
		} else {
			getAndLoadScores();
		}
	}

	// Auto post score score on load (if not then just load scores)
	postScore();


	// Post score
	$('#post-score').click(postScore);


	$('#show-leaderboard').click(function(){

		$('#show-leaderboard').hide();
		$('#hide-leaderboard').show();
		// $('#post-score').show();
		$('#login').show();
		$('#leaderboard-wrap').slideToggle(200);


	});

	$('#hide-leaderboard').click(function(){

		$('#show-leaderboard').show();
		$('#hide-leaderboard').hide();
		// $('#post-score').hide();
		$('#login').hide();
		$('#leaderboard-wrap').slideToggle(200);

	});



});
