<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class AttributeOptions extends Model
{
    use HasFactory;
    
    protected $table = "attribute_options";
    
    protected $fillable = [
        'attribute_id',
        'value',
        'parent_id',
        'parent_type',
        
    ];
    
    /**
     * Get the attribute that owns this value
     */
    public function attribute(): BelongsTo
    {
        return $this->belongsTo(Attributes::class, 'attribute_id');
    }
    
    /**
     * Get the parent model that owns this attribute value
     */
    public function parent(): MorphTo
    {
        return $this->morphTo();
    }
    public $timestamps = false;

}