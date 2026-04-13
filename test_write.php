<?php
$f = 'e:/Xampp/htdocs/NestifyTech/storage/app/data/lang/en_lang.json';
$d = json_decode(file_get_contents($f), true) ?: [];
$d['FileWriteTest'] = 'Success';
file_put_contents($f, json_encode($d, JSON_PRETTY_PRINT));
echo "Successfully updated $f\n";
