<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Schema;

/**
 * Imports catalog data from storage/app/import/*.json (taxonomies + products + meta + attributes + variations).
 */
class CatalogJsonImporter
{
    protected string $basePath;

    /** @var array<string, int> slug => id per type */
    protected array $taxonomyIds = [];

    public function __construct(?string $basePath = null)
    {
        $this->basePath = $basePath ?? storage_path('app/import');
    }

    public function setBasePath(string $path): self
    {
        $this->basePath = $path;
        return $this;
    }

    public function importAll(int $userId, bool $skipExistingProducts = true): array
    {
        $stats = ['taxonomies' => 0, 'products' => 0, 'skipped_products' => 0, 'errors' => []];

        if (!Schema::hasTable('taxonomies') || !Schema::hasTable('posts')) {
            $stats['errors'][] = 'Missing required tables (taxonomies or posts).';
            return $stats;
        }

        $manifest = $this->readJson('manifest.json');
        if (!$manifest) {
            $stats['errors'][] = 'manifest.json not found. Run: php artisan catalog:import --init-files';
            return $stats;
        }

        DB::beginTransaction();
        try {
            foreach (DB::table('taxonomies')->get(['id', 'type', 'slug']) as $t) {
                if (!empty($t->slug) && !empty($t->type)) {
                    $this->taxonomyIds[$t->type . ':' . $t->slug] = (int) $t->id;
                }
            }

            foreach (['categories', 'brands', 'tags'] as $key) {
                $file = $manifest[$key] ?? null;
                if (!$file) {
                    continue;
                }
                $rows = $this->readJson($file);
                if (!is_array($rows)) {
                    continue;
                }
                $type = match ($key) {
                    'categories' => 'category',
                    'brands' => 'brand',
                    'tags' => 'tag',
                    default => 'category',
                };
                $stats['taxonomies'] += $this->importTaxonomyList($rows, $type);
            }

            $productFile = $manifest['products'] ?? 'products.json';
            $payload = $this->readJson($productFile);
            $products = $payload['products'] ?? $payload;
            if (!is_array($products)) {
                $stats['errors'][] = "Invalid products file: {$productFile}";
                DB::rollBack();
                return $stats;
            }

            foreach ($products as $p) {
                $sku = $p['sku'] ?? null;
                if (!$sku) {
                    continue;
                }
                $exists = DB::table('posts')->where('sku', $sku)->exists();
                if ($exists && $skipExistingProducts) {
                    $stats['skipped_products']++;
                    continue;
                }
                if ($exists && !$skipExistingProducts) {
                    $old = DB::table('posts')->where('sku', $sku)->first();
                    if ($old) {
                        $this->deleteProductCascade((int) $old->id);
                    }
                }
                $this->importProduct($p, $userId);
                $stats['products']++;
            }

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            $stats['errors'][] = $e->getMessage();
        }

        return $stats;
    }

    protected function readJson(string $relative): ?array
    {
        $path = $this->basePath . DIRECTORY_SEPARATOR . ltrim($relative, '/\\');
        if (!is_file($path)) {
            return null;
        }
        $data = json_decode(file_get_contents($path), true);
        return is_array($data) ? $data : null;
    }

    /**
     * @param list<array<string, mixed>> $rows
     */
    protected function importTaxonomyList(array $rows, string $type): int
    {
        $count = 0;
        // Pass 1: parents (no parent_slug)
        foreach ($rows as $row) {
            if (!empty($row['parent_slug'])) {
                continue;
            }
            $id = $this->upsertTaxonomy($row, $type, 0);
            if ($id) {
                $count++;
            }
        }
        // Pass 2: children
        $maxPasses = 10;
        for ($pass = 0; $pass < $maxPasses; $pass++) {
            $progress = 0;
            foreach ($rows as $row) {
                if (empty($row['parent_slug'])) {
                    continue;
                }
                $parentKey = $type . ':' . $row['parent_slug'];
                if (!isset($this->taxonomyIds[$parentKey])) {
                    continue;
                }
                $slug = $row['slug'] ?? Str::slug($row['title'] ?? 'item');
                $selfKey = $type . ':' . $slug;
                if (isset($this->taxonomyIds[$selfKey])) {
                    continue;
                }
                $id = $this->upsertTaxonomy($row, $type, (int) $this->taxonomyIds[$parentKey]);
                if ($id) {
                    $progress++;
                    $count++;
                }
            }
            if ($progress === 0) {
                break;
            }
        }

        return $count;
    }

