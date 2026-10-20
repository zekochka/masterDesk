import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ORDER_STATUSES, OrderStatus, formatDate } from '../../models/masterdesk.models';
import { MasterDeskService } from '../../services/masterdesk.service';
import { NotificationService } from '../../shared/notification.service';

@Component({
  selector: 'app-order-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './order-form.html',
})
export class OrderFormPage {
  readonly data = inject(MasterDeskService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly notification = inject(NotificationService);
  readonly id = Number(this.route.snapshot.paramMap.get('id'));
  readonly editing = this.id > 0;
  readonly order = computed(() => this.data.getOrder(this.id));
  readonly statuses = ORDER_STATUSES;
  readonly formatDate = formatDate;
  readonly today = formatDate(new Date().toISOString());
  readonly clientDialogOpen = signal(false);
  readonly saving = signal(false);
  readonly form = this.fb.nonNullable.group({
    clientId: [0, [Validators.required, Validators.min(1)]],
    deviceType: ['', Validators.required],
    brand: ['', Validators.required],
    model: ['', Validators.required],
    problem: ['', [Validators.required, Validators.minLength(8)]],
    technicianId: this.fb.control<number | null>(null),
    estimatedCost: [0, [Validators.required, Validators.min(0)]],
    status: ['new', Validators.required],
  });
  readonly clientForm = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(3)]],
    phone: ['', [Validators.required, Validators.pattern(/^\+7(?:[\s()-]*\d){10}$/)]],
  });
  private populated = false;

  constructor() {
    effect(() => {
      const order = this.order();
      if (this.editing && order && !this.populated) {
        this.populated = true;
        this.form.patchValue({
          clientId: order.clientId,
          deviceType: order.deviceType,
          brand: order.brand,
          model: order.model,
          problem: order.problem,
          technicianId: order.technicianId,
          estimatedCost: order.estimatedCost,
          status: order.status,
        });
      }
    });
  }

  save(): void {
    for (const key of ['brand', 'model', 'problem'] as const) {
      const control = this.form.controls[key];
      if (!control.value.trim()) control.setErrors({ required: true });
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notification.error('Заполните обязательные поля заказа');
      return;
    }
    this.saving.set(true);
    const value = this.form.getRawValue();
    this.data.saveOrder({
      ...value,
      clientId: Number(value.clientId),
      technicianId: value.technicianId ? Number(value.technicianId) : null,
      brand: value.brand.trim(),
      model: value.model.trim(),
      problem: value.problem.trim(),
      status: value.status as OrderStatus,
      receivedAt: this.order()?.receivedAt ?? new Date().toISOString(),
    }, this.editing ? this.id : undefined).subscribe({
      next: (order) => {
        this.notification.success(this.editing ? 'Заказ успешно обновлён' : 'Новый заказ создан');
        void this.router.navigate(['/orders', order.id]);
      },
      error: (error: Error) => { this.notification.error(error.message); this.saving.set(false); },
    });
  }

  addClient(): void {
    if (!this.clientForm.controls.fullName.value.trim()) this.clientForm.controls.fullName.setErrors({ required: true });
    if (this.clientForm.invalid) {
      this.clientForm.markAllAsTouched();
      return;
    }
    const value = this.clientForm.getRawValue();
    this.data.saveClient({ fullName: value.fullName.trim(), phone: value.phone.trim() }).subscribe({
      next: (client) => {
        this.form.controls.clientId.setValue(client.id);
        this.clientDialogOpen.set(false);
        this.clientForm.reset();
        this.notification.success('Клиент добавлен');
      },
      error: (error: Error) => this.notification.error(error.message),
    });
  }
}
