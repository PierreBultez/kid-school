<?php

namespace App\Filament\Resources\LearningObjectives\Pages;

use App\Filament\Resources\LearningObjectives\LearningObjectiveResource;
use Filament\Resources\Pages\CreateRecord;

class CreateLearningObjective extends CreateRecord
{
    protected static string $resource = LearningObjectiveResource::class;

    protected function mutateFormDataBeforeCreate(array $data): array
    {
        if (($data['period_mode'] ?? null) !== 'period') {
            $data['period'] = null;
        }

        return $data;
    }
}
