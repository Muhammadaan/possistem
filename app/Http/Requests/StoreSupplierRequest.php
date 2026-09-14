<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreSupplierRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user();
    }

    public function rules(): array
    {
        $id = $this->route('supplier')?->id;

        return [
            'name' => ['required', 'string', 'max:255', 'unique:suppliers,name,'.$id],
            'phone' => ['nullable', 'string', 'max:30'],
            'address' => ['nullable', 'string'],
            'is_active' => ['boolean'],
        ];
    }
}
