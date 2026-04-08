<?php

namespace App\Filament\Resources\Children\Schemas;

use Filament\Forms\Components\DatePicker;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Schema;

class ChildForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Select::make('family_id')
                    ->relationship('family', 'name')
                    ->required(),
                TextInput::make('display_name')
                    ->required(),
                TextInput::make('avatar'),
                DatePicker::make('birthdate')
                    ->required(),
                TextInput::make('grade_level')
                    ->required(),
            ]);
    }
}
