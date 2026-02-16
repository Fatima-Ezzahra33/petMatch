<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class AuthControllerTest extends TestCase
{
    use RefreshDatabase;

    // ========== Registration Tests ==========

    /**
     * Test successful user registration
     */
    public function test_user_can_register(): void
    {
        Notification::fake();

        $response = $this->postJson('/api/register', [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'password' => 'Password123',
            'password_confirmation' => 'Password123',
            'username' => 'johndoe',
            'phone' => '1234567890',
            'location' => 'New York',
            'avatar' => 'https://example.com/avatar.jpg',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'message',
                'user' => ['id', 'name', 'email', 'username', 'phone', 'location', 'avatar'],
                'token',
                'email_verified',
            ])
            ->assertJson([
                'message' => 'User registered successfully. Please check your email to verify your account.',
                'email_verified' => false,
            ]);

        $this->assertDatabaseHas('users', [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'username' => 'johndoe',
        ]);

        // Verify password is hashed
        $user = User::where('email', 'john@example.com')->first();
        $this->assertTrue(Hash::check('Password123', $user->password));
    }

    /**
     * Test registration requires valid email
     */
    public function test_registration_requires_valid_email(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => 'John Doe',
            'email' => 'invalid-email',
            'password' => 'Password123',
            'password_confirmation' => 'Password123',
        ]);

        $response->assertStatus(422)
            ->assertJsonStructure(['message', 'errors'])
            ->assertJsonValidationErrors('email');
    }

    /**
     * Test registration requires password confirmation
     */
    public function test_registration_requires_password_confirmation(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'password' => 'Password123',
            'password_confirmation' => 'DifferentPassword',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors('password');
    }

    /**
     * Test registration requires minimum password length
     */
    public function test_registration_requires_minimum_password_length(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'password' => '123',
            'password_confirmation' => '123',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors('password');
    }

    /**
     * Test registration prevents duplicate email
     */
    public function test_registration_prevents_duplicate_email(): void
    {
        User::factory()->create(['email' => 'john@example.com']);

        $response = $this->postJson('/api/register', [
            'name' => 'Jane Doe',
            'email' => 'john@example.com',
            'password' => 'Password123',
            'password_confirmation' => 'Password123',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors('email');
    }

    /**
     * Test registration prevents duplicate username
     */
    public function test_registration_prevents_duplicate_username(): void
    {
        User::factory()->create(['username' => 'johndoe']);

        $response = $this->postJson('/api/register', [
            'name' => 'Jane Doe',
            'email' => 'jane@example.com',
            'password' => 'Password123',
            'password_confirmation' => 'Password123',
            'username' => 'johndoe',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors('username');
    }

    /**
     * Test successful user login
     */
    public function test_user_can_login(): void
    {
        $user = User::factory()->create([
            'email' => 'john@example.com',
            'password' => Hash::make('Password123'),
            'email_verified_at' => now(),
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'john@example.com',
            'password' => 'Password123',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'message',
                'user' => ['id', 'name', 'email'],
                'token',
            ])
            ->assertJson([
                'message' => 'Login successful',
            ]);

        $this->assertNotNull($response->json('token'));
    }

    /**
     * Test login fails with invalid email
     */
    public function test_login_fails_with_invalid_email(): void
    {
        $response = $this->postJson('/api/login', [
            'email' => 'nonexistent@example.com',
            'password' => 'Password123',
        ]);

        $response->assertStatus(401)
            ->assertJson([
                'message' => 'Invalid credentials',
            ]);
    }

    /**
     * Test login fails with invalid password
     */
    public function test_login_fails_with_invalid_password(): void
    {
        User::factory()->create([
            'email' => 'john@example.com',
            'password' => Hash::make('CorrectPassword'),
            'email_verified_at' => now(),
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'john@example.com',
            'password' => 'WrongPassword',
        ]);

        $response->assertStatus(401)
            ->assertJson([
                'message' => 'Invalid credentials',
            ]);
    }

    /**
     * Test login fails if email not verified
     */
    public function test_login_fails_if_email_not_verified(): void
    {
        User::factory()->create([
            'email' => 'john@example.com',
            'password' => Hash::make('Password123'),
            'email_verified_at' => null,
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'john@example.com',
            'password' => 'Password123',
        ]);

        $response->assertStatus(403)
            ->assertJson([
                'message' => 'Please verify your email before logging in',
                'email_verified' => false,
            ]);
    }

    /**
     * Test user can get authenticated user info
     */
    public function test_user_can_get_authenticated_user_info(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer $token")
            ->getJson('/api/me');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'user' => ['id', 'name', 'email', 'created_at'],
            ])
            ->assertJson([
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                ],
            ]);
    }

    /**
     * Test /me requires authentication
     */
    public function test_me_requires_authentication(): void
    {
        $response = $this->getJson('/api/me');

        $response->assertStatus(401)
            ->assertJson([
                'message' => 'Unauthenticated.',
            ]);
    }

    /**
     * Test user can logout
     */
    public function test_user_can_logout(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer $token")
            ->postJson('/api/logout');

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Logged out successfully',
            ]);

        // Verify token is deleted
        $this->assertDatabaseMissing('personal_access_tokens', [
            'name' => 'auth',
            'tokenable_id' => $user->id,
        ]);
    }

    /**
     * Test logout requires authentication
     */
    public function test_logout_requires_authentication(): void
    {
        $response = $this->postJson('/api/logout');

        $response->assertStatus(401)
            ->assertJson([
                'message' => 'Unauthenticated.',
            ]);
    }

    /**
     * Test user can update profile name
     */
    public function test_user_can_update_profile_name(): void
    {
        $user = User::factory()->create(['name' => 'John Doe']);
        $token = $user->createToken('auth')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer $token")
            ->putJson('/api/me', [
                'name' => 'Jane Doe',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Profile updated successfully',
                'user' => [
                    'name' => 'Jane Doe',
                ],
            ]);

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'name' => 'Jane Doe',
        ]);
    }

    /**
     * Test user can update profile email
     */
    public function test_user_can_update_profile_email(): void
    {
        $user = User::factory()->create(['email' => 'john@example.com']);
        $token = $user->createToken('auth')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer $token")
            ->putJson('/api/me', [
                'email' => 'newemail@example.com',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Profile updated successfully',
                'user' => [
                    'email' => 'newemail@example.com',
                ],
            ]);

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'email' => 'newemail@example.com',
        ]);
    }

    /**
     * Test user can update profile password
     */
    public function test_user_can_update_profile_password(): void
    {
        $user = User::factory()->create(['password' => Hash::make('OldPassword123')]);
        $token = $user->createToken('auth')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer $token")
            ->putJson('/api/me', [
                'password' => 'NewPassword456',
                'password_confirmation' => 'NewPassword456',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Profile updated successfully',
            ]);

        // Verify password is updated and hashed
        $updatedUser = User::find($user->id);
        $this->assertTrue(Hash::check('NewPassword456', $updatedUser->password));
    }

    /**
     * Test user can update profile phone and location
     */
    public function test_user_can_update_profile_phone_and_location(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer $token")
            ->putJson('/api/me', [
                'phone' => '9876543210',
                'location' => 'Los Angeles',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'user' => [
                    'phone' => '9876543210',
                    'location' => 'Los Angeles',
                ],
            ]);
    }

    /**
     * Test profile update prevents duplicate email
     */
    public function test_profile_update_prevents_duplicate_email(): void
    {
        $user1 = User::factory()->create(['email' => 'john@example.com']);
        $user2 = User::factory()->create(['email' => 'jane@example.com']);
        $token = $user2->createToken('auth')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer $token")
            ->putJson('/api/me', [
                'email' => 'john@example.com',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors('email');
    }

    /**
     * Test profile update validates email format
     */
    public function test_profile_update_validates_email_format(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer $token")
            ->putJson('/api/me', [
                'email' => 'invalid-email',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors('email');
    }

    /**
     * Test profile update validates password confirmation
     */
    public function test_profile_update_validates_password_confirmation(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer $token")
            ->putJson('/api/me', [
                'password' => 'NewPassword456',
                'password_confirmation' => 'DifferentPassword',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors('password');
    }

    /**
     * Test profile update requires authentication
     */
    public function test_profile_update_requires_authentication(): void
    {
        $response = $this->putJson('/api/me', [
            'name' => 'Jane Doe',
        ]);

        $response->assertStatus(401)
            ->assertJson([
                'message' => 'Unauthenticated.',
            ]);
    }

    /**
     * Test registration creates unverified user (email verification handled in EmailVerificationControllerTest)
     */
    public function test_registration_creates_unverified_user(): void
    {
        Notification::fake();

        $response = $this->postJson('/api/register', [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'password' => 'Password123',
            'password_confirmation' => 'Password123',
        ]);

        // User should exist but email not verified
        $user = User::where('email', 'john@example.com')->first();
        $this->assertFalse($user->hasVerifiedEmail());
    }
}

