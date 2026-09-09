<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SearchController extends Controller
{
    public function search(Request $request)
    {
        $keyword = $request->get("keyword");
        $staticPages = [];
        if ($request->client == false) {
            // 1. Load Static Pages from JSON
            $jsonPath = storage_path('app/data/search_pages.json');
            $staticPages = \File::exists($jsonPath) ? json_decode(\File::get($jsonPath), true) : [];
        }

        $results = [];

        // Filter static pages if keyword is present
        if ($keyword) {
            foreach ($staticPages as $page) {
                if (stripos($page['title'], $keyword) !== false || stripos($page['category'], $keyword) !== false) {
                    $results[] = [
                        'title' => $page['title'],
                        'route' => $page['route'],
                        'category' => $page['category'],
                        'icon' => $page['icon'],
                        'type' => 'Page'
                    ];
                }
            }

            // 2. Search Products (Title, Description, MetaField in post_meta table for seo_title, seo_description, meta_keywords, meta_title, meta_description)
            $posts = DB::table('posts')
                ->where('type', 'product')
                ->where(function ($query) use ($keyword) {
                    $query->where('title', 'like', '%' . $keyword . '%')
                        ->orWhere('description', 'like', '%' . $keyword . '%')
                        ->orWhereExists(function ($subQuery) use ($keyword) {
                            $subQuery->select(DB::raw(1))
                                ->from('post_meta')
                                ->whereColumn('post_meta.post_id', 'posts.id')
                                ->whereIn('post_meta.key', ['seo_title', 'seo_description', 'seo_keywords'])
                                ->where('post_meta.value', 'like', '%' . $keyword . '%');
                        });
                })
                ->limit(6)
                ->get();
            foreach ($posts as $post) {
                $results[] = [
                    'title' => $post->title,
                    'route' => route('post.edit', ['type' => 'product', 'id' => $post->id]),
                    'category' => 'Products',
                    'icon' => 'RiShoppingBag3Line',
                    'type' => 'Product'
                ];
            }

            // 3. Search Taxonomies (ONLY Categories, Brands, Tags)
            $taxonomies = DB::table('taxonomies')->whereIn('type', ['category', 'brand', 'tag'])
                ->where("title", "like", "%" . $keyword . "%")
                ->limit(8)
                ->get();

            foreach ($taxonomies as $tax) {
                $results[] = [
                    'title' => $tax->title,
                    'route' => route('taxonomy.edit', ['type' => $tax->type, 'id' => $tax->id]),
                    'category' => ucfirst($tax->type) . 's',
                    'icon' => $tax->type === 'category' ? 'RiAppsLine' : ($tax->type === 'brand' ? 'RiPriceTag3Line' : 'RiPriceTag2Line'),
                    'type' => ucfirst($tax->type)
                ];
            }

            // 4. AISearch (Optional: add a special suggestion item or call AI controller)
            // For now, adding a semantic suggestion entry
            if (!$request->client) {
                if (count($results) > 0) {
                    $results[] = [
                        'title' => 'Search "' . $keyword . '" with AI Agent',
                        'route' => '#ai-search',
                        'category' => 'AI Power',
                        'icon' => 'RiAiGenerateText',
                        'type' => 'AI',
                        'is_ai' => true
                    ];
                }

                // 5. Search Users (Optional, keep it small)
                $users = DB::table('users')->where("name", "like", "%" . $keyword . "%")
                    ->limit(3)
                    ->get();
                foreach ($users as $user) {
                    $results[] = [
                        'title' => $user->name,
                        'route' => route('user.edit', ['id' => $user->id, 'type' => 'user']),
                        'category' => 'Users',
                        'icon' => 'FaUser',
                        'type' => 'User'
                    ];
                }
            }
        } else {
            if (!$request->client) {


                // Default results
                foreach ($staticPages as $page) {
                    $results[] = array_merge($page, ['type' => 'Page']);
                }
            }
        }

        return response()->json($results);
    }
}
