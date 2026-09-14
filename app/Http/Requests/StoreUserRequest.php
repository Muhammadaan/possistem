<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isOwner() ?? false;
    }

    public function rules(): array
    {
        $id = $this->route('user')?->id;

        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($id)],
            'password' => [$this->isMethod('post') ? 'required' : 'nullable', 'string', 'min:8'],
            'role' => ['required', 'in:OWNER,CASHIER'],
            'branch_id' => ['nullable', 'exists:branches,id', 'required_if:role,CASHIER'],
        ];
    }

    public function messages(): array
    {
        return [
            'branch_id.required_if' => 'Kasir wajib ditempatkan ke cabang.',
        ];
    }
}
