import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { MIN_NAME_LENGTH } from '@todo-workspace/shared-interfaces';
import { EMAIL_REGEXP } from '../../../shared/regexp/regexp';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.html',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsPage {
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  readonly user = this.authService.user;

  readonly form = new FormGroup({
    name: new FormControl(
      this.user()?.name || '',
      { validators: [Validators.required, Validators.minLength(MIN_NAME_LENGTH)], nonNullable: true },
    ),
    email: new FormControl(
      this.user()?.email || '',
      { validators: [Validators.required, Validators.pattern(EMAIL_REGEXP)], nonNullable: true },
    ),
  });

  readonly loading = signal(false);
  readonly success = signal(false);
  readonly errorMessage = signal<string | null>(null);

  submit() {
    if (this.form.invalid || this.loading()) return;

    this.loading.set(true);
    this.success.set(false);
    this.errorMessage.set(null);

    this.authService
      .updateMe(this.form.getRawValue())
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: () => {
          this.success.set(true);
          setTimeout(() => this.success.set(false), 3000);
        },
        error: err => {
          this.errorMessage.set(err.error?.message || 'Failed to update profile.');
        }
      });
  }
}
