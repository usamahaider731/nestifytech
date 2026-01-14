<?php

namespace App\Models;

use App\Models\TaxonomyMeta;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Taxonomy extends Model
{
    use HasFactory;

    protected $table = 'taxonomies';

    protected $fillable = [
        'title',
        'parent_id',
        'slug',
        'description',
        'type',
        'status'
    ];
    // protected $appends = ['children'];

    protected $casts = [
        'hierarchy' => 'array',
        'image' => 'array',
        'children' => 'array'
    ];

    protected static $_mywith = '';
    public function image(): HasOne
    {
        return $this->hasOne(Media::class, 'parent_id')->where('type', 'taxonomy');
    }
    // Relationships
    public function parent(): BelongsTo
    {
        return $this->belongsTo(Taxonomy::class, 'parent_id');
    }
    public function posts()
    {
        $post_ids = PostMeta::where('key', 'category')
            ->whereJsonContains('value', $this->id)
            ->pluck('post_id');

        return Posts::whereIn('id', $post_ids);
    }

    public function children(): HasMany
    {
        return $this->hasMany(Taxonomy::class, 'parent_id')->orderBy('title', 'asc')->with('children', 'image');
    }

    public function allChildren()
    {
        return $this->children()->with('allChildren');
    }

    public function allParent()
    {
        return self::$_mywith
            ? $this->parent()->with(self::$_mywith)
            : $this->parent()->with('allParent');
    }


    protected static function getHierarchicalOptions(string $type, $parentId = null, $prefix = '')
    {
        $query = self::where('type', $type)
            ->where('parent_id', $parentId)
            ->orderBy('title');
        $options = [];
        foreach ($query->get() as $item) {
            $options[$item->id] = $prefix . $item->title;
            $children = self::getHierarchicalOptions($type, $item->id, $prefix . '-- ');
            $options += $children;
        }
        return $options;
    }
    protected function createdAt(): Attribute
    {
        return Attribute::make(
            get: fn($value) => Carbon::parse($value)->format('m/d/Y')
        );
    }
    public function meta(): HasMany
    {
        return $this->hasMany(TaxonomyMeta::class, 'taxonomy_id');
    }

    public static function getOptionsForType(string $type, $parent = null, bool $useValue = false, bool $asOptions = false, $parent_id = null, $meta = null, $not_id = null)
    {

        $query = self::where('type', $type);
        if ($parent != null) {
            $query->where('parent_id', $parent);
        }
        if (!is_null($parent_id)) {
            $query->where('parent_id', $parent_id)->with('children');
        }
        if (!is_null($meta)) {
            $query->with('meta');
        }
        if (!is_null($not_id)) {
            $query->where('id', '!=', $not_id);
        }
        $items = $query->orderBy('title')->get();
        if (!is_null($meta) && is_string($meta) && $meta !== '') {
            foreach ($items as $item) {
                $item[$meta] = get_meta($item->meta, $meta);
            }
        }
        return $items;
    }
    public $timestamps = false;
}
