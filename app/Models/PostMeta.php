<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PostMeta extends Model
{
    public $table = "post_meta";
    public $timestamps = false;
    protected $fillable = [
        'id',
        'post_id',
        'key',
        'value',
    ];
}