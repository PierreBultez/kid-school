<?php

namespace App\Filament\Resources\LearningObjectives\Pages;

use App\Filament\Resources\LearningObjectives\LearningObjectiveResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListLearningObjectives extends ListRecords
{
    protected static string $resource = LearningObjectiveResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}
