<?php

namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Menu extends Model
{
    public $table = "menu";
    protected $fillable = [
        'id',
        'slug',
        'name',
        'link',
        'parent_id',
        
    ];
    public $timestamps = false;
    public function parent(): BelongsTo
    {
        return $this->belongsTo(Menu::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(Menu::class, 'parent_id')->orderBy('name', 'asc')->with('children');
    }

    public function allChildren()
    {
        return $this->children()->with('allChildren');
    }
}