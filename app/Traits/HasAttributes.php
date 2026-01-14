<?php

namespace App\Traits;

use App\Models\Attributes;
use App\Models\AttributeValue;
use Illuminate\Database\Eloquent\Relations\MorphToMany;

trait HasAttributes
{
    /**
     * Get all attributes associated with the model
     *
     * @return \Illuminate\Database\Eloquent\Relations\MorphMany
     */
    public function attributeValues()
    {
        return $this->morphMany(AttributeValue::class, 'parent');
    }
    
    /**
     * Assign attribute values to the model
     *
     * @param array $attributes Array of attribute values [attribute_id => value]
     * @return void
     */
    public function assignAttributes(array $attributes)
    {
        foreach ($attributes as $attributeId => $value) {
            // If value is an array, it's a multi-value attribute (like checkboxes)
            if (is_array($value)) {
                foreach ($value as $singleValue) {
                    $this->attributeValues()->create([
                        'attribute_id' => $attributeId,
                        'value' => $singleValue
                    ]);
                }
            } else {
                $this->attributeValues()->create([
                    'attribute_id' => $attributeId,
                    'value' => $value
                ]);
            }
        }
    }
    
    /**
     * Update attribute values for the model
     *
     * @param array $attributes Array of attribute values [attribute_id => value]
     * @return void
     */
    public function updateAttributes(array $attributes)
    {
        // Delete existing attribute values
        $this->attributeValues()->delete();
        
        // Assign new attribute values
        $this->assignAttributes($attributes);
    }
    
    /**
     * Get attribute values grouped by attribute
     *
     * @return \Illuminate\Support\Collection
     */
    public function getAttributeValues()
    {
        return $this->attributeValues()
            ->with('attribute')
            ->get()
            ->groupBy('attribute_id')
            ->map(function ($values) {
                $attribute = $values->first()->attribute;
                
                // For single-value attributes (text, select, etc.)
                if (in_array($attribute->type, ['text', 'select', 'color'])) {
                    return [
                        'attribute' => $attribute,
                        'values' => $values->first()->value
                    ];
                }
                
                // For multi-value attributes (checkbox, etc.)
                return [
                    'attribute' => $attribute,
                    'values' => $values->pluck('value')->toArray()
                ];
            });
    }
    
    /**
     * Get a specific attribute value
     *
     * @param int $attributeId
     * @return mixed
     */
    public function getAttributeValue($attributeId)
    {
        $values = $this->attributeValues()
            ->where('attribute_id', $attributeId)
            ->get();
            
        if ($values->isEmpty()) {
            return null;
        }
        
        $attribute = Attributes::find($attributeId);
        
        // For single-value attributes
        if (in_array($attribute->type, ['text', 'select', 'color'])) {
            return $values->first()->value;
        }
        
        // For multi-value attributes
        return $values->pluck('value')->toArray();
    }
}