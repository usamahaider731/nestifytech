<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PostVariation extends Model
{
    use HasFactory;
    public $table = "post_variations";
    public $timestamps = false;
    protected $fillable = [
        'id',
        'post_id',
        'price',
        'stock',
    ];
    public function variations_value(){
        return $this->hasMany(ProductVariationValue::class, 'variation_id')->with('attribute_option');
    }
}
