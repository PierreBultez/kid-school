<?php

namespace App\Filament\Resources\Domains\Tables;

use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class DomainsTable
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
                    ->searchable(),
                TextColumn::make('name')
                    ->label('Nom')
                    ->searchable(),
                TextColumn::make('position')
                    ->label('Position')
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
