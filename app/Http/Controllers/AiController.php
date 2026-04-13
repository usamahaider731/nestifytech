<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\DB;

class AiController extends Controller
{
    public $file;
    public $data;
    public function __construct()
    {
        parent::__construct();
        $this->file = $this->json_file_location . '/setting.json';
        $data = json_decode(file_get_contents($this->file), true);
        $this->data = $data['ai'];
    }
    public function checkField(Request $request)
    {
        $data = $this->data;
        $type = $request->type;
        $id = $request->id;
        if (isset($data['ai_toggle']) && !empty($data['ai_toggle']['value']) && !$data['ai_toggle']['value']) {
            return response()->json([
                'status' => 'error',
                'data' => []
            ]);
        }
        if (!is_null($id)) {
            $post = DB::table('posts')->where('id', $id)->first();
            if ($post) {


            }
        }
        if (isset($data['api_key']) && !empty($data['api_key']['value'])) {
            if (isset($data[$type . '_prompt']) && !empty($data[$type . '_prompt']['value'])) {

                return response()->json([
                    'status' => 'success',
                    'data' => $data[$type . '_prompt']
                ]);
            }
        }

        return response()->json([
            'status' => 'error',
            'data' => []
        ]);


    }




    public function generateText(Request $request)
    {
        $type = $request->type;
        $data = $this->data;

        // 🔹 Validate prompt exists
        if (!isset($data[$type . '_prompt']['value'])) {
            return response()->json([
                'status' => 'error',
                'data' => 'Invalid prompt type',
            ]);
        }

        $prompt = $data[$type . '_prompt']['value'];
        $context = '';

        // 🧠 Smart Chatbot Context: Inject DB information if it's the chatbot
        if ($type === 'chatbot' && isset($request->requiredFieldsValue['message'])) {
            $message = $request->requiredFieldsValue['message'];
            
            // Search for products or categories that might be relevant to the user query
            $products = DB::table('posts')->where('type', 'product')
                ->where('title', 'like', '%' . $message . '%')
                ->limit(3)
                ->get();
            
            $taxonomies = DB::table('taxonomies')->whereIn('type', ['category', 'brand'])
                ->where('title', 'like', '%' . $message . '%')
                ->limit(3)
                ->get();

            if (count($products) > 0 || count($taxonomies) > 0) {
                $context = "\n\nCRITICAL CONTEXT (Current System Data):\n";
                if (count($products) > 0) {
                    $context .= "Products found: " . $products->pluck('title')->implode(', ') . "\n";
                }
                if (count($taxonomies) > 0) {
                    $context .= "Categories/Brands found: " . $taxonomies->pluck('title')->implode(', ') . "\n";
                }
                $context .= "Use this info to guide the user. You can suggest they look at these specifically.";
            }
        }

        // Replace regular placeholders
        foreach ((array) ($request->requiredFieldsValue ?? []) as $key => $value) {
            if ($key == "category") {
                $values = is_string($value) ? json_decode($value, true) : $value;
                $category = DB::table('taxonomies')->whereIn('id', (array)$values)->pluck('title')->toArray();
                $value = implode(',', $category);
            }
            if ($key == "brand") {
                $brand = DB::table('taxonomies')->where('id', $value)->first();
                $value = $brand ? $brand->title : '';
            }
            if ($key == "attributes") {
                $values = is_string($value) ? json_decode($value, true) : $value;
                $formatted = "";
                if (is_array($values)) {
                    foreach ($values as $group) {
                        $gName = $group['group'] ?? 'General';
                        $formatted .= "$gName:\n";
                        foreach ($group['attributes'] ?? [] as $attr) {
                            $k = $attr['key'] ?? '';
                            $v = $attr['value'] ?? '';
                            if ($k && $v) $formatted .= "- $k: $v\n";
                        }
                    }
                }
                $value = $formatted;
            }
            if (!is_array($value)) {
                $prompt = str_replace('{' . $key . '}', $value, $prompt);
            }
        }

        // Final payload logic
        $platform = $data['ai_platform']['value'] ?? null;
        $finalPrompt = $prompt . $context;
        $text = '';

        if ($platform === 'openai') {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $data['api_key']['value'],
                'Content-Type' => 'application/json',
            ])->post('https://api.openai.com/v1/chat/completions', [
                'model' => 'gpt-3.5-turbo',
                'messages' => [
                    ['role' => 'system', 'content' => $finalPrompt],
                    ['role' => 'user', 'content' => $request->requiredFieldsValue['message'] ?? 'Hello'],
                ],
                'temperature' => 0.7,
                'max_tokens' => 500,
            ]);

            $result = $response->json();
            $text = $result['choices'][0]['message']['content'] ?? '';
            
        } elseif ($platform === 'groq') {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $data['api_key']['value'],
                'Content-Type' => 'application/json',
            ])->post('https://api.groq.com/openai/v1/chat/completions', [
                'model' => 'llama-3.1-8b-instant',
                'messages' => [
                    ['role' => 'system', 'content' => $finalPrompt],
                    ['role' => 'user', 'content' => $request->requiredFieldsValue['message'] ?? 'Hello'],
                ],
                'temperature' => 0.7,
                'max_tokens' => 500,
            ]);

            $result = $response->json();
            $text = $result['choices'][0]['message']['content'] ?? '';
            
        } else {
            return response()->json(['status' => 'error', 'data' => 'AI platform not configured']);
        }

        return response()->json([
            'status' => 'success',
            'text' => trim($text),
        ]);
    }
}
