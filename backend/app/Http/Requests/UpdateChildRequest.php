<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateChildRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'display_name' => ['sometimes', 'required', 'string', 'max:255'],
            'avatar' => ['nullable', 'string', 'max:255'],
            'birthdate' => ['sometimes', 'required', 'date', 'before_or_equal:'.now()->subYears(7)->toDateString()],
            'grade_level' => ['sometimes', 'required', Rule::in(['CM1', 'CM2', '6EME'])],
        ];
    }
}
