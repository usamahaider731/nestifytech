<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Http;

class AiController extends Controller
{
    public $file;

    public $data;

    public function __construct()
    {
        parent::__construct();
        $this->file = $this->json_file_location . '/setting.json';
        $this->data = $this->loadAiSettings();
    }

    protected function loadAiSettings(): array
    {
        if (! File::exists($this->file)) {
            return [];
        }

        $settings = json_decode(File::get($this->file), true);

        return $settings['ai'] ?? [];
    }

    protected function aiIsEnabled(): bool
    {
        return ! empty($this->data['ai_toggle']['value']);
    }

    protected function promptKeyForType(string $type): string
    {
        return $type . '_prompt';
    }

    public function checkField(Request $request)
    {
        $type = (string) $request->type;

        if (! $this->aiIsEnabled()) {
            return response()->json([
                'status' => 'error',
                'data' => 'AI is disabled in settings.',
            ]);
        }

        if (empty($this->data['api_key']['value'])) {
            return response()->json([
                'status' => 'error',
                'data' => 'AI API key is missing.',
            ]);
        }

        $promptKey = $this->promptKeyForType($type);

        if (empty($this->data[$promptKey]['value'])) {
            return response()->json([
                'status' => 'error',
                'data' => 'AI prompt is not configured for this field.',
            ]);
        }

        return response()->json([
            'status' => 'success',
            'data' => $this->data[$promptKey],
        ]);
    }

    public function generateText(Request $request)
    {
        $type = (string) $request->type;

        if (! $this->aiIsEnabled()) {
            return response()->json([
                'status' => 'error',
                'data' => 'AI is disabled in settings.',
            ]);
        }

        $promptKey = $this->promptKeyForType($type);

        if (empty($this->data[$promptKey]['value'])) {
            return response()->json([
                'status' => 'error',
                'data' => 'Invalid prompt type.',
            ]);
        }

        if (empty($this->data['api_key']['value'])) {
            return response()->json([
                'status' => 'error',
                'data' => 'AI API key is missing.',
            ]);
        }

        $prompt = $this->buildPrompt(
            $this->data[$promptKey]['value'],
            (array) ($request->requiredFieldsValue ?? []),
            $type
        );

        $userMessage = $type === 'chatbot'
            ? ($request->requiredFieldsValue['message'] ?? 'Hello')
            : 'Generate the content now using the product details provided in the system instructions.';

        $platform = $this->data['ai_platform']['value'] ?? null;
        $maxTokens = in_array($type, ['description', 'short_description', 'seo_description'], true) ? 1200 : 500;
        $messages = [
            ['role' => 'system', 'content' => $prompt],
            ['role' => 'user', 'content' => $userMessage],
        ];

        $endpoint = match ($platform) {
            'openai' => 'https://api.openai.com/v1/chat/completions',
            'groq' => 'https://api.groq.com/openai/v1/chat/completions',
            'experientiallabs' => 'https://api.experientiallabs.ai/v1/chat/completions',
            default => null,
        };

        if ($endpoint === null) {
            return response()->json([
                'status' => 'error',
                'data' => 'AI platform not configured.',
            ], 422);
        }

        // gpt-5.6-luna (and several Experientiallabs models) pin sampling and
        // reject temperature/top_p with 400 invalid_parameter.
        $payload = match ($platform) {
            'openai' => [
                'model' => $this->data['model']['value'] ?? 'gpt-4o-mini',
                'messages' => $messages,
                'temperature' => 0.7,
                'max_tokens' => $maxTokens,
            ],
            'groq' => [
                'model' => $this->data['model']['value'] ?? 'llama-3.1-8b-instant',
                'messages' => $messages,
                'temperature' => 0.7,
                'max_tokens' => $maxTokens,
            ],
            'experientiallabs' => [
                'model' => $this->data['model']['value'] ?? 'gpt-5.6-luna',
                'messages' => $messages,
                'max_tokens' => $maxTokens,
            ],
        };

        try {
            $response = Http::timeout(60)
                ->connectTimeout(10)
                ->withToken($this->data['api_key']['value'])
                ->acceptJson()
                ->post($endpoint, $payload);
        } catch (\Throwable $e) {
            return response()->json([
                'status' => 'error',
                'data' => 'AI request failed: '.$e->getMessage(),
            ], 502);
        }

        if ($response->failed()) {
            $error = $response->json('error.message')
                ?? $response->json('message')
                ?? 'AI request failed.';

            if ($param = $response->json('error.param')) {
                $error .= " (param: {$param})";
            }

            return response()->json([
                'status' => 'error',
                'data' => $error,
            ], $response->status() >= 400 ? $response->status() : 502);
        }

        $text = trim((string) $response->json('choices.0.message.content', ''));

        if ($text === '') {
            return response()->json([
                'status' => 'error',
                'data' => 'AI returned an empty response.',
            ], 502);
        }

        return response()->json([
            'status' => 'success',
            'text' => $text,
        ]);
    }

    protected function buildPrompt(string $prompt, array $fields, string $type): string
    {
        $context = '';

        if ($type === 'chatbot' && isset($fields['message'])) {
            $message = $fields['message'];

            $products = DB::table('posts')->where('type', 'product')
                ->where('title', 'like', '%' . $message . '%')
                ->limit(3)
                ->get();

            $taxonomies = DB::table('taxonomies')->whereIn('type', ['category', 'brand'])
                ->where('title', 'like', '%' . $message . '%')
                ->limit(3)
                ->get();

            if ($products->isNotEmpty() || $taxonomies->isNotEmpty()) {
                $context = "\n\nCRITICAL CONTEXT (Current System Data):\n";

                if ($products->isNotEmpty()) {
                    $context .= 'Products found: ' . $products->pluck('title')->implode(', ') . "\n";
                }

                if ($taxonomies->isNotEmpty()) {
                    $context .= 'Categories/Brands found: ' . $taxonomies->pluck('title')->implode(', ') . "\n";
                }
            }
        }

        foreach ($fields as $key => $value) {
            if ($key === 'message') {
                continue;
            }

            $value = $this->normalizeFieldValue($key, $value);

            if (is_array($value)) {
                $value = implode(', ', array_filter(array_map('strval', $value)));
            }

            if (! is_string($value)) {
                $value = (string) $value;
            }

            $prompt = str_replace('{' . $key . '}', $value, $prompt);
        }

        return $prompt . $context;
    }

    protected function normalizeFieldValue(string $key, mixed $value): mixed
    {
        if ($key === 'category') {
            $values = is_string($value) ? json_decode($value, true) : $value;
            $values = array_filter((array) $values);

            if ($values === []) {
                return '';
            }

            return DB::table('taxonomies')
                ->whereIn('id', $values)
                ->pluck('title')
                ->implode(', ');
        }

        if ($key === 'brand') {
            if ($value === null || $value === '') {
                return '';
            }

            $brand = DB::table('taxonomies')->where('id', $value)->first();

            return $brand?->title ?? '';
        }

        if ($key === 'attributes') {
            $values = is_string($value) ? json_decode($value, true) : $value;
            $formatted = '';

            if (is_array($values)) {
                foreach ($values as $group) {
                    $groupName = $group['group'] ?? 'General';
                    $formatted .= $groupName . ":\n";

                    foreach ($group['attributes'] ?? [] as $attr) {
                        $attrKey = $attr['key'] ?? '';
                        $attrValue = $attr['value'] ?? '';

                        if ($attrKey && $attrValue) {
                            $formatted .= "- {$attrKey}: {$attrValue}\n";
                        }
                    }
                }
            }

            return trim($formatted);
        }

        return $value;
    }
}
