<?php
    set_time_limit(0);

    $code = $_GET['code'];

    $json = json_decode(file_get_contents('./multiplier_trails.json'));

    if ($json->$code)
        echo $json->$code;
    else
        echo '';
?>