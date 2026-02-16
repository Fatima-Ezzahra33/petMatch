<?php

namespace Tests\Unit;

use App\Http\Requests\ForgotPasswordRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Validator;
use Tests\TestCase;

class ForgotPasswordRequestTest extends TestCase
{
    use RefreshDatabase;

    protected ForgotPasswordRequest $formRequest;

    protected function setUp(): void
    {
        parent::setUp();
        $this->formRequest = new ForgotPasswordRequest();
    }

    /**
     * Test form request allows authorization
     */
    public function test_form_request_authorizes_request(): void
    {
        $this->assertTrue($this->formRequest->authorize());
    }

    /**
     * Test email field is required
     */
    public function test_email_field_is_required(): void
    {
        $data = [];

        $validator = Validator::make($data, $this->formRequest->rules());

        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('email', $validator->errors()->toArray());
    }

    /**
     * Test email field must be a valid email format
     */
    public function test_email_field_must_be_valid_email_format(): void
    {
        $data = ['email' => 'not-an-email'];

        $validator = Validator::make($data, $this->formRequest->rules());

        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('email', $validator->errors()->toArray());
    }

    /**
     * Test email must exist in users table
     */
    public function test_email_must_exist_in_users_table(): void
    {
        $data = ['email' => 'nonexistent@example.com'];

        $validator = Validator::make($data, $this->formRequest->rules());

        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('email', $validator->errors()->toArray());
    }

    /**
     * Test valid email passes validation
     */
    public function test_valid_email_passes_validation(): void
    {
        User::factory()->create(['email' => 'user@example.com']);

        $data = ['email' => 'user@example.com'];

        $validator = Validator::make($data, $this->formRequest->rules());

        $this->assertFalse($validator->fails());
    }

    /**
     * Test custom error message for email.exists
     */
    public function test_custom_error_message_for_email_exists(): void
    {
        $data = ['email' => 'nonexistent@example.com'];

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
     * Test multiple validation errors are captured
     */
    public function test_multiple_validation_errors_are_captured(): void
    {
        $data = [
            'email' => 'invalid-email',
        ];

        $validator = Validator::make($data, $this->formRequest->rules());

        $this->assertTrue($validator->fails());
        $this->assertGreaterThan(0, count($validator->errors()->get('email')));
    }

    /**
     * Test form request has correct rules structure
     */
    public function test_form_request_has_correct_rules_structure(): void
    {
        $rules = $this->formRequest->rules();

        $this->assertArrayHasKey('email', $rules);
        $this->assertIsArray($rules['email']);
        $this->assertContains('required', $rules['email']);
        $this->assertContains('email', $rules['email']);
        $this->assertContains('exists:users,email', $rules['email']);
    }

    /**
     * Test form request has messages method
     */
    public function test_form_request_has_messages_method(): void
    {
        $messages = $this->formRequest->messages();

        $this->assertIsArray($messages);
        $this->assertArrayHasKey('email.exists', $messages);
    }

    /**
     * Test form request with email at domain boundary
     */
    public function test_form_request_with_valid_email_at_domain_boundary(): void
    {
        User::factory()->create(['email' => 'test@example.co.uk']);

        $data = ['email' => 'test@example.co.uk'];

        $validator = Validator::make($data, $this->formRequest->rules());

        $this->assertFalse($validator->fails());
    }

    /**
     * Test form request with whitespace in email
     */
    public function test_form_request_with_whitespace_in_email(): void
    {
        $data = ['email' => '  user@example.com  '];

        $validator = Validator::make($data, $this->formRequest->rules());

        // The validator should fail because of the spaces, or may trim them
        // depending on Laravel's behavior
        $this->assertTrue($validator->fails());
    }
}
