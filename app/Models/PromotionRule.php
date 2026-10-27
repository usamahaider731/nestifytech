<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PromotionRule extends Model
{
    use HasFactory;

    protected $table = 'promotions_and_tax_rules';

    protected $fillable = [
        'name',
        'type', // 'discount' | 'tax'
        'rate_type', // 'percentage' | 'fixed'
        'rate_value',
        'target_type', // 'all', 'product', 'category', 'brand', 'collection', 'user_role', 'user'
        'target_ids',
        'code',
        'min_spend',
        'start_date',
        'end_date',
        'priority',
        'status', // 'active' | 'inactive'
        'description',
    ];

    protected $casts = [
        'rate_value' => 'float',
        'min_spend' => 'float',
        'target_ids' => 'array',
        'priority' => 'integer',
        'start_date' => 'datetime',
        'end_date' => 'datetime',
    ];

    /**
     * Scope only active rules that are within valid date windows.
     */
    public function scopeActive($query)
    {
        $now = now();
        return $query->where('status', 'active')
            ->where(function ($q) use ($now) {
                $q->whereNull('start_date')->orWhere('start_date', '<=', $now);
            })
            ->where(function ($q) use ($now) {
                $q->whereNull('end_date')->orWhere('end_date', '>=', $now);
            });
    }

    /**
     * Scope discounts only
     */
    public function scopeDiscounts($query)
    {
        return $query->where('type', 'discount');
    }

    /**
     * Scope taxes only
     */
    public function scopeTaxes($query)
    {
        return $query->where('type', 'tax');
    }
}
