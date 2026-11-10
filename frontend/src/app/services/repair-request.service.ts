import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { RepairRequest } from '../models/masterdesk.models';
import { apiError } from './auth.service';

export type CreateRepairRequest = Pick<RepairRequest, 'deviceType' | 'brandModel' | 'description' | 'contactPhone' | 'comment'>;

@Injectable({ providedIn: 'root' })
export class RepairRequestService {
  private readonly http = inject(HttpClient);
  readonly requests = signal<RepairRequest[]>([]);

  async loadMine(): Promise<void> { await this.load('/api/requests/me'); }
  async loadAvailable(): Promise<void> { await this.load('/api/requests/available'); }
  async loadAssigned(): Promise<void> { await this.load('/api/requests/assigned'); }

  async create(input: CreateRepairRequest): Promise<RepairRequest> {
    try {
      return await firstValueFrom(this.http.post<RepairRequest>('/api/requests', input));
    } catch (error) {
      throw apiError(error, 'Не удалось отправить заявку');
    }
  }

  async accept(id: string): Promise<void> {
    await this.transition(id, 'accept');
    await this.loadAvailable();
  }

  async complete(id: string): Promise<void> {
    await this.transition(id, 'complete');
    await this.loadAssigned();
  }

  private async load(url: string): Promise<void> {
    try {
      this.requests.set(await firstValueFrom(this.http.get<RepairRequest[]>(url)));
    } catch (error) {
      this.requests.set([]);
      throw apiError(error, 'Не удалось загрузить заявки');
    }
  }

  private async transition(id: string, action: 'accept' | 'complete'): Promise<void> {
    try {
      await firstValueFrom(this.http.patch(`/api/requests/${id}/${action}`, {}));
    } catch (error) {
      throw apiError(error, 'Не удалось изменить статус заявки');
    }
  }
}
