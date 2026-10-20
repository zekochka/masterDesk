import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Client, formatDate, statusLabel } from '../../models/masterdesk.models';
import { MasterDeskService } from '../../services/masterdesk.service';
import { ConfirmDialog } from '../../shared/confirm-dialog';
import { NotificationService } from '../../shared/notification.service';

@Component({
  selector: 'app-clients',
  imports: [ReactiveFormsModule, RouterLink, ConfirmDialog],
  templateUrl: './clients.html',
})
export class ClientsPage {
  readonly data = inject(MasterDeskService);
  private readonly fb = inject(FormBuilder);
  private readonly notification = inject(NotificationService);
  readonly search = signal('');
  readonly filtered = computed(() => {
    const term = this.search().trim().toLocaleLowerCase('ru');
    return this.data.clients().filter((client) => !term || client.fullName.toLocaleLowerCase('ru').includes(term) || client.phone.includes(term)).sort((a, b) => a.fullName.localeCompare(b.fullName, 'ru'));
  });
  readonly formOpen = signal(false);
  readonly editingClient = signal<Client | null>(null);
  readonly historyClient = signal<Client | null>(null);
  readonly pendingDelete = signal<Client | null>(null);
  readonly formatDate = formatDate;
  readonly statusLabel = statusLabel;
  readonly form = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(3)]],
    phone: ['', [Validators.required, Validators.pattern(/^\+7(?:[\s()-]*\d){10}$/)]],
  });

  openCreate(): void {
    this.editingClient.set(null);
    this.form.reset();
    this.formOpen.set(true);
  }

  openEdit(client: Client): void {
    this.editingClient.set(client);
    this.form.patchValue({ fullName: client.fullName, phone: client.phone });
    this.formOpen.set(true);
  }

  save(): void {
    if (!this.form.controls.fullName.value.trim()) this.form.controls.fullName.setErrors({ required: true });
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const value = this.form.getRawValue();
    this.data.saveClient({ fullName: value.fullName.trim(), phone: value.phone.trim() }, this.editingClient()?.id).subscribe({
      next: () => {
        this.notification.success(this.editingClient() ? 'Данные клиента обновлены' : 'Клиент добавлен');
        this.formOpen.set(false);
      },
      error: (error: Error) => this.notification.error(error.message),
    });
  }

  requestDelete(client: Client): void {
    if (this.data.ordersForClient(client.id).length) {
      this.notification.error('У клиента есть заказы. Сначала удалите связанные заказы.');
      return;
    }
    this.pendingDelete.set(client);
  }

  remove(): void {
    const client = this.pendingDelete();
    if (!client) return;
    this.data.deleteClient(client.id).subscribe({
      next: () => { this.pendingDelete.set(null); this.notification.success('Клиент удалён'); },
      error: (error: Error) => this.notification.error(error.message),
    });
  }
}
