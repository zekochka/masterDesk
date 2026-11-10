import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-auth',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './auth.html',
})
export class AuthPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly registration = this.route.snapshot.routeConfig?.path === 'register';
  readonly returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
  readonly error = signal('');
  readonly saving = signal(false);
  readonly form = this.fb.nonNullable.group({
    username: ['', Validators.required],
    password: ['', [Validators.required, Validators.minLength(this.registration ? 8 : 1)]],
    confirmPassword: [''],
  });

  async submit(): Promise<void> {
    this.error.set('');
    const value = this.form.getRawValue();
    if (!value.username.trim()) this.form.controls.username.setErrors({ required: true });
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.registration && value.password !== value.confirmPassword) {
      this.form.controls.confirmPassword.setErrors({ mismatch: true });
      this.error.set('Пароли не совпадают');
      return;
    }
    this.saving.set(true);
    try {
      if (this.registration) await this.auth.register(value.username, value.password, value.confirmPassword);
      else await this.auth.login(value.username, value.password);
      const fallback = this.auth.user()?.role === 'Master' ? '/requests/available' : '/requests/my';
      const destination = this.returnUrl?.startsWith('/') && !this.returnUrl.startsWith('//') ? this.returnUrl : fallback;
      await this.router.navigateByUrl(destination);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Не удалось войти. Попробуйте ещё раз.');
    } finally {
      this.saving.set(false);
    }
  }
}
