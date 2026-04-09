<?php

namespace Database\Seeders;

use App\Models\Game;
use App\Models\LearningObjective;
use Illuminate\Database\Seeder;

class GameSeeder extends Seeder
{
    /**
     * Idempotent seeder for the catalog of mini-games.
     */
    public function run(): void
    {
        $game = Game::updateOrCreate(
            ['slug' => 'symmetry-spotter'],
            [
                'name' => 'Le Miroir Magique',
                'description' => 'Complète la figure par symétrie en cliquant sur les bonnes cases du miroir.',
                'engine' => 'pixi',
                'min_grade' => 'CM1',
                'max_grade' => '6EME',
                'is_published' => true,
            ],
        );

        $objectiveIds = LearningObjective::whereIn('code', [
            'CY3-MAT-EGE-SYM-CM1-01',
            'CY3-MAT-EGE-SYM-CM2-01',
            'CY3-MAT-EGE-SYM-6E-01',
        ])->pluck('id')->all();

        if (! empty($objectiveIds)) {
            $game->learningObjectives()->syncWithoutDetaching($objectiveIds);
        }
    }
}
