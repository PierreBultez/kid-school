<?php

namespace App\Filament\Resources\TransversalSkills\Schemas;

use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Schemas\Schema;

class TransversalSkillForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Select::make('cycle_id')
                    ->label('Cycle')
                    ->relationship('cycle', 'name')
                    ->required()
                    ->preload()
                    ->searchable(),

                Select::make('discipline_id')
                    ->label('Discipline')
                    ->relationship('discipline', 'name')
                    ->required()
                    ->preload()
                    ->searchable(),

                TextInput::make('code')
                    ->label('Code')
                    ->required()
                    ->maxLength(30),

                TextInput::make('name')
                    ->label('Nom')
                    ->required()
                    ->maxLength(255),

                Textarea::make('description')
                    ->label('Description')
                    ->rows(3)
                    ->columnSpanFull(),

                TextInput::make('position')
                    ->label('Position')
                    ->numeric()
                    ->default(0),
            ]);
    }
}
