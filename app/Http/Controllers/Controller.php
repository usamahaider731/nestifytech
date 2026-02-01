<?php

namespace App\Http\Controllers;

abstract class Controller
{
    protected string $json_file_location;

    public function __construct()
    {
        $this->json_file_location = storage_path('app/data');

        // Ensure directory exists
        if (!file_exists($this->json_file_location)) {
            mkdir($this->json_file_location, 0755, true);
        }
    }
}
