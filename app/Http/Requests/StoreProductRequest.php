<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user();
    }

    public function rules(): array
    {
        return [
            'branch_id' => ['required', 'exists:branches,id'],
            'sku' => ['required', 'string', 'max:50'],
            'name' => ['required', 'string', 'max:255'],
            'unit' => ['nullable', 'string', 'max:20'],
            'selling_price' => ['required', 'numeric', 'min:0'],
            'is_active' => ['boolean'],
            'tiers' => ['nullable', 'array'],
            'tiers.*.min_qty' => ['required_with:tiers', 'numeric', 'min:0.001'],
            'tiers.*.purchase_price' => ['required_with:tiers', 'numeric', 'min:0'],
        ];
    }
}
