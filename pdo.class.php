<?php

/**
 *  This is the base class
 *  All other classes extend this class
 *  It provides a database connection and error handling in one spot
 *
 *  @author Tom Luce
 */

date_default_timezone_set('Europe/London');

class DatabaseConnection
{

    private $host      = "localhost";
    private $user      = "geojersey";
    private $pass      = "f&bKL0^0&Gm]";
    private $dbname    = "geojersey";

    public $dbh;
    public $error;
    public $stmt;

    // Constructor that creates a new database connection
    public function __construct()
    {
        // Set DSN
        $dsn = 'mysql:host=' . $this->host . ';dbname=' . $this->dbname .';charset=utf8';
        // Set options
        $options = array(
            PDO::ATTR_PERSISTENT    => true,
            PDO::ATTR_ERRMODE       => PDO::ERRMODE_EXCEPTION
        );
        // Create a new PDO instanace
        try{
            $this->dbh = new PDO($dsn, $this->user, $this->pass, $options);
        }
        // Catch any errors
        catch(PDOException $e){
            $this->error = $e->getMessage();
        }
    }

    // Runs sql prepared queries
    public function query($sql, $params = array()) {
        try {

            $this->stmt = $this->dbh->prepare($sql);
            if (count($params) > 0):
                $this->stmt->execute($params);
            else:
                $this->stmt->execute();
            endif;

            return $this->stmt;

        } catch (PDOException $e) {
            $this->error = $e->getMessage();

            echo "<pre>";
            var_dump($sql);
            var_dump($this->error);
            echo "</pre>";

            return false;
        }
    }

    public function bind($param, $value, $type = null)
    {
        if (is_null($type)) {
            switch (true) {
                case is_int($value):
                    $type = PDO::PARAM_INT;
                    break;
                case is_bool($value):
                    $type = PDO::PARAM_BOOL;
                    break;
                case is_null($value):
                    $type = PDO::PARAM_NULL;
                    break;
                default:
                    $type = PDO::PARAM_STR;
            }
        }
        $this->stmt->bindValue($param, $value, $type);
    }

    public function execute()
    {
        return $this->stmt->execute();
    }

    public function resultset()
    {
        $this->execute();
        return $this->stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function single(){
        $this->execute();
        return $this->stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function rowCount(){
        return $this->stmt->rowCount();
    }

    public function lastInsertId(){
        return $this->dbh->lastInsertId();
    }

    public function beginTransaction(){
        return $this->dbh->beginTransaction();
    }

    public function endTransaction(){
        return $this->dbh->commit();
    }

    public function cancelTransaction()
    {
        return $this->dbh->rollBack();
    }

    public function debugDumpParams(){
        return $this->stmt->debugDumpParams();
    }

}

class GeoJersey extends DatabaseConnection
{

    public $facebook_id;

    public function __construct($facebook_id = NULL)
    {
        // Create a new database connection using the parent class constructor
        parent::__construct();

        $this->facebook_id = $facebook_id;
    }

    public function getUserData()
    {
        $sql = "SELECT * FROM scores WHERE facebook_id = :facebook_id";
        $params = array(':facebook_id' => $this->facebook_id);
        $stmt = $this->query($sql, $params);

        if ($stmt->rowCount() > 0) {
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } else {
            return false;
        }
    }

    public function getScores()
    {
        $sql = "SELECT facebook_id, name, score FROM scores WHERE score IS NOT NULL ORDER BY score ASC";
        $params = array();
        $stmt = $this->query($sql, $params);

        if ($stmt->rowCount() > 0) {
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } else {
            return false;
        }
    }

    /**
     *  Updates score
     */
    public function setUserScore($score)
    {
        $user = $this->getUserData();

        if ($score != false && $score != 0 && $score > 0) :

            if ($score < $user["score"] || !$user["score"]) :

                $sql = "UPDATE scores SET score = :score WHERE facebook_id = :facebook_id";
                $params = array(':score' => $score, ':facebook_id' => $this->facebook_id);
                $stmt = $this->query($sql,$params);
                return true;
            endif;

        endif;
        return false;
    }

    /**
     *  Adds new user
     */
    public function addNewUser($user_profile)
    {
        $sql = "INSERT into scores (facebook_id, name, first_name, last_name, link, locale, timezone, gender) VALUES (:facebook_id, :name, :first_name, :last_name, :link, :locale, :timezone, :gender)";
        $params = array(":facebook_id" => $user_profile["id"] , ":name" => $user_profile["name"], ":first_name" => $user_profile["first_name"], ":last_name" => $user_profile["last_name"], ":link" => $user_profile["link"], ":locale" => $user_profile["locale"], ":timezone" => $user_profile["timezone"], ":gender" => $user_profile["gender"]);
        $stmt = $this->query($sql,$params);
    }





}


?>
