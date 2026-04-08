import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { Child, ChildrenService } from '../../core/children.service';

@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mx-auto max-w-2xl p-6">
      <header class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold">Tableau de bord</h1>
          @if (auth.currentUser(); as user) {
            <p class="text-sm text-gray-600">
              Bonjour {{ user.name }} — {{ user.family?.name ?? 'sans famille' }}
            </p>
          }
        </div>
        <button type="button" (click)="logout()"
                class="rounded border px-3 py-1 text-sm">
          Se déconnecter
        </button>
      </header>

      <h2 class="mb-2 text-lg font-semibold">Profils enfants</h2>

      @if (loading()) {
        <p>Chargement…</p>
      } @else if (children().length === 0) {
        <p class="text-gray-600">Aucun profil enfant pour le moment.</p>
      } @else {
        <ul class="flex flex-col gap-2">
          @for (child of children(); track child.id) {
            <li class="rounded border p-3">
              <strong>{{ child.display_name }}</strong>
              <span class="ml-2 text-sm text-gray-600">
                — {{ child.grade_level }} ({{ child.birthdate }})
              </span>
            </li>
          }
        </ul>
      }
    </section>
  `,
})
export class DashboardComponent {
  protected readonly auth = inject(AuthService);
  private readonly childrenService = inject(ChildrenService);
  private readonly router = inject(Router);

  protected readonly children = signal<Child[]>([]);
  protected readonly loading = signal(true);

  constructor() {
    this.childrenService.list().subscribe({
      next: (list) => {
        this.children.set(list);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  protected async logout(): Promise<void> {
    await this.auth.logout();
    await this.router.navigateByUrl('/login');
  }
}
