<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class BlogSeeder extends Seeder
{
    public function run(): void
    {
        $userId = DB::table('users')->value('id') ?? 1;

        $categories = [
            ['title' => 'Tech Trends', 'slug' => 'tech-trends', 'description' => 'The latest trends shaping consumer technology.'],
            ['title' => 'Product Reviews', 'slug' => 'product-reviews', 'description' => 'In-depth reviews and benchmarks of modern gadgets.'],
            ['title' => 'Buying Guides', 'slug' => 'buying-guides', 'description' => 'Comprehensive buyer guides to help you make informed choices.'],
            ['title' => 'Smart Home', 'slug' => 'smart-home', 'description' => 'Automation, smart devices, and connected lifestyle tips.'],
        ];

        $catIdMap = [];
        foreach ($categories as $cat) {
            $existing = DB::table('taxonomies')->where(['type' => 'blog_category', 'slug' => $cat['slug']])->first();
            if ($existing) {
                $catIdMap[$cat['slug']] = $existing->id;
            } else {
                $id = DB::table('taxonomies')->insertGetId([
                    'title' => $cat['title'],
                    'slug' => $cat['slug'],
                    'description' => $cat['description'],
                    'type' => 'blog_category',
                    'status' => 'publish',
                    'parent_id' => 0,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $catIdMap[$cat['slug']] = $id;
            }
        }

        $blogs = [
            [
                'title' => 'Top 10 Flagship Smartphones to Watch in 2026',
                'sku' => 'top-10-flagship-smartphones-2026',
                'short_description' => 'Explore the game-changing smartphones pushing boundaries in battery life, display technology, and AI processing power.',
                'description' => '<p>The smartphone landscape has accelerated into an era of on-device neural processing, generative AI photography, and ultra-durable titanium architecture. In this comprehensive review, we look at the top 10 devices redefining what pocket computers can accomplish.</p><h2>1. On-Device Intelligence</h2><p>Rather than offloading every prompt to cloud data centers, flagship processors now run multi-billion-parameter language models natively. Voice assistants transcribe meetings instantaneously, translations happen offline, and photos are cleaned up in milliseconds.</p><h2>2. Next-Generation Display & Battery Efficiency</h2><p>With silicon-carbon battery cells entering mainstream production, thinner devices now pack 5,500mAh to 6,000mAh capacities without added bulk, easily delivering two full days of high-refresh usage.</p>',
                'category_slug' => 'tech-trends',
                'tags' => ['smartphones', 'ai', 'tech2026'],
                'image' => 'mobiles.webp',
            ],
            [
                'title' => 'Ultrabooks vs Gaming Laptops: Finding Your Perfect Balance',
                'sku' => 'ultrabooks-vs-gaming-laptops-guide',
                'short_description' => 'Need power for creative work and portability for travel? Here is how to choose between modern thin-and-lights and dedicated gaming rigs.',
                'description' => '<p>Modern computing hardware has narrowed the divide between extreme performance and featherweight form factors. However, thermal physics and battery chemistry still mean tradeoffs must be considered.</p><h2>Portability and All-Day Stamina</h2><p>For students, remote developers, and corporate travelers, high-density batteries combined with efficient ARM and modern x86 chips provide 15+ hours of real-world productivity without hunting for an outlet.</p><h2>Thermal Headroom for Creative Workloads</h2><p>When rendering 8K video, compiling massive codebases, or gaming at ultra settings, vapor chambers and dual-fan systems are indispensable.</p>',
                'category_slug' => 'buying-guides',
                'tags' => ['laptops', 'ultrabook', 'buying-guide'],
                'image' => 'Ultrabooks-300x300.webp',
            ],
            [
                'title' => 'How Spatial Audio and Lossless Codecs Transform Everyday Listening',
                'sku' => 'spatial-audio-lossless-codecs-guide',
                'short_description' => 'High-resolution wireless audio is finally practical. Discover the codecs, hardware drivers, and tuning that make a difference.',
                'description' => '<p>Audiophiles once dismissed wireless audio due to heavy compression and bandwidth constraints. Today, advanced Bluetooth codecs and low-latency planar drivers bring studio-grade sound directly to your daily commute.</p><h2>Understanding Bitrates and Dynamic Range</h2><p>Lossless transmission ensures subtle acoustic instruments and ambient reverbs are faithfully reproduced without digital artifacts or clipping.</p>',
                'category_slug' => 'product-reviews',
                'tags' => ['audio', 'earbuds', 'reviews'],
                'image' => 'headphonecase-300x300.webp',
            ],
            [
                'title' => 'Building an Intuitive Smart Home: Where to Begin',
                'sku' => 'building-intuitive-smart-home-guide',
                'short_description' => 'Simplify your living space with unified Matter protocols, automated lighting routines, and smart climate controls.',
                'description' => '<p>Smart homes used to mean juggling five different apps and hoping cross-brand integrations did not break after an update. With the widespread adoption of universal smart home standards, creating an effortless connected home is now accessible to everyone.</p><h2>Start with Smart Lighting and Power</h2><p>Automated dimming routines aligned with your circadian rhythm enhance sleep quality while smart plugs help eliminate phantom energy consumption.</p>',
                'category_slug' => 'smart-home',
                'tags' => ['smarthome', 'automation', 'lifestyle'],
                'image' => 'cat-22-300x300.webp',
            ],
        ];

        foreach ($blogs as $b) {
            $postId = DB::table('posts')->where(['type' => 'blog', 'sku' => $b['sku']])->value('id');

            if (!$postId) {
                $postId = DB::table('posts')->insertGetId([
                    'user_id' => $userId,
                    'title' => $b['title'],
                    'sku' => $b['sku'],
                    'description' => $b['description'],
                    'status' => 'publish',
                    'type' => 'blog',
                    'created_at' => now()->subDays(rand(1, 14)),
                    'updated_at' => now(),
                ]);
            }

            $catId = $catIdMap[$b['category_slug']] ?? null;

            DB::table('post_meta')->where('post_id', $postId)->delete();
            DB::table('post_meta')->insert([
                ['post_id' => $postId, 'key' => 'short_description', 'value' => $b['short_description']],
                ['post_id' => $postId, 'key' => 'blog_category', 'value' => (string) $catId],
                ['post_id' => $postId, 'key' => 'category', 'value' => json_encode([$catId])],
                ['post_id' => $postId, 'key' => 'tags', 'value' => json_encode($b['tags'])],
                ['post_id' => $postId, 'key' => 'image', 'value' => $b['image']],
                ['post_id' => $postId, 'key' => 'seo_title', 'value' => $b['title'] . ' | NestifyTech Blog'],
                ['post_id' => $postId, 'key' => 'seo_description', 'value' => $b['short_description']],
            ]);

            DB::table('media')->where(['parent_id' => $postId, 'type' => 'post'])->delete();
            DB::table('media')->insert([
                'parent_id' => $postId,
                'type' => 'post',
                'filename' => $b['image'],
                'name' => basename($b['image']),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $this->command->info('Blog posts and categories seeded successfully.');
    }
}
