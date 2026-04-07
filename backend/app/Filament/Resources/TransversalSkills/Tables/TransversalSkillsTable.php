<?php

namespace App\Filament\Resources\TransversalSkills\Tables;

use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class TransversalSkillsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('cycle.name')
                    ->label('Cycle')
                    ->sortable(),

                TextColumn::make('discipline.name')
                    ->label('Discipline')
                    ->sortable(),

                TextColumn::make('code')
                    ->label('Code')
                    ->searchable()
                    ->fontFamily('mono')
                    ->size('xs'),

                TextColumn::make('name')
                    ->label('Nom')
                    ->searchable(),

                TextColumn::make('description')
                    ->label('Description')
                    ->limit(60)
                    ->tooltip(fn ($record) => $record->description)
                    ->toggleable(),
                TextColumn::make('position')
                    ->numeric()
                    ->sortable(),
                TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
                TextColumn::make('updated_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                //
            ])
            ->recordActions([
                EditAction::make(),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ]);
    }
}
