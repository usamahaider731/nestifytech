<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Posts extends Model
{
    use HasFactory;

    protected $table = "posts";
    public $appends = [
        'brand'
    ];

    protected $fillable = [
        'user_id',
        'title',
        'type',
        'description',
        'sku',
        'status',
    ];

    public function meta(): HasMany
    {
        return $this->hasMany(PostMeta::class, 'post_id');
    }

    public function parent()
    {
        $meta = $this->meta;
        $categoryMeta = $meta->firstWhere('key', 'category');

        if (!$categoryMeta) {
            return collect(); // Return empty collection instead of null
        }

        $categories = is_array($categoryMeta->value)
            ? $categoryMeta->value
            : json_decode($categoryMeta->value, true);

        if (empty($categories)) {
            return collect();
        }

        return Taxonomy::whereIn('id', $categories)
            ->where('type', 'category')
            ->with(['image', 'parent'])
            ->get();
    }

    public function getBrandAttribute()
    {
        $meta = $this->meta->firstWhere('key', 'brand');

        if (!$meta || !$meta->value) {
            return null;
        }

        return Taxonomy::where('id', $meta->value)
            ->where('type', 'brand')->with('image')
            ->first();
    }

    // public function brand()
    // {
    //     $meta = $this->meta->firstWhere('key', 'brand');
    //     if (!$meta) {
    //         return null;
    //     }

    //     $brandId = $meta->value;

    //     return Taxonomy::where('id', $brandId)
    //         ->where('type', 'brand')
    //         ->first();
    // }


    public function gallery()
    {
        return $this->hasMany(Media::class, 'parent_id')
            ->where('type', 'post_gallery');
    }
    public function image(): HasOne
    {
        return $this->hasOne(Media::class, 'parent_id')
            ->where('type', 'post');
    }

    public function variations()
    {
        return $this->hasMany(PostVariation::class, 'post_id')
            ->with('variations_value');
    }
}
