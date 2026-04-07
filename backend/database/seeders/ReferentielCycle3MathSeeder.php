<?php

namespace Database\Seeders;

use App\Models\Cycle;
use App\Models\Discipline;
use App\Models\Domain;
use App\Models\LearningObjective;
use App\Models\Topic;
use App\Models\TransversalSkill;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Symfony\Component\Yaml\Yaml;

class ReferentielCycle3MathSeeder extends Seeder
{
    /**
     * Libellés lisibles dérivés des slugs YAML (`cycle: cycle3`, `discipline: mathematiques`).
     */
    private const CYCLE_NAMES = [
        'cycle2' => 'Cycle 2',
        'cycle3' => 'Cycle 3',
        'cycle4' => 'Cycle 4',
    ];

    private const CYCLE_POSITIONS = [
        'cycle2' => 2,
        'cycle3' => 3,
        'cycle4' => 4,
    ];

    private const DISCIPLINE_NAMES = [
        'mathematiques' => 'Mathématiques',
        'francais' => 'Français',
    ];

    public function run(): void
    {
        $path = database_path('data/referentiel/cycle3/mathematiques.yaml');
        $data = Yaml::parseFile($path);

        DB::transaction(function () use ($data) {
            $cycleCode = $data['cycle'];
            $disciplineCode = $data['discipline'];

            // 1. Cycle
            $cycle = Cycle::updateOrCreate(
                ['code' => $cycleCode],
                [
                    'name' => self::CYCLE_NAMES[$cycleCode] ?? $cycleCode,
                    'position' => self::CYCLE_POSITIONS[$cycleCode] ?? 0,
                ],
            );

            // 2. Discipline
            $discipline = Discipline::updateOrCreate(
                ['code' => $disciplineCode],
                [
                    'name' => self::DISCIPLINE_NAMES[$disciplineCode] ?? $disciplineCode,
                    'position' => 0,
                ],
            );

            // 3. Domains → Topics → LearningObjectives
            foreach ($data['domains'] ?? [] as $dIdx => $domainData) {
                $domain = Domain::updateOrCreate(
                    [
                        'cycle_id' => $cycle->id,
                        'discipline_id' => $discipline->id,
                        'code' => $domainData['code'],
                    ],
                    [
                        'name' => $domainData['name'],
                        'position' => $domainData['position'] ?? $dIdx,
                    ],
                );

                foreach ($domainData['topics'] ?? [] as $tIdx => $topicData) {
                    $topic = Topic::updateOrCreate(
                        [
                            'domain_id' => $domain->id,
                            'code' => $topicData['code'],
                        ],
                        [
                            'name' => $topicData['name'],
                            'position' => $topicData['position'] ?? $tIdx,
                        ],
                    );

                    foreach ($topicData['learning_objectives'] ?? [] as $oIdx => $obj) {
                        [$periodMode, $period] = $this->normalizePeriod($obj['period'] ?? null);

                        LearningObjective::updateOrCreate(
                            ['code' => $obj['code']],
                            [
                                'topic_id' => $topic->id,
                                'description' => $obj['description'],
                                'level' => $obj['level'],
                                'period_mode' => $periodMode,
                                'period' => $period,
                                'position' => $obj['position'] ?? $oIdx,
                            ],
                        );
                    }
                }
            }

            // 4. Transversal skills
            foreach ($data['transversal_skills'] ?? [] as $sIdx => $skill) {
                TransversalSkill::updateOrCreate(
                    [
                        'cycle_id' => $cycle->id,
                        'discipline_id' => $discipline->id,
                        'code' => $skill['code'],
                    ],
                    [
                        'name' => $skill['name'],
                        'description' => $skill['description'] ?? null,
                        'position' => $skill['position'] ?? $sIdx,
                    ],
                );
            }
        });
    }

    /**
     * Convertit le champ `period` du YAML vers (period_mode, period).
     * - null          → ('none', null)
     * - 'all'         → ('all',  null)
     * - 1..5 (int)    → ('period', N)
     */
    private function normalizePeriod(mixed $raw): array
    {
        if ($raw === null) {
            return ['none', null];
        }
        if ($raw === 'all') {
            return ['all', null];
        }
        if (is_int($raw) && $raw >= 1 && $raw <= 5) {
            return ['period', $raw];
        }

        throw new \RuntimeException("Valeur period invalide : " . var_export($raw, true));
    }
}
