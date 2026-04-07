<?php

namespace App\Filament\Resources\Domains\Schemas;

use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Schema;

class DomainForm
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
                    ->maxLength(20),
                TextInput::make('name')
                    ->label('Nom')
                    ->required()
                    ->maxLength(255),
                TextInput::make('position')
                    ->label('Position')
                    ->numeric()
                    ->default(0),
            ]);
    }
}
