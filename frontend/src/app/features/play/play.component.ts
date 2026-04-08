import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-play',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <section class="mx-auto max-w-2xl p-6 text-center">
      <h1 class="mb-4 text-3xl font-bold">À toi de jouer !</h1>
      <p class="mb-6 text-gray-600">Les premiers mini-jeux arrivent bientôt.</p>
      <a routerLink="/profiles" class="text-indigo-600 underline">Changer de profil</a>
    </section>
  `,
})
export class PlayComponent {}
