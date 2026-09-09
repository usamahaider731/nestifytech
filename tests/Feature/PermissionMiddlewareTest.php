<?php

namespace Tests\Feature;

use App\Http\Middleware\CheckPermission;
use Illuminate\Contracts\Http\Kernel;
use Tests\TestCase;

class PermissionMiddlewareTest extends TestCase
{
    public function test_permission_middleware_alias_is_registered(): void
    {
        $kernel = $this->app->make(Kernel::class);

        $this->assertArrayHasKey('permission', $kernel->getRouteMiddleware());
        $this->assertSame(CheckPermission::class, $kernel->getRouteMiddleware()['permission']);
    }
}
