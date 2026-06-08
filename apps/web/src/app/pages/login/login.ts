import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { EMAIL_REGEXP, PASSWORD_REGEXP } from '../../shared/regexp/regexp';

@Component({
  templateUrl: './login.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink]
})
export class LoginPage {
  private readonly router = inject(Router);

  readonly form = new FormGroup({
    email: new FormControl('', { validators: [Validators.required, Validators.pattern(EMAIL_REGEXP)], nonNullable: true }),
    password: new FormControl('', { validators: [Validators.required, Validators.pattern(PASSWORD_REGEXP)], nonNullable: true }),
  });

  readonly show = signal<boolean>(false);

  submit(e: Event) {
    e.preventDefault();

    if (this.form.invalid) {
      return;
    }

    this.router.navigate(['/tasks']);
  }
}
