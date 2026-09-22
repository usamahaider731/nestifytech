<?php

use Illuminate\Support\Facades\DB;

function get_meta($metaCollection, $meta_key)
{
    if (!is_string($meta_key) || $meta_key === '') {
        return null;
    }

    foreach ($metaCollection as $value) {
        if ($value->key === $meta_key) {
            return $value->value;
        }
    }

    return null;
}
function table_exists($table_name)
{
    return \Illuminate\Support\Facades\Schema::hasTable($table_name);
}
function ObjectToArrayOperator($value)
{
    if (is_array($value)) {
        return $value;
    }

    if ($value instanceof \Illuminate\Support\Collection) {
        return $value->toArray();
    }

    if ($value instanceof \Illuminate\Database\Eloquent\Model) {
        return $value->toArray();
    }

    if (is_object($value)) {
        return json_decode(json_encode($value, JSON_INVALID_UTF8_SUBSTITUTE), true);
    }

    return [];
}

function img_svg($filename, $class = '', $thumb = false, $path = 'storage/uploads/image')
{
    if (is_array($filename) || empty($filename)) {
        return '';
    }

    $ext = pathinfo($filename, PATHINFO_EXTENSION);

    // Handle thumbnail path if requested
    if ($thumb) {
        $path .= '/thumb';
    }

    $fullPath = "{$path}/{$filename}";
    $publicPath = public_path($fullPath);
    $urlPath = url($fullPath);

    // If it's an SVG
    if (strtolower($ext) === 'svg') {
        if (file_exists($publicPath)) {
            $svg = file_get_contents($publicPath);

            // Inject class into the SVG tag
            $svg = preg_replace(
                '/<svg\b([^>]*)>/i',
                '<svg$1 class="' . htmlspecialchars($class, ENT_QUOTES) . '">',
                $svg,
                1
            );

            return $svg;
        }
    }
    return '<img class="' . htmlspecialchars($class, ENT_QUOTES) . '" src="' . $urlPath . '" />';
}
function helper_ids($value): array
{
    if ($value === true || $value === false || $value === null || $value === '') {
        return [];
    }

    if (is_string($value) && str_contains($value, ',')) {
        $value = explode(',', $value);
    }

    if (! is_array($value)) {
        $value = [$value];
    }

    return array_values(array_filter($value, fn ($id) => $id !== null && $id !== ''));
}

function apply_post_meta_id_filter($query, string $metaKey, array $ids): void
{
    $query->whereExists(function ($sub) use ($metaKey, $ids) {
        $sub->select(DB::raw(1))
            ->from('post_meta')
            ->whereColumn('post_meta.post_id', 'posts.id')
            ->where('post_meta.key', $metaKey)
            ->where(function ($inner) use ($ids) {
                foreach ($ids as $id) {
                    $inner->orWhere('post_meta.value', 'like', '%"'.$id.'"%')
                        ->orWhere('post_meta.value', (string) $id);
                }
            });
    });
}

function get_taxonomy($type = null, $key = null, $value = null, $limit = null)
{
    $args = is_array($type) ? $type : [
        'type' => $type,
        'limit' => $limit,
    ];

    if (! is_array($type) && ! is_null($key) && ! is_null($value)) {
        $args[$key] = $value;
    }

    $query = \App\Models\PostTaxonomy::query()->where('status', $args['status'] ?? 'publish');

    if (! empty($args['type'])) {
        $query->where('type', $args['type']);
    }
    if (! empty($args['slug'])) {
        $query->where('slug', $args['slug']);
    }
    if (array_key_exists('parent_id', $args) && $args['parent_id'] !== null) {
        $query->where('parent_id', $args['parent_id']);
    }

    $ids = helper_ids($args['id'] ?? ($args['ids'] ?? []));
    if ($ids !== []) {
        $query->whereIn('id', $ids);
    }

    if (! empty($args['keyword'])) {
        $query->where('title', 'like', '%'.$args['keyword'].'%');
    }
    if (! empty($args['limit'])) {
        $query->limit((int) $args['limit']);
    }
    if (! empty($args['image'])) {
        $query->with('image');
    }
    if (! empty($args['meta'])) {
        $query->with('meta');
    }

    if (($args['limit'] ?? null) == 1 || ! empty($args['single'])) {
        $item = $query->first();
        if ($item) {
            $item->children = DB::table('taxonomies')->where('parent_id', $item->id)->get();
            if ($item->relationLoaded('meta')) {
                $item->setRelation('meta', $item->meta->keyBy('key'));
            }
        }

        return $item;
    }

    $items = $query->get();
    foreach ($items as $item) {
        $item->children = DB::table('taxonomies')->where('parent_id', $item->id)->get();
        if ($item->relationLoaded('meta')) {
            $item->setRelation('meta', $item->meta->keyBy('key'));
        }
    }

    return $items;
}

