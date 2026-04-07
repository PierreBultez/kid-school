<?php

namespace App\Filament\Resources\LearningObjectives\Tables;

use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

class LearningObjectivesTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->defaultSort('code')
            ->columns([
                TextColumn::make('code')
                    ->label('Code')
                    ->searchable()
                    ->copyable()
                    ->size('xs')
                    ->fontFamily('mono'),

                TextColumn::make('topic.domain.code')
                    ->label('Dom.')
                    ->badge()
                    ->sortable(),

                TextColumn::make('topic.name')
                    ->label('Topic')
                    ->searchable()
                    ->limit(30),

                TextColumn::make('level')
                    ->label('Niveau')
                    ->badge()
                    ->formatStateUsing(fn (string $state) => match ($state) {
                        'cm1' => 'CM1',
                        'cm2' => 'CM2',
                        'sixieme' => '6ᵉ',
                    })
                    ->color(fn (string $state) => match ($state) {
                        'cm1' => 'success',
                        'cm2' => 'warning',
                        'sixieme' => 'danger',
                    })
                    ->sortable(),

                TextColumn::make('period_mode')
                    ->label('Période')
                    ->formatStateUsing(fn (string $state, $record) => match ($state) {
                        'period' => 'P'.$record->period,
                        'all' => 'Année',
                        'none' => '—',
                    })
                    ->badge()
                    ->color('gray'),

                TextColumn::make('description')
                    ->label('Description')
                    ->limit(60)
                    ->tooltip(fn ($record) => $record->description)
                    ->wrap(),
            ])
            ->filters([
                SelectFilter::make('level')
                    ->label('Niveau')
                    ->options([
                        'cm1' => 'CM1',
                        'cm2' => 'CM2',
                        'sixieme' => '6ᵉ',
                    ]),

                SelectFilter::make('topic.domain_id')
                    ->label('Domaine')
                    ->relationship('topic.domain', 'name'),
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
