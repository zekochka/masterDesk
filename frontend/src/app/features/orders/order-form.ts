import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { RepairRequestService } from '../../services/repair-request.service';
import { NotificationService } from '../../shared/notification.service';

@Component({
  selector: 'app-order-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './order-form.html',
})
export class OrderFormPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly requests = inject(RepairRequestService);
  private readonly router = inject(Router);
  private readonly notification = inject(NotificationService);
  readonly deviceTypes = ['Ноутбук', 'Компьютер', 'Смартфон', 'Монитор', 'Другое'];
  readonly form = this.fb.nonNullable.group({
    deviceType: ['', Validators.required],
    brandModel: ['', Validators.required],
    problem: ['', Validators.required],
    phone: ['', [Validators.required, Validators.pattern(/^\+?[\d\s()-]{10,20}$/)]],
    comment: [''],
  });

  submit(): void {
    const value = this.form.getRawValue();
    if (!value.brandModel.trim()) this.form.controls.brandModel.setErrors({ required: true });
    if (!value.problem.trim()) this.form.controls.problem.setErrors({ required: true });
    if (value.phone.replace(/\D/g, '').length < 10) this.form.controls.phone.setErrors({ pattern: true });
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notification.error('Проверьте обязательные поля заявки');
      return;
    }
    const user = this.auth.user();
    if (!user) return;
    this.requests.create({
      userId: user.id, deviceType: value.deviceType,
      brandModel: value.brandModel.trim(), problem: value.problem.trim(),
      phone: value.phone.trim(), comment: value.comment.trim(),
    });
    this.notification.success('Заявка отправлена');
    void this.router.navigateByUrl('/requests/my');
  }
}
