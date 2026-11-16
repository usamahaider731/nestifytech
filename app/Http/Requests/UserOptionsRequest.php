<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UserOptionsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Authorized via controller service
    }

    public function rules(): array
    {
        return [
            'search'    => ['nullable', 'string', 'max:50'],
            'role'      => ['nullable', 'string', 'max:50'],
            'store_id'  => ['nullable', 'integer'],
            'per_page'  => ['nullable', 'integer', 'min:1', 'max:100'],
            'page'      => ['nullable', 'integer', 'min:1'],
        ];
    }
}
