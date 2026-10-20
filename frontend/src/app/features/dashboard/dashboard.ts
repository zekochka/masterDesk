import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ORDER_STATUSES, formatDate, formatMoney, statusLabel } from '../../models/masterdesk.models';
import { MasterDeskService } from '../../services/masterdesk.service';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink],
  templateUrl: './dashboard.html',
})
export class DashboardPage {
  readonly data = inject(MasterDeskService);
  readonly statuses = ORDER_STATUSES;
  readonly formatDate = formatDate;
  readonly formatMoney = formatMoney;
  readonly statusLabel = statusLabel;
  readonly recent = computed(() => [...this.data.orders()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5));
  readonly newCount = computed(() => this.data.orders().filter((order) => order.status === 'new').length);
  readonly repairCount = computed(() => this.data.orders().filter((order) => order.status === 'repair').length);
  readonly completedCount = computed(() => this.data.orders().filter((order) => order.status === 'ready' || order.status === 'delivered').length);
  readonly stats = computed(() => this.statuses.map((status) => ({
    ...status,
    count: this.data.orders().filter((order) => order.status === status.value).length,
    percent: this.data.totalOrders() ? Math.round(this.data.orders().filter((order) => order.status === status.value).length / this.data.totalOrders() * 100) : 0,
  })));
}
