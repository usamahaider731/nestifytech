<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductVariationValue extends Model
{
    use HasFactory;
    protected $table = "product_variation_values";
    protected $fillable = [
        'variation_id',
        'attribute_option_id',
    ];
    public $timestamps = false;
    public function attribute_option(){
        return $this->belongsTo(AttributeValues::class, 'attribute_option_id')->with('attribute');
    }
}
