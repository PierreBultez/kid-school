<?php

namespace App\Filament\Resources\Topics\Schemas;

use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Schema;

class TopicForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Select::make('domain_id')
                    ->label('Domaine')
                    ->relationship(
                        name: 'domain',
                        titleAttribute: 'name',
                        modifyQueryUsing: fn ($query) => $query->with('cycle', 'discipline'),
                    )
                    ->getOptionLabelFromRecordUsing(
                        fn ($record) => "{$record->cycle->name} · {$record->discipline->name} · {$record->name}"
                    )
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
                TextInput::make('position')
                    ->label('Position')
                    ->numeric()
                    ->default(0),
            ]);
    }
}
