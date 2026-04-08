<?php

namespace Database\Factories;

use App\Models\Child;
use App\Models\Family;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Child>
 */
class ChildFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'family_id' => Family::factory(),
            'display_name' => fake()->firstName(),
            'avatar' => null,
            'birthdate' => fake()->dateTimeBetween('-12 years', '-8 years')->format('Y-m-d'),
            'grade_level' => fake()->randomElement(['CM1', 'CM2', '6EME']),
        ];
    }
}
