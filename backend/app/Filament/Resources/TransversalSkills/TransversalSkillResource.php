<?php

namespace App\Filament\Resources\TransversalSkills;

use App\Filament\Resources\TransversalSkills\Pages\CreateTransversalSkill;
use App\Filament\Resources\TransversalSkills\Pages\EditTransversalSkill;
use App\Filament\Resources\TransversalSkills\Pages\ListTransversalSkills;
use App\Filament\Resources\TransversalSkills\Schemas\TransversalSkillForm;
use App\Filament\Resources\TransversalSkills\Tables\TransversalSkillsTable;
use App\Models\TransversalSkill;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;

class TransversalSkillResource extends Resource
{
    protected static ?string $model = TransversalSkill::class;

    protected static ?int $navigationSort = 6;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedSparkles;

    protected static ?string $navigationLabel = 'Compétences';

    protected static ?string $modelLabel = 'Compétence transversale';

    protected static ?string $pluralModelLabel = 'Compétences transversales';

    protected static string|null|\UnitEnum $navigationGroup = 'Référentiel';

    protected static ?string $recordTitleAttribute = 'transversal-skill';

    public static function form(Schema $schema): Schema
    {
        return TransversalSkillForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return TransversalSkillsTable::configure($table);
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
            'index' => ListTransversalSkills::route('/'),
            'create' => CreateTransversalSkill::route('/create'),
            'edit' => EditTransversalSkill::route('/{record}/edit'),
        ];
    }
}
