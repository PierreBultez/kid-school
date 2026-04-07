<?php

namespace App\Filament\Resources\LearningObjectives\Schemas;

use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Components\Utilities\Get;
use Filament\Schemas\Schema;

class LearningObjectiveForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema->components([
            Section::make('Rattachement')
                ->columns(2)
                ->schema([
                    Select::make('topic_id')
                        ->label('Topic')
                        ->relationship(
                            name: 'topic',
                            titleAttribute: 'name',
                            modifyQueryUsing: fn ($query) => $query->with('domain'),
                        )
                        ->getOptionLabelFromRecordUsing(
                            fn ($record) => "{$record->domain->code} · {$record->name}"
                        )
                        ->required()
                        ->preload()
                        ->searchable()
                        ->columnSpanFull(),

                    Select::make('level')
                        ->label('Niveau')
                        ->options([
                            'cm1' => 'CM1',
                            'cm2' => 'CM2',
                            'sixieme' => '6ᵉ',
                        ])
                        ->required()
                        ->native(false),

                    TextInput::make('code')
                        ->label('Code')
                        ->required()
                        ->maxLength(60)
                        ->helperText('Format : CY3-MAT-<DOMAIN>-<TOPIC>-<LEVEL>-<NN>'),
                ]),

            Section::make('Contenu')
                ->schema([
                    Textarea::make('description')
                        ->label('Description')
                        ->required()
                        ->rows(4)
                        ->columnSpanFull(),
                ]),

            Section::make('Période')
                ->columns(2)
                ->schema([
                    Select::make('period_mode')
                        ->label('Mode de période')
                        ->options([
                            'none' => 'Non précisé',
                            'all' => 'Toute l\'année',
                            'period' => 'Période précise',
                        ])
                        ->required()
                        ->native(false)
                        ->live()
                        ->afterStateUpdated(function ($state, callable $set) {
                            if ($state !== 'period') {
                                $set('period', null);
                            }
                        }),

                    Select::make('period')
                        ->label('Période (1 à 5)')
                        ->options([
                            1 => 'Période 1',
                            2 => 'Période 2',
                            3 => 'Période 3',
                            4 => 'Période 4',
                            5 => 'Période 5',
                        ])
                        ->native(false)
                        ->visible(fn (Get $get) => $get('period_mode') === 'period')
                        ->required(fn (Get $get) => $get('period_mode') === 'period'),
                ]),

            TextInput::make('position')
                ->label('Position')
                ->numeric()
                ->default(0),
        ]);
    }
}
