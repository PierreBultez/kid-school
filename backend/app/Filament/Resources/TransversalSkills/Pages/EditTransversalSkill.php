<?php

namespace App\Filament\Resources\TransversalSkills\Pages;

use App\Filament\Resources\TransversalSkills\TransversalSkillResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditTransversalSkill extends EditRecord
{
    protected static string $resource = TransversalSkillResource::class;

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
        ];
    }
}
