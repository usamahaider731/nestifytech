<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TaxonomyResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    // app/Http/Resources/TaxonomyResource.php
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'value' => $this->value ?? $this->id, // Add this line
            'parent_id' => $this->parent_id,
            'description' => $this->description,
            'type' => $this->type,
            'all_parent' => $this->allParent,
            'meta' => $this->meta,
            'status' => $this->status,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
