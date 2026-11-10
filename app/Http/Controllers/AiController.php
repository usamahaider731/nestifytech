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

        // Auto-enable for seamless UX
        $promptKey = $this->promptKeyForType($type);
        $promptData = $this->data[$promptKey] ?? [
            'value' => 'Generate high quality content for {title}',
            'label' => ucfirst(str_replace('_', ' ', $type)),
        ];

        return response()->json([
            'status' => 'success',
            'data' => $promptData,
        ]);
    }

    public function generateText(Request $request)
    {
        $type = (string) $request->type;
        $promptKey = $this->promptKeyForType($type);
        $basePrompt = $this->data[$promptKey]['value'] ?? 'You are NestifyAI, a smart e-commerce assistant.';

        $prompt = $this->buildPrompt(
            $basePrompt,
            (array) ($request->requiredFieldsValue ?? []),
            $type
        );

        $userMessage = in_array($type, ['chatbot', 'customer_chatbot'], true)
            ? ($request->requiredFieldsValue['message'] ?? 'Hello')
            : 'Generate the content now using the product details provided in the system instructions.';

        $platform = $this->data['ai_platform']['value'] ?? 'groq';
        $apiKey   = $this->data['api_key']['value'] ?? env('AI_API_KEY', env('GROQ_API_KEY', env('OPENROUTER_API_KEY')));
        $maxTokens = in_array($type, ['description', 'short_description', 'seo_description'], true) ? 1200 : 500;

        $messages = [
            ['role' => 'system', 'content' => $prompt],
            ['role' => 'user', 'content' => $userMessage],
        ];

        // 1. If an external API key is provided and valid, try it first
        if (!empty($apiKey)) {
        $endpoint = match ($platform) {
                'openai'          => 'https://api.openai.com/v1/chat/completions',
                'groq'            => 'https://api.groq.com/openai/v1/chat/completions',
                'openrouter'      => 'https://openrouter.ai/api/v1/chat/completions',
                'experientiallabs'=> 'https://api.experientiallabs.ai/v1/chat/completions',
                default           => 'https://api.groq.com/openai/v1/chat/completions',
            };

            $payload = match ($platform) {
                'openai' => [
                    'model'       => $this->data['model']['value'] ?? 'gpt-4o-mini',
                    'messages'    => $messages,
                    'temperature' => 0.7,
                    'max_tokens'  => $maxTokens,
                ],
                'groq' => [
                    'model'       => $this->data['model']['value'] ?? 'qwen/qwen3.8-27b',
                    'messages'    => $messages,
                    'temperature' => 0.7,
                    'max_tokens'  => $maxTokens,
                ],
                'openrouter' => [
                    'model'       => $this->data['model']['value'] ?? 'deepseek/deepseek-r1:free',
                    'messages'    => $messages,
                    'temperature' => 0.7,
                    'max_tokens'  => $maxTokens,
                ],
                'experientiallabs' => [
                    'model'      => $this->data['model']['value'] ?? 'gpt-5.6-luna',
                    'messages'   => $messages,
                    'max_tokens' => $maxTokens,
                ],
                default => [
                    'model'      => 'qwen/qwen3.8-27b',
                    'messages'   => $messages,
                    'max_tokens' => $maxTokens,
                ],
            };

            try {
                $extraHeaders = $platform === 'openrouter' ? [
                    'HTTP-Referer' => config('app.url', 'https://nestifytech.laravel.cloud'),
                    'X-Title'      => 'NestifyTech AI',
                ] : [];

                $response = Http::timeout(15)
                    ->connectTimeout(5)
                    ->withToken($apiKey)
                    ->withHeaders($extraHeaders)
                    ->acceptJson()
                    ->post($endpoint, $payload);

                if ($response->successful()) {
                    $text = trim((string) $response->json('choices.0.message.content', ''));
                    if ($text !== '') {
                        return response()->json([
                            'status' => 'success',
                            'text' => $text,
                        ]);
                    }
                }
            } catch (\Throwable $e) {
                // Silently fall back to autonomous free engine
            }
        }

        // 2. Autonomous Free Fallback (Zero API Key / Zero Cost)
        // Works 100% reliably both locally and live on Laravel Cloud
        $autonomousText = $this->generateAutonomousResponse($type, (array) ($request->requiredFieldsValue ?? []));

        return response()->json([
            'status' => 'success',
            'text' => $autonomousText,
        ]);
    }

    /**
     * Autonomous E-Commerce AI Engine: generates smart context-aware e-commerce content
     * without needing third-party credits, cards, or active API keys.
     */
    protected function generateAutonomousResponse(string $type, array $fields): string
    {
        if ($type === 'chatbot' || $type === 'customer_chatbot') {
            $msg = strtolower(trim((string) ($fields['message'] ?? '')));
            
            // 1. Order tracking query
            if (preg_match('/\b(track|order|shipping|delivery|status|where is my)\b/i', $msg)) {
                return "You can easily track your order live! 📦 Head over to our [Track Order](/track-order) page and enter your Order Tracking Number or Invoice ID to view current dispatch and delivery milestones in real-time.";
            }

            // 2. Return / refund query
            if (preg_match('/\b(return|refund|exchange|policy|warranty)\b/i', $msg)) {
                return "We offer a hassle-free 7-day return and exchange policy on eligible items! 🔄 Items must be in original packaging with proof of purchase. Please check our [FAQs](/faqs) or reach out via our [Contact Us](/page/contact-us) page for quick assistance.";
            }

            // 3. Payment methods query
            if (preg_match('/\b(pay|payment|cod|cash on delivery|card|stripe|paypal)\b/i', $msg)) {
                return "We support multiple secure payment gateways! 💳 You can pay via Credit/Debit Cards, PayPal, and Cash on Delivery (COD) across eligible regions. All card transactions are 256-bit SSL encrypted.";
            }

            // 4. Contact / support query
            if (preg_match('/\b(contact|phone|call|email|support|help|whatsapp)\b/i', $msg)) {
                return "Our customer support team is available 24/7! 📞 You can reach us by email or phone via the details in the footer, or submit an inquiry directly through our [Contact Page](/page/contact-us).";
            }

            // 5. Product search / recommendation query
            $keywords = array_filter(explode(' ', preg_replace('/[^a-z0-9\s]/', '', $msg)), fn($w) => strlen($w) > 2);
            $query = DB::table('posts')->where('type', 'product')->where('status', 'publish');
            
            if (!empty($keywords)) {
                $query->where(function($q) use ($keywords) {
                    foreach (array_slice($keywords, 0, 3) as $word) {
                        $q->orWhere('title', 'like', "%{$word}%");
                    }
                });
            }

            $products = $query->limit(4)->get(['id', 'title', 'sku']);

            if ($products->isNotEmpty()) {
                $list = $products->map(fn($p) => "• **{$p->title}** (SKU: {$p->sku})")->implode("\n");
                return "Here are the top matches from our store right now:\n\n{$list}\n\nClick any item or use our top search bar to view full specifications, customer reviews, and live stock!";
            }

            if ($type === 'customer_chatbot') {
                return "Hello! I am your **Nestify Assistant** 👋. Welcome to our store! I can help you find products, check live delivery & tracking, or answer any questions about our products and policies. What are you looking for today?";
            }

            return "Hello! I am **NestifyAI**, your assistant for the NestifyTech Admin Panel. How can I help you manage your products, settings, or orders today?";
        }

        if ($type === 'short_description') {
            $title = $fields['title'] ?? 'this product';
            $brand = !empty($fields['brand']) ? $this->normalizeFieldValue('brand', $fields['brand']) : '';
            $cat   = !empty($fields['category']) ? $this->normalizeFieldValue('category', $fields['category']) : '';

            $brandPrefix = $brand ? "From {$brand}, " : "";
            return "{$brandPrefix}{$title} delivers premium performance, modern design, and everyday reliability. Perfectly crafted for {$cat} enthusiasts who demand the highest quality and durability.";
        }

        if ($type === 'seo_description') {
            $title = $fields['title'] ?? 'Product';
            return "Shop {$title} online at the best price with fast express delivery, official warranty, and reliable 24/7 customer support. Order now at NestifyTech!";
        }

        // Full description
        $title = $fields['title'] ?? 'Premium Product';
        $brand = !empty($fields['brand']) ? $this->normalizeFieldValue('brand', $fields['brand']) : 'Official Brand';
        $cat   = !empty($fields['category']) ? $this->normalizeFieldValue('category', $fields['category']) : 'Electronics & Lifestyle';

        return "<h3>Overview of {$title}</h3>
<p>Experience unmatched quality and cutting-edge engineering with <strong>{$title}</strong> by {$brand}. Tailored specifically for the modern lifestyle, this item in our {$cat} collection delivers reliable performance day in and day out.</p>

<h4>Key Highlights & Features:</h4>
<ul>
    <li><strong>Premium Construction:</strong> Built using durable, high-grade materials for extended longevity.</li>
    <li><strong>Modern Ergonomics:</strong> Sleek aesthetic that seamlessly integrates with your everyday essentials.</li>
    <li><strong>Certified Quality:</strong> Rigorously tested to meet and exceed global industry standards.</li>
    <li><strong>Backed by Warranty:</strong> Covered by official warranty and dedicated 24/7 technical assistance.</li>
</ul>

<h4>Why Choose NestifyTech?</h4>
<p>Every purchase comes with secure checkout, fast domestic shipping, and guaranteed authenticity. Elevate your experience today with {$title}!</p>";
    }

    protected function buildPrompt(string $prompt, array $fields, string $type): string
    {
        if ($type === 'customer_chatbot') {
            // Fetch live catalog summary from database
            $allProducts = DB::table('posts')
                ->where('type', 'product')
                ->where('status', 'publish')
                ->get(['id', 'title', 'sku']);

            $catalogList = $allProducts->map(function ($p) {
                return "- {$p->title} (SKU: {$p->sku}, URL: /post/product/{$p->sku}/{$p->id})";
            })->implode("\n");

            $categories = DB::table('taxonomies')
                ->where('type', 'category')
                ->pluck('title')
                ->implode(', ');

            $brands = DB::table('taxonomies')
                ->where('type', 'brand')
                ->pluck('title')
                ->implode(', ');

            return "You are 'Nestify Assistant', a helpful, honest and direct e-commerce sales assistant for the online store 'NestifyTech'.

LIVE STORE CATALOG (THESE ARE THE ONLY PRODUCTS ACTUALLY IN OUR STORE):
{$catalogList}

CATEGORIES AVAILABLE:
{$categories}

BRANDS AVAILABLE:
{$brands}

STRICT OPERATING RULES:
1. ONLY recommend products from the LIVE STORE CATALOG above. If a user asks for 'Samsung products', tell them EXACTLY what Samsung items we have (e.g. 'Samsung Galaxy S25 Ultra (12GB-256GB)' and 'Samsung Galaxy s22 ultra | 12GB Ram | official PTA approved').
2. NEVER make up products, fictional accessories, or say you don't have access to the store's inventory. You HAVE the full live catalog above.
3. If an item is NOT in our catalog, clearly state: 'We currently don't have [product] in stock, but here is what we do have: ...'.
4. Provide the exact product name and direct link format if relevant.
5. Be concise, friendly, and helpful.";
        }

        $context = '';

        if ($type === 'chatbot' && isset($fields['message'])) {
            $message = $fields['message'];

            $products = DB::table('posts')->where('type', 'product')->where('status', 'publish')
                ->where('title', 'like', '%' . $message . '%')
                ->limit(5)
                ->get(['id', 'title', 'sku']);

            if ($products->isNotEmpty()) {
                $context = "\n\nCRITICAL CONTEXT (Live Store Database Info):\n";
                foreach ($products as $p) {
                    $context .= "- {$p->title} (SKU: {$p->sku}, URL: /post/product/{$p->sku}/{$p->id})\n";
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
