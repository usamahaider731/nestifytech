<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Module extends Model
{
    use HasFactory;

    protected $fillable = ['type', 'config_type', 'content'];

    protected $casts = [
        'content' => 'array',
    ];
}
