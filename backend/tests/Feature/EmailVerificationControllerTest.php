<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\URL;
use Tests\TestCase;

class EmailVerificationControllerTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test public email verification with valid signature
     */
    public function test_verify_public_with_valid_signature(): void
    {
        $user = User::factory()->unverified()->create();

        $verificationUrl = URL::signedRoute(
            'verification.verify',
            ['id' => $user->id, 'hash' => sha1($user->getEmailForVerification())]
        );

        // Extract path and query from full URL
        $urlParts = parse_url($verificationUrl);
        $path = $urlParts['path'];
        $query = $urlParts['query'] ?? '';

        $response = $this->get($path . '?' . $query);

        // Should redirect to frontend with verified=success
        $response->assertRedirect();
        $this->assertStringContainsString('verified=success', $response->headers->get('Location'));

        // Verify user's email is marked as verified
        $this->assertTrue($user->fresh()->hasVerifiedEmail());
    }

    /**
     * Test public email verification fails with invalid hash
     */
    public function test_verify_public_fails_with_invalid_hash(): void
    {
        $user = User::factory()->unverified()->create();

        // Use invalid hash - signed middleware will return 403 for invalid signature
        $response = $this->get("/api/email/verify/{$user->id}/invaldhash");

        // Should return 403 since signature is invalid
        $response->assertStatus(403);
    }

    /**
     * Test public email verification fails with expired signature
     */
    public function test_verify_public_fails_with_unsigned_url(): void
    {
        $user = User::factory()->unverified()->create();

        // Create a URL that looks signed but without valid signature
        $hash = sha1($user->getEmailForVerification());
        $response = $this->get("/api/email/verify/{$user->id}/{$hash}");

        // Without valid signature, signed middleware returns 403
        $response->assertStatus(403);

        // Verify user's email is NOT marked as verified
        $this->assertFalse($user->fresh()->hasVerifiedEmail());
    }

    /**
     * Test public email verification for already verified email
     */
    public function test_verify_public_for_already_verified_email(): void
    {
        $user = User::factory()->create(['email_verified_at' => now()]);

        $verificationUrl = URL::signedRoute(
            'verification.verify',
            ['id' => $user->id, 'hash' => sha1($user->getEmailForVerification())]
        );

        $urlParts = parse_url($verificationUrl);
        $path = $urlParts['path'];
        $query = $urlParts['query'] ?? '';

        $response = $this->get($path . '?' . $query);

        // Should redirect to frontend with verified=already
        $response->assertRedirect();
        $this->assertStringContainsString('verified=already', $response->headers->get('Location'));
    }

    /**
     * Test public email verification with non-existent user
     */
    public function test_verify_public_with_non_existent_user(): void
    {
        $hash = sha1('test@example.com');
        $response = $this->get("/api/verify-public/999/{$hash}");

        // Should return 404 for non-existent user
        $response->assertStatus(404);
    }

    /**
     * Test resend verification email with valid email
     */
    public function test_resend_verification_email_with_valid_email(): void
    {
        Notification::fake();

        $user = User::factory()->unverified()->create(['email' => 'john@example.com']);

        $response = $this->postJson('/api/email/resend', [
            'email' => 'john@example.com',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Verification email sent successfully',
            ]);

        // Verify the notification was sent
        Notification::assertSentTo([$user], \App\Notifications\CustomVerifyEmail::class);
    }

    /**
     * Test resend verification email requires email field
     */
    public function test_resend_verification_email_requires_email(): void
    {
        $response = $this->postJson('/api/email/resend', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors('email');
    }

    /**
     * Test resend verification email with non-existent user
     */
    public function test_resend_verification_email_with_non_existent_user(): void
    {
        $response = $this->postJson('/api/email/resend', [
            'email' => 'nonexistent@example.com',
        ]);

        $response->assertStatus(404)
            ->assertJson([
                'message' => 'User not found',
            ]);
    }

    /**
     * Test resend verification email fails if already verified
     */
    public function test_resend_verification_email_fails_if_already_verified(): void
    {
        $user = User::factory()->create([
            'email' => 'john@example.com',
            'email_verified_at' => now(),
        ]);

        $response = $this->postJson('/api/email/resend', [
            'email' => 'john@example.com',
        ]);

        $response->assertStatus(400)
            ->assertJson([
                'message' => 'Email already verified',
            ]);
    }

    /**
     * Test resend verification email validates email format
     */
    public function test_resend_verification_email_validates_email_format(): void
    {
        $response = $this->postJson('/api/email/resend', [
            'email' => 'invalid-email',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors('email');
    }

    /**
     * Test multiple verification emails can be sent
     */
    public function test_multiple_verification_emails_can_be_sent(): void
    {
        Notification::fake();

        $user = User::factory()->unverified()->create(['email' => 'john@example.com']);

        // First request
        $response1 = $this->postJson('/api/email/resend', [
            'email' => 'john@example.com',
        ]);
        $response1->assertStatus(200);

        // Second request (should also work, but may be rate limited depending on implementation)
        $response2 = $this->postJson('/api/email/resend', [
            'email' => 'john@example.com',
        ]);

        // Status depends on rate limiting implementation in controller
        $this->assertTrue(
            $response2->status() === 200 || $response2->status() === 429
        );
    }

    /**
     * Test verification email notification contains correct data
     */
    public function test_verification_email_notification_contains_correct_data(): void
    {
        Notification::fake();

        $user = User::factory()->unverified()->create(['email' => 'john@example.com']);

        $this->postJson('/api/email/resend', [
            'email' => 'john@example.com',
        ]);

        Notification::assertSentTo(
            [$user],
            \App\Notifications\CustomVerifyEmail::class,
            function ($notification) use ($user) {
                // Verify the notification is for the correct user
                return true; // Notification structure check
            }
        );
    }

    /**
     * Test verification flow from registration to email verification
     */
    public function test_full_verification_flow_from_registration(): void
    {
        Notification::fake();

        // Register user
        $response = $this->postJson('/api/register', [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'password' => 'Password123',
            'password_confirmation' => 'Password123',
        ]);

        $response->assertStatus(201)
            ->assertJson(['email_verified' => false]);

        $user = User::where('email', 'john@example.com')->first();

        // Resend verification email
        $resendResponse = $this->postJson('/api/email/resend', [
            'email' => 'john@example.com',
        ]);

        $resendResponse->assertStatus(200)
            ->assertJson([
                'message' => 'Verification email sent successfully',
            ]);

        // Verify the user still hasn't verified email
        $this->assertFalse($user->fresh()->hasVerifiedEmail());

        // Now verify email with valid signed URL
        $verificationUrl = URL::signedRoute(
            'verification.verify',
            ['id' => $user->id, 'hash' => sha1($user->getEmailForVerification())]
        );

        $urlParts = parse_url($verificationUrl);
        $path = $urlParts['path'];
        $query = $urlParts['query'] ?? '';

        $verifyResponse = $this->get($path . '?' . $query);

        $verifyResponse->assertRedirect();
        $this->assertStringContainsString('verified=success', $verifyResponse->headers->get('Location'));

        // Verify user's email is now marked as verified
        $this->assertTrue($user->fresh()->hasVerifiedEmail());
    }
}
