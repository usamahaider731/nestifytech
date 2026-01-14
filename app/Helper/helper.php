<?php

use App\Models\Taxonomy;

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
function get_taxonomy($type = null, $key = null, $value = null, $limit = null)
{
    $query = Taxonomy::where('type', $type)->with('allChildren');

    if (!is_null($key) && !is_null($value)) {
        $query->where($key, $value);
    }

    if (!is_null($limit)) {
        if ($limit == 1) {
            return $query->first();
        }
        return $query->limit($limit)->get();
    }

    return $query->get();
}
