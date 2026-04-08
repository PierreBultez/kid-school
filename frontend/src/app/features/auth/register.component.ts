import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-register',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="mx-auto max-w-md p-6">
      <h1 class="mb-4 text-2xl font-bold">Créer un compte parent</h1>

      <form [formGroup]="form" (ngSubmit)="submit()" class="flex flex-col gap-3">
        <label class="flex flex-col">
          <span class="text-sm">Votre nom</span>
          <input type="text" formControlName="name" autocomplete="name"
                 class="rounded border px-3 py-2" />
        </label>

        <label class="flex flex-col">
          <span class="text-sm">Nom de la famille</span>
          <input type="text" formControlName="family_name"
                 class="rounded border px-3 py-2" />
        </label>

        <label class="flex flex-col">
          <span class="text-sm">Email</span>
          <input type="email" formControlName="email" autocomplete="email"
                 class="rounded border px-3 py-2" />
        </label>

        <label class="flex flex-col">
          <span class="text-sm">Mot de passe</span>
          <input type="password" formControlName="password" autocomplete="new-password"
                 class="rounded border px-3 py-2" />
        </label>

        <label class="flex flex-col">
          <span class="text-sm">Confirmer le mot de passe</span>
          <input type="password" formControlName="password_confirmation" autocomplete="new-password"
                 class="rounded border px-3 py-2" />
        </label>

        <label class="flex items-start gap-2 text-sm">
          <input type="checkbox" formControlName="consent" class="mt-1" />
          <span>
            En tant que parent ou responsable légal, je crée ce compte pour mes enfants
            et j'accepte que leurs données pédagogiques soient enregistrées pour suivre
            leur progression.
          </span>
        </label>

        @if (error()) {
          <p class="text-sm text-red-600" role="alert">{{ error() }}</p>
        }

        <button type="submit" [disabled]="form.invalid || loading()"
                class="rounded bg-indigo-600 px-4 py-2 text-white disabled:opacity-50">
          {{ loading() ? 'Création…' : 'Créer mon compte' }}
        </button>
      </form>

      <p class="mt-4 text-sm">
        Déjà un compte ?
        <a routerLink="/login" class="text-indigo-600 underline">Se connecter</a>
      </p>
    </section>
  `,
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    family_name: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    password_confirmation: ['', [Validators.required]],
    consent: [false, [Validators.requiredTrue]],
  });

  protected async submit(): Promise<void> {
    if (this.form.invalid) {
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    try {
      await this.auth.register(this.form.getRawValue());
      await this.router.navigateByUrl('/dashboard');
    } catch {
      this.error.set("Impossible de créer le compte. Vérifiez les informations saisies.");
    } finally {
      this.loading.set(false);
    }
  }
}
