import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { MIN_NAME_LENGTH } from '@todo-workspace/shared-interfaces';
import { EMAIL_REGEXP } from '../../../shared/regexp/regexp';
import { AuthService } from '../../../core/auth/auth.service';
import { NotificationService } from '../../../shared/notification/notification.service';
import { ConfirmDialogService } from '../../../shared/confirm-dialog/confirm-dialog.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.html',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly confirmDialogService = inject(ConfirmDialogService);

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

  async submit() {
    if (this.form.invalid || this.loading()) return;

    const confirmed = await this.confirmDialogService.confirm({
      title: 'Save changes',
      message: 'Are you sure you want to update your profile settings?',
    });

    if (!confirmed) return;

    this.loading.set(true);

    this.authService
      .updateMe(this.form.getRawValue())
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: () => this.notificationService.success('Profile updated successfully.'),
        error: err => this.notificationService.error(err.error?.message || 'Failed to update profile.'),
      });
  }
}
