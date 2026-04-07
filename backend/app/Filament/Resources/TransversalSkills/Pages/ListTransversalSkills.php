<?php

namespace App\Filament\Resources\TransversalSkills\Pages;

use App\Filament\Resources\TransversalSkills\TransversalSkillResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListTransversalSkills extends ListRecords
{
    protected static string $resource = TransversalSkillResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}
