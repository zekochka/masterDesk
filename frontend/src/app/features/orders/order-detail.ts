import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ORDER_STATUSES, OrderStatus, formatDateTime, formatMoney, statusLabel } from '../../models/masterdesk.models';
import { MasterDeskService } from '../../services/masterdesk.service';
import { ConfirmDialog } from '../../shared/confirm-dialog';
import { NotificationService } from '../../shared/notification.service';

@Component({
  selector: 'app-order-detail',
  imports: [RouterLink, ConfirmDialog],
  templateUrl: './order-detail.html',
})
export class OrderDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly data = inject(MasterDeskService);
  private readonly notification = inject(NotificationService);
  readonly id = Number(this.route.snapshot.paramMap.get('id'));
  readonly order = computed(() => this.data.getOrder(this.id));
  readonly statuses = ORDER_STATUSES;
  readonly formatDateTime = formatDateTime;
  readonly formatMoney = formatMoney;
  readonly statusLabel = statusLabel;
  readonly confirmDelete = signal(false);

  changeStatus(value: string): void {
    this.data.changeStatus(this.id, value as OrderStatus).subscribe({
      next: () => this.notification.success('Статус заказа обновлён'),
      error: (error: Error) => this.notification.error(error.message),
    });
  }

  remove(): void {
    this.data.deleteOrder(this.id).subscribe({
      next: () => { this.notification.success('Заказ удалён'); void this.router.navigate(['/orders']); },
      error: () => this.notification.error('Не удалось удалить заказ'),
    });
  }
}
