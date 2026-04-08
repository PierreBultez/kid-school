import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="mx-auto max-w-sm p-6">
      <h1 class="mb-4 text-2xl font-bold">Connexion</h1>

      <form [formGroup]="form" (ngSubmit)="submit()" class="flex flex-col gap-3">
        <label class="flex flex-col">
          <span class="text-sm">Email</span>
          <input type="email" formControlName="email" autocomplete="email"
                 class="rounded border px-3 py-2" />
        </label>

        <label class="flex flex-col">
          <span class="text-sm">Mot de passe</span>
          <input type="password" formControlName="password" autocomplete="current-password"
                 class="rounded border px-3 py-2" />
        </label>

        @if (error()) {
          <p class="text-sm text-red-600" role="alert">{{ error() }}</p>
        }

        <button type="submit" [disabled]="form.invalid || loading()"
                class="rounded bg-indigo-600 px-4 py-2 text-white disabled:opacity-50">
          {{ loading() ? 'Connexion…' : 'Se connecter' }}
        </button>
      </form>

      <p class="mt-4 text-sm">
        Pas encore de compte ?
        <a routerLink="/register" class="text-indigo-600 underline">Créer un compte</a>
      </p>
    </section>
  `,
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  protected async submit(): Promise<void> {
    if (this.form.invalid) {
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    try {
      await this.auth.login(this.form.getRawValue());
      await this.router.navigateByUrl('/profiles');
    } catch {
      this.error.set('Identifiants invalides.');
    } finally {
      this.loading.set(false);
    }
  }
}
