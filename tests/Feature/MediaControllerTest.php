<?php

namespace Tests\Feature;

use Tests\TestCase;

class MediaControllerTest extends TestCase
{
    public function test_thumb_route_returns_not_found_for_missing_image_without_argument_error(): void
    {
        $response = $this->get('/image/test_100_100.jpg');

        $response->assertStatus(404);
    }
}
