import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RepairRequestStatus, formatDate } from '../../models/masterdesk.models';
import { AuthService } from '../../services/auth.service';
import { RepairRequestService } from '../../services/repair-request.service';

@Component({
  selector: 'app-orders',
  imports: [RouterLink],
  templateUrl: './orders.html',
})
export class OrdersPage {
  private readonly auth = inject(AuthService);
  private readonly requests = inject(RepairRequestService);
  readonly items = computed(() => this.requests.forUser(this.auth.user()?.id ?? ''));
  readonly formatDate = formatDate;
  readonly statusLabels: Record<RepairRequestStatus, string> = {
    new: 'Новая', accepted: 'Принята', diagnostics: 'На диагностике', repair: 'В ремонте',
    ready: 'Готова', completed: 'Завершена', cancelled: 'Отменена',
  };
}
