import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Child, ChildPayload, ChildrenService } from '../../core/children.service';

@Component({
  selector: 'app-child-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()" class="flex flex-col gap-3 rounded border p-4">
      <h3 class="text-lg font-semibold">{{ title() }}</h3>

      <label class="flex flex-col">
        <span class="text-sm">Prénom / pseudo</span>
        <input type="text" formControlName="display_name" class="rounded border px-3 py-2" />
      </label>

      <label class="flex flex-col">
        <span class="text-sm">Date de naissance</span>
        <input type="date" formControlName="birthdate" [max]="maxBirthdate"
               class="rounded border px-3 py-2" />
      </label>

      <label class="flex flex-col">
        <span class="text-sm">Niveau scolaire</span>
        <select formControlName="grade_level" class="rounded border px-3 py-2">
          <option value="CM1">CM1</option>
          <option value="CM2">CM2</option>
          <option value="6EME">6ème</option>
        </select>
      </label>

      @if (error()) {
        <p class="text-sm text-red-600" role="alert">{{ error() }}</p>
      }

      <div class="flex gap-2">
        <button type="submit" [disabled]="form.invalid || loading()"
                class="rounded bg-indigo-600 px-4 py-2 text-white disabled:opacity-50">
          {{ loading() ? 'Enregistrement…' : 'Enregistrer' }}
        </button>
        <button type="button" (click)="cancel.emit()"
                class="rounded border px-4 py-2">
          Annuler
        </button>
      </div>
    </form>
  `,
})
export class ChildFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly childrenService = inject(ChildrenService);

  readonly child = input<Child | null>(null);
  readonly saved = output<Child>();
  readonly cancel = output<void>();

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly title = computed(() =>
    this.child() ? 'Modifier le profil' : 'Nouveau profil enfant',
  );

  protected readonly maxBirthdate = (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 7);
    return d.toISOString().slice(0, 10);
  })();

  protected readonly form = this.fb.nonNullable.group({
    display_name: ['', [Validators.required]],
    birthdate: ['', [Validators.required]],
    grade_level: ['CM1' as 'CM1' | 'CM2' | '6EME', [Validators.required]],
  });

  constructor() {
    queueMicrotask(() => {
      const c = this.child();
      if (c) {
        this.form.patchValue({
          display_name: c.display_name,
          birthdate: c.birthdate.slice(0, 10),
          grade_level: c.grade_level,
        });
      }
    });
  }

  protected submit(): void {
    if (this.form.invalid) {
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    const payload: ChildPayload = this.form.getRawValue();
    const existing = this.child();
    const request$ = existing
      ? this.childrenService.update(existing.id, payload)
      : this.childrenService.create(payload);

    request$.subscribe({
      next: (child) => {
        this.loading.set(false);
        this.saved.emit(child);
      },
      error: () => {
        this.loading.set(false);
        this.error.set("Impossible d'enregistrer le profil. Vérifiez les informations.");
      },
    });
  }
}