    protected function upsertTaxonomy(array $row, string $type, int $parentId): ?int
    {
        $title = $row['title'] ?? '';
        if ($title === '') {
            return null;
        }
        $slug = $row['slug'] ?? Str::slug($title);
        $existing = DB::table('taxonomies')->where('type', $type)->where('slug', $slug)->first();
        if ($existing) {
            $id = (int) $existing->id;
        } else {
            $insert = [
                'title' => $title,
                'slug' => $slug,
                'description' => $row['description'] ?? null,
                'parent_id' => $parentId,
                'type' => $type,
                'status' => $row['status'] ?? 'publish',
            ];
            if (Schema::hasColumn('taxonomies', 'created_at')) {
                $insert['created_at'] = now();
                $insert['updated_at'] = now();
            }
            $id = DB::table('taxonomies')->insertGetId($insert);
        }

        if (!empty($row['image'])) {
            $this->setMedia($id, 'taxonomy', $row['image']);
        }

        $this->taxonomyIds[$type . ':' . $slug] = $id;
        return $id;
    }

    protected function setMedia(int $parentId, string $type, string $filename): void
    {
        if (!Schema::hasTable('media')) {
            return;
        }

        DB::table('media')->updateOrInsert(
            ['parent_id' => $parentId, 'type' => $type],
            [
                'filename' => $filename,
                'name' => basename($filename),
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );
    }

    protected function addMediaGallery(int $parentId, string $type, array $gallery): void
    {
        if (!Schema::hasTable('media')) {
            return;
        }

        // Clear old gallery for this type
        DB::table('media')->where(['parent_id' => $parentId, 'type' => $type . '_gallery'])->delete();

        foreach ($gallery as $filename) {
            DB::table('media')->insert([
                'parent_id' => $parentId,
                'type' => $type . '_gallery',
                'filename' => $filename,
                'name' => basename($filename),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    protected function setTaxonomyMeta(int $taxonomyId, string $key, string $value): void
    {
        if (!Schema::hasTable('taxonomy_meta')) {
            return;
        }
        DB::table('taxonomy_meta')->updateOrInsert(
            ['taxonomy_id' => $taxonomyId, 'key' => $key],
            ['value' => $value]
        );
    }

    protected function resolveTaxonomyId(string $type, string $slug): ?int
    {
        $key = $type . ':' . $slug;
        if (isset($this->taxonomyIds[$key])) {
            return $this->taxonomyIds[$key];
        }
        $row = DB::table('taxonomies')->where('type', $type)->where('slug', $slug)->first();
        if ($row) {
            $this->taxonomyIds[$key] = (int) $row->id;
            return (int) $row->id;
        }
        return null;
    }

    /**
     * @param array<string, mixed> $p
     */
    protected function importProduct(array $p, int $userId): void
    {
        $sku = $p['sku'];
        $title = $p['title'] ?? $sku;
        $description = $p['description'] ?? '';
        $status = $p['status'] ?? 'publish';

        $postRow = [
            'user_id' => $userId,
            'title' => $title,
            'sku' => $sku,
            'description' => $description,
            'status' => $status,
            'type' => 'product',
        ];
        if (Schema::hasColumn('posts', 'created_at')) {
            $postRow['created_at'] = now();
            $postRow['updated_at'] = now();
        }
        $postId = DB::table('posts')->insertGetId($postRow);

        $categorySlugs = $p['categories'] ?? $p['category_slugs'] ?? [];
        if (is_string($categorySlugs)) {
            $categorySlugs = array_filter(array_map('trim', explode(',', $categorySlugs)));
        }
        $catIds = [];
        foreach ((array) $categorySlugs as $slug) {
            $tid = $this->resolveTaxonomyId('category', $slug);
            if ($tid) {
                $catIds[] = $tid;
            }
        }
        $this->setPostMeta($postId, 'category', json_encode(array_values(array_unique($catIds))));

        $brandSlug = $p['brand'] ?? $p['brand_slug'] ?? null;
        if ($brandSlug) {
            $bid = $this->resolveTaxonomyId('brand', $brandSlug);
            if ($bid) {
                $this->setPostMeta($postId, 'brand', (string) $bid);
            }
        }

        if (!empty($p['image'])) {
            $this->setMedia($postId, 'post', $p['image']);
        }
        if (!empty($p['gallery'])) {
            $this->addMediaGallery($postId, 'post', (array) $p['gallery']);
        }

        $tagSlugs = $p['tags'] ?? $p['tag_slugs'] ?? [];
        if (is_string($tagSlugs)) {
            $tagSlugs = array_filter(array_map('trim', explode(',', $tagSlugs)));
        }
        $tagIds = [];
        foreach ((array) $tagSlugs as $slug) {
            $tid = $this->resolveTaxonomyId('tag', $slug);
            if ($tid) {
                $tagIds[] = $tid;
            }
        }
        if (!empty($tagIds)) {
            $this->setPostMeta($postId, 'tags', json_encode(array_values(array_unique($tagIds))));
        }

        $meta = $p['meta'] ?? [];
        if (is_array($meta)) {
            foreach ($meta as $k => $v) {
                if (in_array($k, ['category', 'brand', 'tags'], true)) {
                    continue;
                }
                $this->setPostMeta($postId, (string) $k, is_array($v) ? json_encode($v) : (string) $v);
            }
        }

        $attributes = $p['attributes'] ?? [];
        if (is_array($attributes) && Schema::hasTable('attribute_values')) {
            $flat = $this->normalizeAttributesPayload($attributes);
            foreach ($flat as $attr) {
                if (empty($attr['key'])) {
                    continue;
                }
                $group = $attr['group'] ?? null;
                $attrDef = DB::table('attributes')->where('name', $attr['key'])->first();
                if (!$attrDef) {
                    $insert = ['name' => $attr['key'], 'type' => 'text', 'created_at' => now(), 'updated_at' => now()];
                    if (Schema::hasColumn('attributes', 'group') && $group) {
                        $insert['group'] = $group;
                    }
                    $aid = DB::table('attributes')->insertGetId($insert);
                } else {
                    $aid = $attrDef->id;
                    if ($group && Schema::hasColumn('attributes', 'group') && empty($attrDef->group)) {
                        DB::table('attributes')->where('id', $aid)->update(['group' => $group]);
                    }
                }
                $insertVal = [
                    'attribute_id' => $aid,
                    'parent_id' => $postId,
                    'parent_type' => 'post',
                    'value' => (string) ($attr['value'] ?? ''),
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
                if (Schema::hasColumn('attribute_values', 'group')) {
                    $insertVal['group'] = $group;
                }
                DB::table('attribute_values')->insert($insertVal);
            }
        }

        $variations = $p['variations'] ?? [];
        if (is_array($variations) && Schema::hasTable('post_variations')) {
            foreach ($variations as $variation) {
                $this->importVariation($postId, $variation);
            }
        }
    }

    /**
     * @param list<array<string, mixed>>|array<int, mixed> $attributes
     * @return list<array{group:?string,key:string,value:mixed}>
     */
    protected function normalizeAttributesPayload(array $attributes): array
    {
        if (!isset($attributes[0])) {
            return [];
        }
        if (isset($attributes[0]['attributes']) && is_array($attributes[0]['attributes'])) {
            $flat = [];
            foreach ($attributes as $g) {
                $gName = $g['group'] ?? null;
                foreach (($g['attributes'] ?? []) as $a) {
                    $flat[] = [
                        'group' => $gName,
                        'key' => $a['key'] ?? '',
                        'value' => $a['value'] ?? '',
                    ];
                }
            }
            return $flat;
        }
        $out = [];
        foreach ($attributes as $a) {
            if (!is_array($a)) {
                continue;
            }
            $out[] = [
                'group' => $a['group'] ?? null,
                'key' => $a['key'] ?? '',
                'value' => $a['value'] ?? '',
            ];
        }
        return $out;
    }

    /**
     * @param array<string, mixed> $variation
     */
    protected function importVariation(int $postId, array $variation): void
    {
        $vAttrs = $variation['size'] ?? $variation['options'] ?? [];
        if (is_string($vAttrs)) {
            $decoded = json_decode($vAttrs, true);
            $vAttrs = is_array($decoded) ? $decoded : [];
        }

        $vId = DB::table('post_variations')->insertGetId([
            'post_id' => $postId,
            'price' => (int) ($variation['price'] ?? 0),
            'stock' => (int) ($variation['stock'] ?? 0),
        ]);

        if (!empty($variation['image'])) {
            $this->setMedia($vId, 'post_variation', $variation['image']);
        }

        foreach ((array) $vAttrs as $vAttr) {
            if (empty($vAttr['key'])) {
                continue;
            }
            $attrDef = DB::table('attributes')->where('name', $vAttr['key'])->first();
            if (!$attrDef) {
                $attrDefId = DB::table('attributes')->insertGetId([
                    'name' => $vAttr['key'],
                    'type' => 'text',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $attrDef = (object) ['id' => $attrDefId];
            }
            $optionId = DB::table('attribute_values')->insertGetId([
                'attribute_id' => $attrDef->id,
                'parent_id' => $postId,
                'parent_type' => 'variation_option',
                'value' => (string) ($vAttr['value'] ?? ''),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            if (Schema::hasTable('product_variation_values')) {
                DB::table('product_variation_values')->insert([
                    'variation_id' => $vId,
                    'attribute_option_id' => $optionId,
                ]);
            }
        }
    }

    protected function setPostMeta(int $postId, string $key, string $value): void
    {
        if (!Schema::hasTable('post_meta')) {
            return;
        }
        DB::table('post_meta')->updateOrInsert(
            ['post_id' => $postId, 'key' => $key],
            ['value' => $value]
        );
    }

    protected function deleteProductCascade(int $postId): void
    {
        if (Schema::hasTable('post_meta')) {
            DB::table('post_meta')->where('post_id', $postId)->delete();
        }
        if (Schema::hasTable('attribute_values')) {
            DB::table('attribute_values')->where('parent_id', $postId)->whereIn('parent_type', ['post', 'variation_option'])->delete();
        }
        if (Schema::hasTable('post_variations')) {
            $vIds = DB::table('post_variations')->where('post_id', $postId)->pluck('id');
            if ($vIds->isNotEmpty() && Schema::hasTable('product_variation_values')) {
                DB::table('product_variation_values')->whereIn('variation_id', $vIds)->delete();
            }
            if ($vIds->isNotEmpty() && Schema::hasTable('media')) {
                DB::table('media')->whereIn('parent_id', $vIds)->where('type', 'post_variation')->delete();
            }
            DB::table('post_variations')->where('post_id', $postId)->delete();
        }
        if (Schema::hasTable('media')) {
            DB::table('media')->where('parent_id', $postId)->whereIn('type', ['post', 'post_gallery'])->delete();
        }
        DB::table('posts')->where('id', $postId)->delete();
    }
}
