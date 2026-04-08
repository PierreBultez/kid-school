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
                'name' => 'Chasse à la symétrie',
                'description' => 'Observe la figure et dis si elle est symétrique ou non.',
                'engine' => 'pixi',
                'min_grade' => 'CM1',
                'max_grade' => '6EME',
                'is_published' => true,
            ],
        );

        $objective = LearningObjective::where('code', 'CY3-MAT-EGE-SYM-CM1-01')->first();

        if ($objective) {
            $game->learningObjectives()->syncWithoutDetaching([$objective->id]);
        }
    }
}
