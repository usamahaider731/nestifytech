<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserOptionResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'id'    => (string) $this->id,
            'title' => (string) $this->name,
            'name'  => (string) $this->name,
            'value' => (string) $this->id,
        ];
    }
}
