import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Child, ChildrenService } from '../../core/children.service';

@Component({
  selector: 'app-profiles',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <section class="mx-auto max-w-3xl p-6 text-center">
      <h1 class="mb-8 text-3xl font-bold">Qui joue ?</h1>

      @if (loading()) {
        <p>Chargement…</p>
      } @else if (children().length === 0) {
        <p class="text-gray-600">
          Aucun profil enfant. Demande à un parent de créer un profil dans
          <a routerLink="/dashboard" class="text-indigo-600 underline">l'espace parent</a>.
        </p>
      } @else {
        <ul class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          @for (child of children(); track child.id) {
            <li>
              <button
                type="button"
                (click)="select(child)"
                [disabled]="selecting() === child.id"
                class="flex w-full flex-col items-center gap-2 rounded-lg border-2 border-transparent
                       p-4 transition hover:border-indigo-500 disabled:opacity-50"
              >
                <span
                  class="flex h-20 w-20 items-center justify-center rounded-full bg-indigo-100
                         text-3xl font-bold text-indigo-700"
                  aria-hidden="true"
                >
                  {{ child.display_name.charAt(0).toUpperCase() }}
                </span>
                <span class="font-semibold">{{ child.display_name }}</span>
                <span class="text-xs text-gray-500">{{ child.grade_level }}</span>
              </button>
            </li>
          }
        </ul>
      }

      @if (error()) {
        <p class="mt-4 text-sm text-red-600" role="alert">{{ error() }}</p>
      }

      <p class="mt-8 text-sm">
        <a routerLink="/dashboard" class="text-indigo-600 underline">Espace parent</a>
      </p>
    </section>
  `,
})
export class ProfilesComponent {
  private readonly childrenService = inject(ChildrenService);
  private readonly router = inject(Router);

  protected readonly children = signal<Child[]>([]);
  protected readonly loading = signal(true);
  protected readonly selecting = signal<number | null>(null);
  protected readonly error = signal<string | null>(null);

  constructor() {
    this.childrenService.list().subscribe({
      next: (list) => {
        this.children.set(list);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Impossible de charger les profils.');
      },
    });
  }

  protected select(child: Child): void {
    this.selecting.set(child.id);
    this.error.set(null);
    this.childrenService.select(child.id).subscribe({
      next: () => this.router.navigateByUrl('/play'),
      error: () => {
        this.selecting.set(null);
        this.error.set('Impossible de sélectionner ce profil.');
      },
    });
  }
}
