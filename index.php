<?php 

// error_reporting(E_ALL);
// ini_set('display_errors', 1);

// session_destroy();

require 'facebook.php';
require 'pdo.class.php'; 

// Create our Application instance (replace this with your appId and secret).
$facebook = new Facebook(array(
	'appId'  => '279155478912008',
	'secret' => '7b70269a705783e606479deab321025f',
));



// Get User ID
$user = $facebook->getUser();

// We may or may not have this data based on whether the user is logged in.
//
// If we have a $user id here, it means we know the user is logged into
// Facebook, but we don't know if the access token is valid. An access
// token is invalid if the user logged out of Facebook.

if ($user) {
	try {
		// Proceed knowing you have a logged in user who's authenticated.
		$user_profile = $facebook->api('/me');

		// Save user to the database without the score if they dont exist
		$geoJersey = new GeoJersey($user_profile["id"]);

		if (!$geoJersey->getUserData()) :
			
			$geoJersey->addNewUser($user_profile);

		endif;

	} catch (FacebookApiException $e) {
		error_log($e);
		$user = null;
	}
}

// Login or logout url will be needed depending on current user state.
if ($user) {
	$logoutUrl = $facebook->getLogoutUrl();
} else {
	// $statusUrl = $facebook->getLoginStatusUrl();
	$loginUrl = $facebook->getLoginUrl();
}
?>
<!doctype html>
<html lang="en-GB">
<head>
	<meta charset="UTF-8">
	<title>GeoJersey - Guess where you are!</title>
	<meta name="viewport" content="initial-scale=1.0, user-scalable=no" />
	<meta name="author" content="Jack O'Connor, James Mallon, Tom Luce, Tom Hacquoil" />
	<meta name="description" content="So you think you know Jersey? Guess where you are given a Google Street View panorma of a random location on the island">
	
	<link rel="stylesheet" href="style.css">
	<link rel="shortcut icon" href="favicon.ico">
	<link rel="apple-touch-icon" href="/favicon-64.png" />

	<!-- Google Maps API Include -->
	<script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyBhHfPCLlmFrT2YcnOAiuF9cBHfbNYhgVw&sensor=true&libraries=geometry"></script>

		<!-- JQuery Include -->
	<script src="//ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js"></script>

	<script src="scripts.js"></script>

	<script>
		(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
		(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
		m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
		})(window,document,'script','//www.google-analytics.com/analytics.js','ga');

		ga('create', 'UA-50787396-1', 'geojersey.co.uk');
		ga('send', 'pageview');

	</script>

</head>

<body>

	<img src="images/geojersey_logo.png" alt="logo" id="logo" />
		
	<i id="show-map" class="batch" data-icon="&#xF02C;"></i>

	<div id="info-container">
		
		<p id="score-info">
			<span id="guesses"></span>/<span id="max-guesses"></span>
			&nbsp;&nbsp;
			Score: <span id="score"></span>
			&nbsp;&nbsp;
			Best: <span id="best-score">N/A</span>
		</p>

		<div id="map-canvas-wrap">
		
			<div id="map-canvas"></div>

			<div id="leaderboard-wrap">
				<ol id="leaderboard"></ol>
			</div>

			<?php if ($user) : ?>
				<div id="post-score" data-id="<?=$user_profile['id']?>">Post Best Score</div>
			<?php else : ?>
				<a id="login" href="<?php echo $loginUrl; ?>">Login with Facebook To Post Score</a>
			<?php endif; ?>

			<i id="resize-map" class="batch" data-icon="&#xF0A5;"></i>
			<i id="hide-map" class="batch" data-icon="&#xF02D;"></i>
			<div id="show-leaderboard">Leaderboard</div>
			<div id="hide-leaderboard">Map</div>

		</div>

		<button id="place-guess">Guess Location</button>
		<button id="new-guess">New Location</button>
		<button id="new-round">New Round</button>
		
	</div>

	<div id="pano"></div>

	<a href="https://twitter.com/Japestrale"><img id="twitter" src="images/twitter-50.png" alt="twitter-link"></a>
	<a href="http://www.linkedin.com/pub/tom-luce/50/993/462"><img id="linkedin" src="images/linkedin-50.png" alt="linkedin-link"></a>

</body>

</html>