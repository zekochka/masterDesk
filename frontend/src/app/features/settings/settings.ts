import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { USER_ROLE_LABELS } from '../../models/masterdesk.models';
import { NotificationService } from '../../shared/notification.service';

@Component({
  selector: 'app-settings',
  imports: [ReactiveFormsModule],
  templateUrl: './settings.html',
})
export class SettingsPage {
  readonly auth = inject(AuthService);
  private readonly notification = inject(NotificationService);
  private readonly fb = inject(FormBuilder);
  readonly roleLabels = USER_ROLE_LABELS;
  readonly form = this.fb.nonNullable.group({
    firstName: [this.auth.user()?.firstName ?? ''],
    lastName: [this.auth.user()?.lastName ?? ''],
    email: [this.auth.user()?.email ?? '', Validators.email],
    phone: [this.auth.user()?.phone ?? '', Validators.pattern(/^$|^\+?[\d\s()\-]{10,20}$/)],
  });

  save(): void {
    if (this.form.invalid || (this.form.controls.phone.value && this.form.controls.phone.value.replace(/\D/g, '').length < 10)) {
      this.form.markAllAsTouched();
      this.notification.error('Проверьте email и номер телефона');
      return;
    }
    const value = this.form.getRawValue();
    this.auth.updateProfile({
      firstName: value.firstName.trim(), lastName: value.lastName.trim(),
      email: value.email.trim(), phone: value.phone.trim(),
    });
    this.notification.success('Изменения сохранены');
  }
}
