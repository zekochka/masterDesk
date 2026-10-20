import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ORDER_STATUSES, OrderStatus, RepairOrder, formatDate, formatMoney, statusLabel } from '../../models/masterdesk.models';
import { MasterDeskService } from '../../services/masterdesk.service';
import { NotificationService } from '../../shared/notification.service';
import { ConfirmDialog } from '../../shared/confirm-dialog';

@Component({
  selector: 'app-orders',
  imports: [RouterLink, ConfirmDialog],
  templateUrl: './orders.html',
})
export class OrdersPage {
  readonly data = inject(MasterDeskService);
  private readonly notification = inject(NotificationService);
  readonly search = signal('');
  readonly status = signal<OrderStatus | 'all'>('all');
  readonly newestFirst = signal(true);
  readonly statuses = ORDER_STATUSES;
  readonly formatDate = formatDate;
  readonly formatMoney = formatMoney;
  readonly statusLabel = statusLabel;
  readonly pendingDelete = signal<RepairOrder | null>(null);
  readonly filtered = computed(() => {
    const term = this.search().trim().toLocaleLowerCase('ru');
    return this.data.orders().filter((order) =>
      (this.status() === 'all' || order.status === this.status()) &&
      (!term || order.number.toLocaleLowerCase('ru').includes(term) || this.data.getClient(order.clientId)?.fullName.toLocaleLowerCase('ru').includes(term))
    ).sort((a, b) => this.newestFirst() ? b.createdAt.localeCompare(a.createdAt) : a.createdAt.localeCompare(b.createdAt));
  });

  setStatus(value: string): void {
    this.status.set(value as OrderStatus | 'all');
  }

  remove(): void {
    const order = this.pendingDelete();
    if (!order) return;
    this.data.deleteOrder(order.id).subscribe({
      next: () => { this.notification.success(`Заказ ${order.number} удалён`); this.pendingDelete.set(null); },
      error: () => this.notification.error('Не удалось удалить заказ'),
    });
  }
}
