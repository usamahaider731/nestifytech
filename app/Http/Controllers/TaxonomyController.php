<?php

namespace App\Http\Controllers;

use App\Http\Resources\TaxonomyResource;
use App\Models\Taxonomy;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Inertia\Inertia;

class TaxonomyController extends Controller
{
    public $types = [];
    public $meta = [];
    function get_field_types($type)
    {
        $out = [];

        $sections = $this->meta[$type];

        foreach ($sections as $section) {
            foreach ($section['fields'] as $field) {
                $out[$field['name']] = $field['type'];
            }
        }
        return $out;
    }
    // app/Http/Controllers/TaxonomyController.php
  public function api_data(Request $request)
{
    $types = $this->get_field_types($request->type);
    $request->merge(['field_types' => $types]);
    $asOptions = $request->boolean('as_options', false);
    $useValue = $request->boolean('use_value', false);
    $notId = $request->get('not_id', false);
    if ($request->id) {
        $ids = explode(',', $request->id);
        $taxonomy = Taxonomy::with($request->hierachy ? ['meta', 'allParent'] : ['meta'])
            ->whereIn('id', $ids)
            ->where('type', $request->type)
            ->first();
        if ($asOptions) {
            return response()->json([
                'id' => $taxonomy->id,
                'title' => $taxonomy->title,
                'value' => $useValue ? ($taxonomy->value ?? $taxonomy->id) : $taxonomy->id
            ]);
        }
        return new TaxonomyResource($taxonomy);
    }
    $query = Taxonomy::with('meta')->where('type', $request->type);
    if ($request->filled('parent') || $request->filled('ghk')) {
        $query->where('parent_id', $request->parent ?? $request->ghk);
    }
if ($asOptions) {
    $results = $query->get()->map(function ($item) use ($useValue) {
        return [
            'id' => $item->id,
            'title' => $item->title,
            'value' => $useValue ? ($item->value ?? $item->id) : $item->id
        ];
    });

    return response()->json($results);
}

    

    return TaxonomyResource::collection($query->get());
}

}