function get_posts(array $args = [])
{
    $posts = \App\Models\PostTaxonomy::forTable('posts')->where('posts.status', $args['status'] ?? 'publish');

    $ids = helper_ids($args['id'] ?? ($args['ids'] ?? []));
    if ($ids !== []) {
        $posts->whereIn('posts.id', $ids);
    }

    $excludeIds = helper_ids($args['exclude_id'] ?? ($args['exclude_ids'] ?? []));
    if ($excludeIds !== []) {
        $posts->whereNotIn('posts.id', $excludeIds);
    }

    if (! empty($args['sku'])) {
        $posts->where('sku', $args['sku']);
    }
    if (! empty($args['slug'])) {
        $posts->where('slug', $args['slug']);
    }
    if (! empty($args['keyword'])) {
        $posts->where('title', 'like', '%'.$args['keyword'].'%');
    }
    if (! empty($args['type'])) {
        $posts->where('type', $args['type']);
    }
    if (!empty($args['popular']) || array_key_exists('views', $args)) {
        $direction = strtolower((string) ($args['views'] ?? 'desc')) === 'asc' ? 'asc' : 'desc';
        
        $posts->leftJoin('post_meta as view', function ($join) {
            $join->on('posts.id', '=', 'view.post_id')
                 ->where('view.key', '=', 'views');
        })
        ->select('posts.*')
        ->orderByRaw('CAST(COALESCE(view.value, 0) AS UNSIGNED) ' . $direction);
    }
    elseif (! empty($args['latest'])) {
        $posts->orderBy('created_at', 'desc');
    }
    if (! empty($args['limit'])) {
        $posts->limit((int) $args['limit']);
    }
    if (! empty($args['image'])) {
        $posts->with('image');
    }
    if (! empty($args['gallery'])) {
        $posts->with('gallery');
    }
    if (! empty($args['parent'])) {
        $posts->with('parent');
    }

    $categoryIds = helper_ids($args['category_id'] ?? ($args['category_ids'] ?? []));
    $brandIds = helper_ids($args['brand_id'] ?? ($args['brand_ids'] ?? []));
    $tagIds = helper_ids($args['tag_id'] ?? ($args['tag_ids'] ?? ($args['tags_id'] ?? [])));

    if ($categoryIds === [] && isset($args['category']) && $args['category'] !== true) {
        $categoryIds = helper_ids($args['category']);
    }
    if ($brandIds === [] && isset($args['brand']) && $args['brand'] !== true) {
        $brandIds = helper_ids($args['brand']);
    }
    if ($tagIds === [] && isset($args['tags']) && $args['tags'] !== true) {
        $tagIds = helper_ids($args['tags']);
    }

    if ($categoryIds !== []) {
        apply_post_meta_id_filter($posts, 'category', $categoryIds);
    }
    if ($brandIds !== []) {
        apply_post_meta_id_filter($posts, 'brand', $brandIds);
    }
    if ($tagIds !== []) {
        apply_post_meta_id_filter($posts, 'tags', $tagIds);
    }

    $attachCategory = ! empty($args['category']) || $categoryIds !== [];
    $attachBrand = ! empty($args['brand']) || $brandIds !== [];
    $attachTags = ! empty($args['tags']) || $tagIds !== [];
    $attachAddress = ! empty($args['address']);

    if (! empty($args['meta']) || $attachCategory || $attachBrand || $attachTags || $attachAddress) {
        $posts->with('meta');
    }

    $result = $posts->get();

    $result->each(function ($item) {
        if ($item->relationLoaded('meta')) {
            $item->setRelation('meta', $item->meta->keyBy('key'));
        }
    });

    if ($attachCategory) {
        $result = \App\Models\PostTaxonomy::get_attribute($result, 'taxonomies', '', 'from_meta', 'category', '');
    }
    if ($attachBrand) {
        $result = \App\Models\PostTaxonomy::get_attribute($result, 'taxonomies', '', 'from_meta', 'brand', '');
    }
    if ($attachTags) {
        $result = \App\Models\PostTaxonomy::get_attribute($result, 'taxonomies', '', 'from_meta', 'tags', '');
    }
    if ($attachAddress) {
        $result = \App\Models\PostTaxonomy::get_attribute($result, 'taxonomies', '', 'from_meta', ['state', 'city'], '');
    }

    if (! empty($args['attributes']) && $result->isNotEmpty()) {
        $postIds = $result->pluck('id');
        $attrValues = DB::table('attribute_values')
            ->whereIn('parent_id', $postIds)
            ->where('parent_type', 'post')
            ->get()
            ->groupBy('parent_id');
        $definitions = DB::table('attributes')
            ->whereIn('id', $attrValues->flatten()->pluck('attribute_id')->unique()->filter())
            ->get()
            ->keyBy('id');

        $result->each(function ($item) use ($attrValues, $definitions) {
            $item->attributes = collect($attrValues[$item->id] ?? [])->map(function ($val) use ($definitions) {
                $def = $definitions[$val->attribute_id] ?? null;
                if (! $def || $def->group === null) {
                    return null;
                }

                return [
                    'group' => $val->group ?? $def->group,
                    'key' => $def->name,
                    'value' => $val->value,
                ];
            })->filter()->values()->all();
        });
    }

    if (! empty($args['single'])) {
        return $result->first();
    }

    return $result;
}
