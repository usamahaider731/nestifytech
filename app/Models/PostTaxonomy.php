<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Facades\DB;

class PostTaxonomy extends Model
{
    use HasFactory;
    public $table = 'taxonomies';
    protected $appends = ['variations'];
    public $timestamps = false;
    public static function forTable($tableName)
    {
        $instance = new static;
        $instance->setTable($tableName);
        return $instance->newQuery();
    }
    public function image()
    {
        $type = $this->getTable() === 'posts' ? 'post' : 'taxonomy';
        return $this->hasOne(Media::class, 'parent_id', 'id')->where('type', $type);
    }
    public function parent()
    {
        return $this->hasOne(PostTaxonomy::class, 'id', 'parent_id');
    }
    public function gallery()
    {
        return $this->hasMany(Media::class, 'parent_id', 'id')->where('type', 'post_gallery');
    }
    public function meta()
    {
        $instance = new static;
        if ($this->getTable() === 'posts') {
            $instance->setTable('post_meta');

            return new \Illuminate\Database\Eloquent\Relations\HasMany($instance->newQuery(), $this, $instance->getTable() . '.post_id', $this->getKeyName());
        } else {
            $instance->setTable('taxonomy_meta');
            return new \Illuminate\Database\Eloquent\Relations\HasMany($instance->newQuery(), $this, $instance->getTable() . '.taxonomy_id', $this->getKeyName());
        }
    }
    public static function get_attribute($collection, $table = '', $key = '', $source = '', $meta_key = '', $default = '')
    {
        if ($source !== 'from_meta' || empty($collection)) {
            return $collection;
        }

        $metaKeys = is_array($meta_key) ? $meta_key : [$meta_key];
        $allIds = [];

        // Step 1: Extract all IDs from meta values
        foreach ($collection as $item) {
            if (!$item->meta) continue;

            $metas = $item->meta->whereIn('key', $metaKeys);
            foreach ($metas as $meta) {
                $val = json_decode($meta->value, true);
                if (is_array($val)) {
                    $allIds = array_merge($allIds, $val);
                } else {
                    $allIds[] = $meta->value;
                }
            }
        }

        $allIds = array_unique(array_filter($allIds));

        // Step 2: Batch fetch related records
        $related = [];
        if (!empty($allIds) && !empty($table)) {
            $related = \Illuminate\Support\Facades\DB::table($table)
                ->whereIn('id', $allIds)
                ->get()
                ->keyBy('id');
        }

        // Step 3: Map related records back to collection items
        foreach ($collection as $item) {
            if (is_array($meta_key)) {
                foreach ($metaKeys as $mKey) {
                    $item->$mKey = $default;
                }
            } else {
                $item->$meta_key = $default;
            }
            if (!$item->meta) continue;
            $metas = $item->meta->whereIn('key', $metaKeys);
            foreach ($metas as $meta) {
                $currentMetaKey = $meta->key;
                $val = json_decode($meta->value, true);
                if (is_array($val)) {
                    $mapped = [];
                    foreach ($val as $id) {
                        if (isset($related[$id])) {
                            $mapped[] = $key ? $related[$id]->$key : $related[$id];
                        }
                    }
                    $item->$currentMetaKey = $mapped;
                } else {
                    $id = $meta->value;
                    if (isset($related[$id])) {
                        $item->$currentMetaKey = $key ? $related[$id]->$key : $related[$id];
                    }
                }
            }
        }
        return $collection;
    }
    // In PostTaxonomy.php

    // Rename the method to be an accessor
    public function getVariationsAttribute()
    {
        // Add a safety check in case the model is new and hasn't been saved yet
        if (!$this->id) {
            return null;
        }

        $rftl = [];
        
        // Query parent variations (color groups)
        $parentVariations = DB::table('post_variations')
            ->where('post_id', $this->id)
            ->whereNull('parent_id')
            ->get();
        
        $formattedVariations = [];
        
        foreach ($parentVariations as $parent) {
            $vImage = DB::table('media')->where([
                'type'      => 'post_variation', // or whatever type you use for variations
                'parent_id' => $parent->id,
            ])->first();
            
            // Get shared attributes for the parent
            $parentValues = DB::table('product_variation_values')->where('variation_id', $parent->id)->get();
            $sharedAttributes = [];
            foreach ($parentValues as $v) {
                $option = DB::table('attribute_values')->where('id', $v->attribute_option_id)->first();
                if ($option) {
                    $attr = DB::table('attributes')->where('id', $option->attribute_id)->first();
                    if ($attr) {
                        $sharedAttributes[] = ['key' => $attr->name, 'value' => $option->value, 'id' => $option->id];
                    }
                }
            }
            
            // Query child variations (combinations)
            $childVariations = DB::table('post_variations')
                ->where('parent_id', $parent->id)
                ->get();
            
            $combinations = [];
            $totalStock = 0;
            $minPrice = $parent->price;
            
            foreach ($childVariations as $child) {
                $childValues = DB::table('product_variation_values')->where('variation_id', $child->id)->get();
                $comboAttributes = [];
                foreach ($childValues as $v) {
                    $option = DB::table('attribute_values')->where('id', $v->attribute_option_id)->first();
                    if ($option) {
                        $attr = DB::table('attributes')->where('id', $option->attribute_id)->first();
                        if ($attr) {
                            $comboAttributes[] = ['key' => $attr->name, 'value' => $option->value, 'id' => $option->id];
                        }
                    }
                }
                
                $combinations[] = [
                    'id' => $child->id,
                    'price' => $child->price,
                    'stock' => $child->stock,
                    'attributes' => $comboAttributes
                ];
                
                $totalStock += (int) $child->stock;
                if ($minPrice === 0 || ($child->price > 0 && $child->price < $minPrice)) {
                    $minPrice = $child->price;
                }
            }
            
            $formattedVariations[] = [
                'id'                => $parent->id,
                'price'             => $minPrice,
                'stock'             => $totalStock,
                'color'             => $parent->color ?? '',
                'image'             => $vImage ? $vImage->filename : null,
                'combinations'      => $combinations,
                'shared_attributes' => $sharedAttributes,
                'attributes'        => [] // some legacy code might expect this on the root object
            ];
        }
        
        // Convert to objects if needed by the frontend (previously it returned object representations of DB rows)
        foreach ($formattedVariations as $grp) {
            $rftl[] = (object) $grp;
        }

        return $rftl;
    }
}
