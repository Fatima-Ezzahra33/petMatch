<?php

namespace Tests\Unit;

use App\Http\Middleware\CheckRole;
use App\Models\User;
use Closure;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Http\Response as IlluminateResponse;
use Symfony\Component\HttpFoundation\Response;
use Tests\TestCase;

class CheckRoleMiddlewareTest extends TestCase
{
    use RefreshDatabase;

    protected CheckRole $middleware;

    protected function setUp(): void
    {
        parent::setUp();
        $this->middleware = new CheckRole();
    }

    /**
     * Test middleware allows authenticated user with correct admin role
     */
    public function test_middleware_allows_authenticated_user_with_correct_admin_role(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $request = $this->createRequest($admin);
        $response = $this->middleware->handle($request, $this->next(), 'admin');

        $this->assertInstanceOf(Response::class, $response);
        $this->assertEquals(200, $response->getStatusCode());
    }

    /**
     * Test middleware allows authenticated user with correct user role
     */
    public function test_middleware_allows_authenticated_user_with_correct_user_role(): void
    {
        $user = User::factory()->create(['role' => 'user']);

        $request = $this->createRequest($user);
        $response = $this->middleware->handle($request, $this->next(), 'user');

        $this->assertInstanceOf(Response::class, $response);
        $this->assertEquals(200, $response->getStatusCode());
    }

    /**
     * Test middleware denies user with incorrect role
     */
    public function test_middleware_denies_user_with_incorrect_role(): void
    {
        $user = User::factory()->create(['role' => 'user']);

        $request = $this->createRequest($user);
        $response = $this->middleware->handle($request, $this->next(), 'admin');

        $this->assertInstanceOf(Response::class, $response);
        $this->assertEquals(403, $response->getStatusCode());
        
        $content = json_decode($response->getContent(), true);
        $this->assertStringContainsString('admin', $content['message']);
    }

    /**
     * Test middleware denies unauthenticated access
     */
    public function test_middleware_denies_unauthenticated_access(): void
    {
        $request = $this->createRequest(null);
        $response = $this->middleware->handle($request, $this->next(), 'admin');

        $this->assertInstanceOf(Response::class, $response);
        $this->assertEquals(401, $response->getStatusCode());
        $this->assertStringContainsString('Unauthenticated', $response->getContent());
    }

    /**
     * Test middleware returns correct error message for role mismatch
     */
    public function test_middleware_returns_correct_error_message_for_role_mismatch(): void
    {
        $adminUser = User::factory()->create(['role' => 'admin']);

        $request = $this->createRequest($adminUser);
        $response = $this->middleware->handle($request, $this->next(), 'user');

        $content = json_decode($response->getContent(), true);
        $this->assertArrayHasKey('message', $content);
        $this->assertStringContainsString("rôle 'user'", $content['message']);
    }

    /**
     * Test middleware with admin user checking for admin role
     */
    public function test_middleware_with_admin_user_checking_for_admin_role(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $request = $this->createRequest($admin);
        $response = $this->middleware->handle($request, $this->next(), 'admin');

        $this->assertInstanceOf(Response::class, $response);
        $this->assertEquals(200, $response->getStatusCode());
    }

    /**
     * Test middleware with regular user attempting to access admin role
     */
    public function test_middleware_with_regular_user_attempting_to_access_admin_role(): void
    {
        $regularUser = User::factory()->create(['role' => 'user']);

        $request = $this->createRequest($regularUser);
        $response = $this->middleware->handle($request, $this->next(), 'admin');

        $this->assertEquals(403, $response->getStatusCode());
    }

    /**
     * Test unauthenticated request returns 401
     */
    public function test_unauthenticated_request_returns_401_status(): void
    {
        $request = $this->createRequest(null);
        $response = $this->middleware->handle($request, $this->next(), 'admin');

        $this->assertEquals(401, $response->getStatusCode());
    }

    /**
     * Helper method to create a mock request
     */
    protected function createRequest(?User $user = null): Request
    {
        $request = Request::create('/', 'GET');

        if ($user) {
            $request->setUserResolver(function () use ($user) {
                return $user;
            });
        } else {
            $request->setUserResolver(function () {
                return null;
            });
        }

        return $request;
    }

    /**
     * Helper method to create a mock closure for the next middleware
     */
    protected function next(): Closure
    {
        return function (Request $request) {
            return new IlluminateResponse('OK', 200);
        };
    }
}
