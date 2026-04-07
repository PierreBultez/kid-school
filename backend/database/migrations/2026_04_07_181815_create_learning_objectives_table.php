<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('learning_objectives', function (Blueprint $table) {
            $table->id();
            $table->foreignId('topic_id')->constrained()->cascadeOnDelete();
            $table->string('code', 60)->unique();
            $table->text('description');
            $table->string('level', 20);
            $table->string('period_mode', 10);
            $table->unsignedSmallInteger('period')->nullable();
            $table->unsignedSmallInteger('position')->default(0);
            $table->timestamps();

            $table->index(['topic_id', 'level']);
        });

        DB::statement("ALTER TABLE learning_objectives ADD CONSTRAINT learning_objectives_level_check CHECK (level IN
  ('cm1','cm2','sixieme'))");
        DB::statement("ALTER TABLE learning_objectives ADD CONSTRAINT learning_objectives_period_mode_check CHECK (period_mode IN
  ('period','all','none'))");
        DB::statement("ALTER TABLE learning_objectives ADD CONSTRAINT learning_objectives_period_coherence_check CHECK (
          (period_mode = 'period' AND period BETWEEN 1 AND 5)
          OR (period_mode IN ('all','none') AND period IS NULL)
      )");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('learning_objectives');
    }
};
