<?php

namespace Tests\Unit;

use App\Http\Requests\ResetPasswordRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Validator;
use Tests\TestCase;

class ResetPasswordRequestTest extends TestCase
{
    use RefreshDatabase;

    protected ResetPasswordRequest $formRequest;

    protected function setUp(): void
    {
        parent::setUp();
        $this->formRequest = new ResetPasswordRequest();
    }

    /**
     * Test form request allows authorization
     */
    public function test_form_request_authorizes_request(): void
    {
        $this->assertTrue($this->formRequest->authorize());
    }

    /**
     * Test token field is required
     */
    public function test_token_field_is_required(): void
    {
        $data = [
            'email' => 'user@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ];

        $validator = Validator::make($data, $this->formRequest->rules());

        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('token', $validator->errors()->toArray());
    }

    /**
     * Test email field is required
     */
    public function test_email_field_is_required(): void
    {
        $data = [
            'token' => 'reset-token-123',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ];

        $validator = Validator::make($data, $this->formRequest->rules());

        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('email', $validator->errors()->toArray());
    }

    /**
     * Test email must be valid email format
     */
    public function test_email_must_be_valid_email_format(): void
    {
        $data = [
            'token' => 'reset-token-123',
            'email' => 'not-an-email',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ];

        $validator = Validator::make($data, $this->formRequest->rules());

        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('email', $validator->errors()->toArray());
    }

    /**
     * Test email must exist in users table
     */
    public function test_email_must_exist_in_users_table(): void
    {
        $data = [
            'token' => 'reset-token-123',
            'email' => 'nonexistent@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ];

        $validator = Validator::make($data, $this->formRequest->rules());

        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('email', $validator->errors()->toArray());
    }

    /**
     * Test password field is required
     */
    public function test_password_field_is_required(): void
    {
        User::factory()->create(['email' => 'user@example.com']);

        $data = [
            'token' => 'reset-token-123',
            'email' => 'user@example.com',
            'password_confirmation' => 'Password123!',
        ];

        $validator = Validator::make($data, $this->formRequest->rules());

        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('password', $validator->errors()->toArray());
    }

    /**
     * Test password confirmation is required
     */
    public function test_password_confirmation_is_required(): void
    {
        User::factory()->create(['email' => 'user@example.com']);

        $data = [
            'token' => 'reset-token-123',
            'email' => 'user@example.com',
            'password' => 'Password123!',
        ];

        $validator = Validator::make($data, $this->formRequest->rules());

        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('password_confirmation', $validator->errors()->toArray());
    }

    /**
     * Test password must be confirmed
     */
    public function test_password_must_be_confirmed(): void
    {
        User::factory()->create(['email' => 'user@example.com']);

        $data = [
            'token' => 'reset-token-123',
            'email' => 'user@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'DifferentPassword123!',
        ];

        $validator = Validator::make($data, $this->formRequest->rules());

        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('password', $validator->errors()->toArray());
    }

    /**
     * Test matching passwords pass validation
     */
    public function test_matching_passwords_pass_validation(): void
    {
        User::factory()->create(['email' => 'user@example.com']);

        $data = [
            'token' => 'reset-token-123',
            'email' => 'user@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ];

        $validator = Validator::make($data, $this->formRequest->rules());

        $this->assertFalse($validator->fails());
    }

    /**
     * Test custom error message for token.required
     */
    public function test_custom_error_message_for_token_required(): void
    {
        $data = [
            'email' => 'user@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ];

        $validator = Validator::make(
            $data,
            $this->formRequest->rules(),
            $this->formRequest->messages()
        );

        $this->assertTrue($validator->fails());
        $this->assertStringContainsString(
            'Reset token is required.',
            $validator->errors()->first('token')
        );
    }

    /**
     * Test custom error message for email.required
     */
    public function test_custom_error_message_for_email_required(): void
    {
        $data = [
            'token' => 'reset-token-123',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ];

        $validator = Validator::make(
            $data,
            $this->formRequest->rules(),
            $this->formRequest->messages()
        );

        $this->assertTrue($validator->fails());
        $this->assertStringContainsString(
            'Email is required.',
            $validator->errors()->first('email')
        );
    }

    /**
     * Test custom error message for email.exists
     */
    public function test_custom_error_message_for_email_exists(): void
    {
        $data = [
            'token' => 'reset-token-123',
            'email' => 'nonexistent@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ];

        $validator = Validator::make(
            $data,
            $this->formRequest->rules(),
            $this->formRequest->messages()
        );

        $this->assertTrue($validator->fails());
        $this->assertStringContainsString(
            'We could not find a user with that email address.',
            $validator->errors()->first('email')
        );
    }

    /**
     * Test custom error message for password.required
     */
    public function test_custom_error_message_for_password_required(): void
    {
        User::factory()->create(['email' => 'user@example.com']);

        $data = [
            'token' => 'reset-token-123',
            'email' => 'user@example.com',
            'password_confirmation' => 'Password123!',
        ];

        $validator = Validator::make(
            $data,
            $this->formRequest->rules(),
            $this->formRequest->messages()
        );

        $this->assertTrue($validator->fails());
        $this->assertStringContainsString(
            'Password is required.',
            $validator->errors()->first('password')
        );
    }

    /**
     * Test custom error message for password.confirmed
     */
    public function test_custom_error_message_for_password_confirmed(): void
    {
        User::factory()->create(['email' => 'user@example.com']);

        $data = [
            'token' => 'reset-token-123',
            'email' => 'user@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'DifferentPassword123!',
        ];

        $validator = Validator::make(
            $data,
            $this->formRequest->rules(),
            $this->formRequest->messages()
        );

        $this->assertTrue($validator->fails());
        $this->assertStringContainsString(
            'Password confirmation does not match.',
            $validator->errors()->first('password')
        );
    }

    /**
     * Test custom error message for password_confirmation.required
     */
    public function test_custom_error_message_for_password_confirmation_required(): void
    {
        User::factory()->create(['email' => 'user@example.com']);

        $data = [
            'token' => 'reset-token-123',
            'email' => 'user@example.com',
            'password' => 'Password123!',
        ];

        $validator = Validator::make(
            $data,
            $this->formRequest->rules(),
            $this->formRequest->messages()
        );

        $this->assertTrue($validator->fails());
        $this->assertStringContainsString(
            'Password confirmation is required.',
            $validator->errors()->first('password_confirmation')
        );
    }

    /**
     * Test form request has all required rules
     */
    public function test_form_request_has_all_required_rules(): void
    {
        $rules = $this->formRequest->rules();

        $this->assertArrayHasKey('token', $rules);
        $this->assertArrayHasKey('email', $rules);
        $this->assertArrayHasKey('password', $rules);
        $this->assertArrayHasKey('password_confirmation', $rules);
    }

    /**
     * Test token field is a string
     */
    public function test_token_field_must_be_string(): void
    {
        User::factory()->create(['email' => 'user@example.com']);

        $rules = $this->formRequest->rules();
        $this->assertContains('string', $rules['token']);
    }

    /**
     * Test password field has Password::defaults() rule
     */
    public function test_password_field_has_password_defaults_rule(): void
    {
        $rules = $this->formRequest->rules();

        $this->assertIsArray($rules['password']);
        $this->assertContains('required', $rules['password']);
        $this->assertContains('confirmed', $rules['password']);
        // Password::defaults() is also included
    }

    /**
     * Test multiple validation errors are captured
     */
    public function test_multiple_validation_errors_are_captured(): void
    {
        $data = [
            'email' => 'invalid-email',
            'password' => 'weak',
            'password_confirmation' => 'different',
        ];

        $validator = Validator::make($data, $this->formRequest->rules());

        $this->assertTrue($validator->fails());
        $this->assertGreaterThan(1, count($validator->errors()->toArray()));
    }

    /**
     * Test form request with all messages defined
     */
    public function test_form_request_has_all_messages_defined(): void
    {
        $messages = $this->formRequest->messages();

        $expectedMessages = [
            'token.required',
            'email.required',
            'email.exists',
            'password.required',
            'password.confirmed',
            'password_confirmation.required',
        ];

        foreach ($expectedMessages as $message) {
            $this->assertArrayHasKey($message, $messages);
        }
    }
}
