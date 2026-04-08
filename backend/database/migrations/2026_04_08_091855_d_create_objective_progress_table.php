<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('objective_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('child_id')->constrained('children')->cascadeOnDelete();
            $table->foreignId('learning_objective_id')->constrained('learning_objectives')->cascadeOnDelete();

            // v1: simple EWMA mastery
            $table->unsignedInteger('attempts')->default(0);
            $table->unsignedInteger('correct')->default(0);
            $table->unsignedSmallInteger('mastery')->default(0); // 0..100
            $table->unsignedSmallInteger('streak')->default(0);
            $table->timestamp('last_practiced_at')->nullable();
            $table->timestamp('last_correct_at')->nullable();

            // v2 placeholders (SM-2 spaced repetition) — nullable, populated later
            $table->float('sm2_ease_factor')->nullable();      // typically starts at 2.5
            $table->unsignedSmallInteger('sm2_interval_days')->nullable();
            $table->unsignedSmallInteger('sm2_repetitions')->nullable();
            $table->timestamp('sm2_due_at')->nullable();

            // v3 placeholders (Elo) — nullable, populated later
            $table->unsignedSmallInteger('elo_rating')->nullable(); // typically starts at 1200

            $table->timestamps();
            $table->unique(['child_id', 'learning_objective_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('objective_progress');
    }
};
