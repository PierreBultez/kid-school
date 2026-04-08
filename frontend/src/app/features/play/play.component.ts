import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Game, GamesService } from '../../core/games.service';

@Component({
  selector: 'app-play',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <section class="mx-auto max-w-2xl p-6">
      <header class="mb-6 flex items-center justify-between">
        <h1 class="text-2xl font-bold">À toi de jouer !</h1>
        <a routerLink="/profiles" class="text-sm text-indigo-600 underline">
          Changer de profil
        </a>
      </header>

      @if (loading()) {
        <p>Chargement…</p>
      } @else if (games().length === 0) {
        <p class="text-gray-600">Aucun jeu disponible pour ton niveau pour l'instant.</p>
      } @else {
        <ul class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          @for (game of games(); track game.id) {
            <li>
              <a [routerLink]="['/play', game.slug]"
                 class="block rounded-lg border-2 border-transparent p-4 transition hover:border-indigo-500">
                <h2 class="text-lg font-bold">{{ game.name }}</h2>
                @if (game.description) {
                  <p class="mt-1 text-sm text-gray-600">{{ game.description }}</p>
                }
              </a>
            </li>
          }
        </ul>
      }

      @if (error()) {
        <p class="mt-4 text-sm text-red-600" role="alert">{{ error() }}</p>
      }
    </section>
  `,
})
export class PlayComponent {
  private readonly gamesService = inject(GamesService);

  protected readonly games = signal<Game[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  constructor() {
    this.gamesService.list().subscribe({
      next: (list) => {
        this.games.set(list);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set("Impossible de charger les jeux. As-tu sélectionné un profil ?");
      },
    });
  }
}
