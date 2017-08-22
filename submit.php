<?php 

require 'pdo.class.php'; 

if (isset($_POST["get_scores"])) :

	$geoJersey = new GeoJersey();

	echo json_encode($geoJersey->getScores());

endif;

if (isset($_POST["post_score"])) :

	$geoJersey = new GeoJersey($_POST["id"]);

	echo json_encode($geoJersey->setUserScore($_POST["score"]));

endif;





?>