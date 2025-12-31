<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Pet;
use Illuminate\Support\Facades\Log;

class PetMatchController extends Controller
{
    public function matchPets(Request $request)
    {
        Log::info('=== MATCH PETS REQUEST ===', [
            'user_message' => $request->input('user_message')
        ]);

        $preferences = null;
        $extractionFailed = false;

        try {
            if ($request->filled('user_message')) {
                $prefController = new UserPreferenceController();
                $prefResponse = $prefController->extractPreferences($request);

                if ($prefResponse instanceof \Illuminate\Http\JsonResponse) {
                    $statusCode = $prefResponse->getStatusCode();

                    if ($statusCode === 200) {
                        $data = $prefResponse->getData(true);
                        $preferences = $data['preferences'] ?? null;

                        Log::info('=== AI EXTRACTION SUCCESSFUL ===', [
                            'preferences' => $preferences
                        ]);
                    } else {
                        $extractionFailed = true;
                        Log::error('=== AI EXTRACTION FAILED ===');
                    }
                }
            }
        } catch (\Throwable $e) {
            $extractionFailed = true;
            Log::error('=== EXCEPTION IN AI EXTRACTION ===', [
                'message' => $e->getMessage()
            ]);
        }

        // Fallback
        if ($preferences === null) {
            Log::warning('=== USING FALLBACK PREFERENCES ===');

            $validated = $request->validate([
                'species' => 'array|nullable',
                'type' => 'array|nullable',
                'gender' => 'string|nullable',
                'age' => 'array|nullable',
                'age.min' => 'integer|nullable',
                'age.max' => 'integer|nullable',
                'status' => 'string|nullable',
                'keywords' => 'array|nullable',
            ]);

            $preferences = [
                'species' => $validated['species'] ?? [],
                'type' => $validated['type'] ?? [],
                'gender' => $validated['gender'] ?? null,
                'age' => $validated['age'] ?? ['min' => null, 'max' => null],
                'status' => $validated['status'] ?? 'available',
                'keywords' => $validated['keywords'] ?? [],
            ];
        }

        // Ensure defaults
        $preferences['species'] = $preferences['species'] ?? [];
        $preferences['type'] = $preferences['type'] ?? [];
        $preferences['gender'] = $preferences['gender'] ?? null;
        $preferences['age'] = $preferences['age'] ?? ['min' => null, 'max' => null];
        $preferences['status'] = $preferences['status'] ?? 'available';
        $preferences['keywords'] = $preferences['keywords'] ?? [];

        // Check if we have any meaningful preferences
        $hasPreferences = !empty($preferences['species']) ||
            !empty($preferences['type']) ||
            $preferences['gender'] !== null ||
            $preferences['age']['min'] !== null ||
            $preferences['age']['max'] !== null ||
            !empty($preferences['keywords']);

        if (!$hasPreferences) {
            return response()->json([
                'pets' => [],
                'total' => 0,
                'message' => '⚠️ Could not understand your preferences. Please be more specific.',
                'debug' => [
                    'preferences' => $preferences,
                    'extraction_failed' => $extractionFailed
                ]
            ]);
        }

        // Get pets
        $pets = Pet::where('status', $preferences['status'])->get();

        if ($pets->isEmpty()) {
            return response()->json([
                'pets' => [],
                'total' => 0,
                'message' => 'No available pets found 😔'
            ], 200);
        }

        // FIXED: Calculate max score - DON'T count age if not specified
        $maxPossibleScore = 0;
        if (!empty($preferences['species'])) $maxPossibleScore += 30;
        if (!empty($preferences['type'])) $maxPossibleScore += 20;
        if ($preferences['gender']) $maxPossibleScore += 10;
        // Only add age points if user specified age range
        if ($preferences['age']['min'] !== null || $preferences['age']['max'] !== null) {
            $maxPossibleScore += 20;
        }
        if (!empty($preferences['keywords'])) {
            $keywordCount = min(count($preferences['keywords']), 5); // Max 5 keywords
            $maxPossibleScore += (10 * $keywordCount);
        }

        Log::info('=== SCORING SETUP ===', ['max_possible_score' => $maxPossibleScore]);

        $scoredPets = [];

        foreach ($pets as $pet) {
            $score = 0;
            $matchDetails = [];

            // Species match (+30)
            if (!empty($preferences['species'])) {
                if (in_array(strtolower($pet->species), array_map('strtolower', $preferences['species']))) {
                    $score += 30;
                    $matchDetails[] = 'species';
                }
            }

            // Type match (+20)
            if (!empty($preferences['type'])) {
                $petType = strtolower(trim($pet->type));
                $matched = false;

                foreach ($preferences['type'] as $prefType) {
                    $prefType = strtolower(trim($prefType));

                    // Check if either string contains the other
                    if (str_contains($petType, $prefType) || str_contains($prefType, $petType)) {
                        $matched = true;
                        break;
                    }
                }

                if ($matched) {
                    $score += 20;
                    $matchDetails[] = 'type';
                }
            }

            // Gender match (+10)
            if ($preferences['gender']) {
                if (strtolower($pet->gender) === strtolower($preferences['gender'])) {
                    $score += 10;
                    $matchDetails[] = 'gender';
                }
            }

            // FIXED: Only score age if user specified age range
            if ($preferences['age']['min'] !== null || $preferences['age']['max'] !== null) {
                $ageMin = $preferences['age']['min'];
                $ageMax = $preferences['age']['max'];
                if (($ageMin === null || $pet->age >= $ageMin) && ($ageMax === null || $pet->age <= $ageMax)) {
                    $score += 20;
                    $matchDetails[] = 'age';
                }
            }

            // Keywords in description (+10 each)
            $keywordsMatched = 0;
            foreach ($preferences['keywords'] as $keyword) {
                if ($keywordsMatched >= 5) break; // Stop after 5 matches

                if (!empty($keyword) && stripos((string)($pet->description ?? ''), (string)$keyword) !== false) {
                    $score += 10;
                    $matchDetails[] = "keyword:{$keyword}";
                    $keywordsMatched++;
                }
            }

            // Calculate percentage
            $percentageScore = $maxPossibleScore > 0 ? round(($score / $maxPossibleScore) * 100) : 0;

            $scoredPets[] = [
                'id' => $pet->id,
                'name' => $pet->name,
                'species' => $pet->species,
                'type' => $pet->type,
                'age' => $pet->age,
                'gender' => $pet->gender,
                'description' => $pet->description,
                'profile_picture' => $pet->profile_picture,
                'status' => $pet->status,
                'score' => $percentageScore,
                'raw_score' => $score,
                'matches' => $matchDetails,
            ];
        }

        // Sort by score descending
        usort($scoredPets, function ($a, $b) {
            return $b['score'] <=> $a['score'];
        });

        // STRICT FILTERING: Only return requested species
        $matchingPets = array_filter($scoredPets, function ($pet) use ($preferences) {
            // Must have score > 0
            if ($pet['score'] <= 0) {
                return false;
            }

            // If species was specified, pet MUST match one of them
            if (!empty($preferences['species'])) {
                return in_array(strtolower($pet['species']), array_map('strtolower', $preferences['species']));
            }

            // If no species specified, include all pets with score > 0
            return true;
        });

        if (empty($matchingPets)) {
            Log::warning('=== NO MATCHES FOUND ===');
            return response()->json([
                'pets' => array_slice($scoredPets, 0, 5),
                'total' => 5,
                'message' => '😕 No exact matches. Here are some available pets!',
                'debug' => [
                    'preferences' => $preferences,
                    'max_possible_score' => $maxPossibleScore
                ]
            ]);
        }

        $finalPets = array_values($matchingPets);
        $topScore = $finalPets[0]['score'];

        if ($topScore >= 80) {
            $message = '🐾 Found ' . count($finalPets) . ' excellent matches!';
        } elseif ($topScore >= 50) {
            $message = '🐾 Found ' . count($finalPets) . ' good matches!';
        } else {
            $message = '🔍 Found ' . count($finalPets) . ' potential matches';
        }

        Log::info('=== RESULTS ===', [
            'total' => count($finalPets),
            'top_score' => $topScore
        ]);

        return response()->json([
            'pets' => $finalPets,
            'total' => count($finalPets),
            'message' => $message,
            'debug' => [
                'preferences' => $preferences,
                'max_possible_score' => $maxPossibleScore,
                'extraction_failed' => $extractionFailed,
                'total_checked' => $pets->count(),
                'with_matches' => count($matchingPets),
            ]
        ]);
    }
}
