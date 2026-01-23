<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Carbon\Carbon;

class AuthController extends Controller
{
    // REGISTER
    public function register(Request $request)
    {
        try {
            $data = $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|string|email|max:255|unique:users',
                'password' => 'required|string|min:6|confirmed',
                'username' => 'nullable|string|max:255|unique:users',
                'phone' => 'nullable|string|max:20',
                'location' => 'nullable|string|max:255',
                'avatar' => 'nullable|string|max:255',
            ]);

            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => Hash::make($data['password']),
                'username' => $data['username'] ?? null,
                'phone' => $data['phone'] ?? null,
                'location' => $data['location'] ?? null,
                'avatar' => $data['avatar'] ?? null,
            ]);

            event(new Registered($user));

            $token = $user->createToken('auth')->plainTextToken;

            return response()->json([
                'message' => 'User registered successfully. Please check your email to verify your account.',
                'user' => $user,
                'token' => $token,
                'email_verified' => $user->hasVerifiedEmail(),
            ], 201);
        } catch (ValidationException $e) {
            $errors = $e->errors();

            // Check if email already exists
            if (isset($errors['email'])) {
                return response()->json([
                    'message' => 'An account with this email already exists.',
                    'errors' => $errors
                ], 422);
            }

            // Check if username already exists
            if (isset($errors['username'])) {
                return response()->json([
                    'message' => 'This username is already taken.',
                    'errors' => $errors
                ], 422);
            }

            // Generic validation error
            return response()->json([
                'message' => 'Please check your input and try again.',
                'errors' => $errors
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Registration failed. Please try again later.',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    // verify email
    public function verifyEmail(Request $request)
    {
        $user = User::findOrFail($request->route('id'));
        // Check if the hash matches
        if (!hash_equals(
            (string) $request->route('hash'),
            sha1($user->getEmailForVerification())
        )) {
            return response()->json([
                'message' => 'Invalid verification link'
            ], 400);
        }

        // Check if already verified
        if ($user->hasVerifiedEmail()) {
            return response()->json([
                'message' => 'Email already verified'
            ], 200);
        }

        // Mark as verified
        $user->markEmailAsVerified();
        return response()->json([
            'message' => 'Email verified successfully'
        ], 200);
    }

    // RESEND VERIFICATION EMAIL
    // AuthController.php
    public function resendVerificationEmail(Request $request)
    {
        $data = $request->validate([
            'email' => 'required|email|exists:users,email'
        ]);

        $user = User::where('email', $data['email'])->first();

        // Check if already verified
        if ($user->hasVerifiedEmail()) {
            return response()->json([
                'message' => 'Email already verified'
            ], 200);
        }

        // Rate limiting (prevent spam)
        $lastSent = cache()->get("resend_email_{$user->id}");

        if ($lastSent && Carbon::parse($lastSent)->addMinutes(2)->isFuture()) {
            return response()->json([
                'message' => 'Please wait before requesting another email'
            ], 429); // 429 Too Many Requests
        }

        // Send verification email
        $user->sendEmailVerificationNotification();

        // Cache the timestamp
        cache()->put("resend_email_{$user->id}", now(), 120); // 2 minutes

        return response()->json([
            'message' => 'Verification email sent successfully'
        ], 200);
    }

    // LOGIN
    public function login(Request $request)
    {
        try {
            $data = $request->validate([
                'email' => 'required|email', // 'email' => 'required|email|exists:users' but this gives a clear msg that says password incorrect which is a security risk,
                'password' => 'required'
            ]);

            $user = User::where('email', $data['email'])->first();

            if (!$user || !Hash::check($data['password'], $user->password)) {
                return response()->json([
                    'message' => 'Invalid credentials'
                ], 401); // 401 Unauthorized
            }
            // Check if email is verified
            if (!$user->hasVerifiedEmail()) {
                return response()->json([
                    'message' => 'Please verify your email before logging in',
                    'email_verified' => false
                ], 403);
            }

            $token = $user->createToken('auth')->plainTextToken;

            return response()->json([
                'message' => 'Login successful',
                'user' => $user,
                'token' => $token,
            ], 200); // 200 OK

        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Login failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // GET AUTHENTICATED USER
    public function me(Request $request)
    {
        return response()->json([
            'user' => $request->user()
        ], 200); // 200 OK
    }

    // LOGOUT
    public function logout(Request $request)
    {
        try {
            $request->user()->tokens()->delete();

            return response()->json([
                'message' => 'Logged out successfully'
            ], 200); // 200 OK

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Logout failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    //update profile
    public function updateProfile(Request $request)
    {
        try {
            $user = $request->user();

            $data = $request->validate([
                'name' => 'sometimes|required|string|max:255',
                'email' => 'sometimes|required|string|email|max:255|unique:users,email,' . $user->id,
                'password' => 'sometimes|required|string|min:6|confirmed',
                'phone' => 'sometimes|nullable|string|max:20',
                'location' => 'sometimes|nullable|string|max:500',
                'avatar' => 'sometimes|nullable|url',

            ]);

            if (isset($data['password'])) {
                $data['password'] = Hash::make($data['password']);
            }

            $user->update($data);

            return response()->json([
                'message' => 'Profile updated successfully',
                'user' => $user
            ], 200); // 200 OK

        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Profile update failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
