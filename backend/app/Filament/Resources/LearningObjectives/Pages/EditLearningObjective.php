<?php

namespace App\Filament\Resources\LearningObjectives\Pages;

use App\Filament\Resources\LearningObjectives\LearningObjectiveResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditLearningObjective extends EditRecord
{
    protected static string $resource = LearningObjectiveResource::class;

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
        ];
    }

    protected function mutateFormDataBeforeSave(array $data): array
    {
        if (($data['period_mode'] ?? null) !== 'period') {
            $data['period'] = null;
        }

        return $data;
    }
}
