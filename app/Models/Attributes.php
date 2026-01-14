<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Attributes extends Model
{
    use HasFactory;

    protected $table = "attributes";

    protected $fillable = [
        'name',
        'type',
    ];
    protected $casts = [
        'options' => 'array'
    ];
    public function options(): HasMany
    {
        return $this->hasMany(AttributeOptions::class, 'attribute_id');
    }
    public $timestamps = false;
}
