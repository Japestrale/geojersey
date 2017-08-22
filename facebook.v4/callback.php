<?php 

error_reporting(E_ALL);
ini_set('display_errors', 1);


require_once 'Facebook/FacebookSession.php';

use Facebook\FacebookSession;
use Facebook\FacebookRequest;
use Facebook\GraphUser;
use Facebook\FacebookRequestException;

FacebookSession::setDefaultApplication('279155478912008','7b70269a705783e606479deab321025f');

// // Use one of the helper classes to get a FacebookSession object.
// //   FacebookRedirectLoginHelper
// //   FacebookCanvasLoginHelper
// //   FacebookJavaScriptLoginHelper
// // or create a FacebookSession with a valid access token:
// $session = new FacebookSession('access-token-here');

// // Get the GraphUser object for the current user:

// try {
//   $me = (new FacebookRequest(
//     $session, 'GET', '/me'
//   ))->execute()->getGraphObject(GraphUser::className());
//   echo $me->getName();
// } catch (FacebookRequestException $e) {
//   // The Graph API returned an error
// } catch (\Exception $e) {
//   // Some other error occurred
// }


$helper = new FacebookRedirectLoginHelper($redirect_url);
try {
    $session = $helper->getSessionFromRedirect();
} catch(FacebookRequestException $ex) {
    // When Facebook returns an error
} catch(\Exception $ex) {
    // When validation fails or other local issues
}
if ($session) {
  // Logged in.
}

$redirect_url = 
$helper = new FacebookRedirectLoginHelper($redirect_url, $apiVersion = NULL);
echo '<a href="' . $helper->getLoginUrl() . '">Login with Facebook</a>';


 ?>