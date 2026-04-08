import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { Child, ChildrenService } from '../../core/children.service';
import { ChildFormComponent } from './child-form.component';

type FormState =
  | { mode: 'hidden' }
  | { mode: 'create' }
  | { mode: 'edit'; child: Child };

@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ChildFormComponent, RouterLink],
  template: `
    <section class="mx-auto max-w-2xl p-6">
      <header class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold">Espace parent</h1>
          @if (auth.currentUser(); as user) {
            <p class="text-sm text-gray-600">
              Bonjour {{ user.name }} — {{ user.family?.name ?? 'sans famille' }}
            </p>
          }
        </div>
        <div class="flex gap-2">
          <a routerLink="/profiles" class="rounded border px-3 py-1 text-sm">Qui joue ?</a>
          <button type="button" (click)="logout()" class="rounded border px-3 py-1 text-sm">
            Se déconnecter
          </button>
        </div>
      </header>

      <div class="mb-3 flex items-center justify-between">
        <h2 class="text-lg font-semibold">Profils enfants</h2>
        @if (formState().mode === 'hidden') {
          <button type="button" (click)="startCreate()"
                  class="rounded bg-indigo-600 px-3 py-1 text-sm text-white">
            + Ajouter un enfant
          </button>
        }
      </div>

      @if (formState(); as state) {
        @if (state.mode === 'create') {
          <app-child-form (saved)="onSaved($event)" (cancel)="closeForm()" />
        } @else if (state.mode === 'edit') {
          <app-child-form [child]="state.child" (saved)="onSaved($event)" (cancel)="closeForm()" />
        }
      }

      @if (loading()) {
        <p>Chargement…</p>
      } @else if (children().length === 0) {
        <p class="text-gray-600">Aucun profil enfant pour le moment.</p>
      } @else {
        <ul class="mt-4 flex flex-col gap-2">
          @for (child of children(); track child.id) {
            <li class="flex items-center justify-between rounded border p-3">
              <div>
                <strong>{{ child.display_name }}</strong>
                <span class="ml-2 text-sm text-gray-600">
                  — {{ child.grade_level }} ({{ child.birthdate }})
                </span>
              </div>
              <div class="flex gap-2">
                <button type="button" (click)="startEdit(child)"
                        class="rounded border px-2 py-1 text-sm">
                  Modifier
                </button>
                <button type="button" (click)="remove(child)"
                        class="rounded border border-red-300 px-2 py-1 text-sm text-red-600">
                  Supprimer
                </button>
              </div>
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
  protected readonly formState = signal<FormState>({ mode: 'hidden' });

  constructor() {
    this.reload();
  }

  protected startCreate(): void {
    this.formState.set({ mode: 'create' });
  }

  protected startEdit(child: Child): void {
    this.formState.set({ mode: 'edit', child });
  }

  protected closeForm(): void {
    this.formState.set({ mode: 'hidden' });
  }

  protected onSaved(child: Child): void {
    const state = this.formState();
    if (state.mode === 'edit') {
      this.children.update((list) => list.map((c) => (c.id === child.id ? child : c)));
    } else {
      this.children.update((list) => [...list, child]);
    }
    this.closeForm();
  }

  protected remove(child: Child): void {
    if (!confirm(`Supprimer le profil de ${child.display_name} ?`)) {
      return;
    }
    this.childrenService.delete(child.id).subscribe({
      next: () => this.children.update((list) => list.filter((c) => c.id !== child.id)),
    });
  }

  protected async logout(): Promise<void> {
    await this.auth.logout();
    await this.router.navigateByUrl('/login');
  }

  private reload(): void {
    this.loading.set(true);
    this.childrenService.list().subscribe({
      next: (list) => {
        this.children.set(list);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
