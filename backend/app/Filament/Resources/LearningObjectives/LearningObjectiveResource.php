<?php

namespace App\Filament\Resources\LearningObjectives;

use App\Filament\Resources\LearningObjectives\Pages\CreateLearningObjective;
use App\Filament\Resources\LearningObjectives\Pages\EditLearningObjective;
use App\Filament\Resources\LearningObjectives\Pages\ListLearningObjectives;
use App\Filament\Resources\LearningObjectives\Schemas\LearningObjectiveForm;
use App\Filament\Resources\LearningObjectives\Tables\LearningObjectivesTable;
use App\Models\LearningObjective;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;

class LearningObjectiveResource extends Resource
{
    protected static ?string $model = LearningObjective::class;

    protected static ?int $navigationSort = 5;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedRocketLaunch;

    protected static ?string $navigationLabel = 'Objectifs';

    protected static ?string $modelLabel = 'Objectif pédagogique';

    protected static ?string $pluralModelLabel = 'Objectifs pédagogiques';

    protected static string|null|\UnitEnum $navigationGroup = 'Référentiel';

    protected static ?string $recordTitleAttribute = 'objective';

    public static function form(Schema $schema): Schema
    {
        return LearningObjectiveForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return LearningObjectivesTable::configure($table);
    }

    public static function getRelations(): array
    {
        return [
            //
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => ListLearningObjectives::route('/'),
            'create' => CreateLearningObjective::route('/create'),
            'edit' => EditLearningObjective::route('/{record}/edit'),
        ];
    }

    public static function getNavigationBadge(): ?string
    {
        return (string) static::getModel()::count();
    }
}
