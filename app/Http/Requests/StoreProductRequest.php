<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user();
    }

    public function rules(): array
    {
        $id = $this->route('product')?->id;

        return [
            'branch_id' => ['required', 'exists:branches,id'],
            'sku' => ['required', 'string', 'max:50', Rule::unique('products', 'sku')->where(fn ($query) => $query->where('branch_id', $this->input('branch_id')))->ignore($id)],
            'name' => ['required', 'string', 'max:255'],
            'unit' => ['nullable', 'string', 'max:20'],
            'selling_price' => ['required', 'numeric', 'min:0'],
            'is_active' => ['boolean'],
            'tiers' => ['nullable', 'array'],
            'tiers.*.min_qty' => ['required_with:tiers', 'numeric', 'min:0.001'],
            'tiers.*.purchase_price' => ['required_with:tiers', 'numeric', 'min:0'],
            'opening_stock' => ['nullable', 'numeric', 'min:0'],
            'initial_cost' => ['nullable', 'numeric', 'min:0'],
        ];
    }

    public function messages(): array
    {
        return [
            'sku.unique' => 'SKU sudah dipakai di cabang ini.',
        ];
    }
}
