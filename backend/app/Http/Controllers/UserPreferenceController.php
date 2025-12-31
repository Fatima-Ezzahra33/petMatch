<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class UserPreferenceController extends Controller
{
    public function extractPreferences(Request $request)
    {
        $request->validate([
            'user_message' => 'required|string|max:2000',
        ]);

        $userMessage = $request->input('user_message');

        // Prompt très précis pour obtenir un JSON parfait
        $prompt = <<<PROMPT
You are an expert assistant that converts a user's natural-language message
(in ANY language) into a structured JSON object for pet search.

IMPORTANT:
- The user input may be in any language.
- You must ALWAYS output normalized ENGLISH values that match database fields.

OBJECTIVE:
Extract explicit information and semantically interpret vague descriptions
ONLY for the "keywords" field.

STRICT RULES:

1) "species"
- Array of lowercase strings.
- Allowed values ONLY: "dog", "cat".
- Include ONLY if explicitly mentioned by the user (in any language).
- Empty [] if not specified.
- NEVER infer species.

2) "type"
- Array of lowercase breed/type names in English.
- NORMALIZE breed names to their BASE FORM:
  * "siberian husky" → "husky"
  * "golden retriever" → "retriever" 
  * "british shorthair" → "shorthair"
  * "maine coon" → "coon"
- If a specific breed is mentioned, extract BOTH the full name AND the base breed:
  * User says "siberian husky" → output: ["siberian husky", "husky"]
  * User says "golden" → output: ["golden retriever", "retriever"]
- Include ONLY if explicitly mentioned.
- Empty [] if not specified.

3) "gender"
- "male", "female", or null.
- Null if not explicitly stated or if ambiguous.

4) "age"
- Object with:
  - "min": integer or null
  - "max": integer or null
- Use null if no boundary is provided.

5) "status"
- Always "available".

6) "keywords" (SEMANTIC INTERPRETATION ALLOWED)
- Array of lowercase ENGLISH keywords matching database values.
- Interpret vague, informal, exaggerated, or slang descriptions.

SEMANTIC INFERENCE RULES FOR "keywords":

PLAYFUL / ENERGETIC:
- Examples (any language):
  "plays a lot", "very playful", "hyper", "full of energy",
  "joue beaucoup", "très joueur", "activo", "muy energético",
  "a lotttt", "soooo playful"
→ add: "playful", "energetic"

CALM / QUIET:
- Examples:
  "calm", "quiet", "chill", "relaxed",
  "calme", "tranquille", "posé"
→ add: "calm"

ENVIRONMENT:
- Examples:
  "apartment", "small space",
  "appartement", "piso pequeño"
→ add: "apartment"

FAMILY / KIDS:
- Examples:
  "kids", "children", "family",
  "enfants", "famille", "niños"
→ add: "kids", "family"

NORMALIZATION:
- Ignore repeated letters ("lotttt", "soooo").
- Normalize meanings to standard English keywords.
- Output ONLY keywords that exist in the database vocabulary.

IMPORTANT CONSTRAINTS:
- NEVER infer species, breed, gender, or age.
- Semantic inference is allowed ONLY for "keywords".
- Do NOT add assumptions beyond clear meaning.

FINAL JSON STRUCTURE (KEYS AND TYPES MUST MATCH, VALUES ARE DYNAMIC):

{
  "species": [string],
  "type": [string],
  "gender": "male" | "female" | null,
  "age": {
    "min": integer | null,
    "max": integer | null
  },
  "status": "available",
  "keywords": [string]
}
RULES FOR NULLS AND EMPTY ARRAYS:
- Use null ONLY when the value is unknown or not specified.
- Use [] ONLY when no values apply.
- DO NOT force null or empty values if information is present.

NEVER omit keys. All keys must always be present in the output JSON.

RESPONSE RULES:
- Respond ONLY with JSON.
- No explanations.
- No markdown.

Maintenant, transforme ce message :
{$userMessage}
PROMPT;

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . env('GROQ_API_KEY'),
                'Content-Type' => 'application/json',
            ])->post('https://api.groq.com/openai/v1/chat/completions', [
                'model' => 'llama-3.3-70b-versatile', // Très bon et rapide. Tu peux aussi tester 'mixtral-8x7b-32768' ou 'gemma2-9b-it'
                'messages' => [
                    ['role' => 'system', 'content' => 'Tu réponds UNIQUEMENT en JSON valide.'],
                    ['role' => 'user', 'content' => $prompt],
                ],
                'temperature' => 0.3,
                'max_tokens' => 500,
            ]);

            if (!$response->successful()) {
                Log::error('Groq error: ' . $response->body());
                return response()->json(['error' => 'Erreur lors de la communication avec l\'IA'], 500);
            }

            $groqOutput = $response->json()['choices'][0]['message']['content'] ?? '';

            // Extraction du JSON (au cas où il y aurait du bruit)
            preg_match('/\{.*\}/s', $groqOutput, $matches);
            $jsonString = $matches[0] ?? $groqOutput;

            $preferences = json_decode($jsonString, true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                Log::error('JSON invalid from Groq: ' . $groqOutput);
                return response()->json(['error' => 'L\'IA n\'a pas retourné un JSON valide'], 500);
            }

            // Normalisation finale (Dev1 garantit un format parfait)
            $preferences = [
                'species' => is_array($preferences['species'] ?? []) ? array_map('strtolower', array_slice($preferences['species'], 0, 2)) : [],
                'type' => is_array($preferences['type'] ?? []) ? array_map('strtolower', $preferences['type']) : [],
                'gender' => in_array(strtolower($preferences['gender'] ?? ''), ['male', 'female']) ? strtolower($preferences['gender']) : null,
                'age' => [
                    'min' => isset($preferences['age']['min']) && is_int($preferences['age']['min']) ? $preferences['age']['min'] : null,
                    'max' => isset($preferences['age']['max']) && is_int($preferences['age']['max']) ? $preferences['age']['max'] : null,
                ],
                'status' => 'available',
                'keywords' => is_array($preferences['keywords'] ?? []) ? array_map('strtolower', $preferences['keywords']) : [],
            ];

            return response()->json([
                'preferences' => $preferences,
                'message' => 'Préférences extraites avec succès grâce à Groq ! 🧠➜🐾'
            ]);

        } catch (\Exception $e) {
            Log::error('Exception in extractPreferences: ' . $e->getMessage());
            return response()->json(['error' => 'Erreur interne'], 500);
        }
    }
}