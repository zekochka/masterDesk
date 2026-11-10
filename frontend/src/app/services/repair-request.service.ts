import { Injectable, signal } from '@angular/core';
import { RepairRequest } from '../models/masterdesk.models';

@Injectable({ providedIn: 'root' })
export class RepairRequestService {
  private readonly key = 'masterdesk-repair-requests-v1';
  readonly requests = signal<RepairRequest[]>(this.read());

  forUser(userId: string): RepairRequest[] {
    return this.requests().filter((item) => item.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  create(input: Pick<RepairRequest, 'userId' | 'deviceType' | 'brandModel' | 'problem' | 'phone' | 'comment'>): RepairRequest {
    const id = Math.max(0, ...this.requests().map((item) => item.id)) + 1;
    const request: RepairRequest = {
      ...input, id, number: `MD-${new Date().getFullYear()}-${String(id).padStart(4, '0')}`,
      createdAt: new Date().toISOString(), status: 'new',
    };
    const requests = [...this.requests(), request];
    localStorage.setItem(this.key, JSON.stringify(requests));
    this.requests.set(requests);
    return request;
  }

  private read(): RepairRequest[] {
    try {
      const value: unknown = JSON.parse(localStorage.getItem(this.key) ?? '[]');
      return Array.isArray(value) ? value.filter((item): item is RepairRequest =>
        !!item && typeof item.id === 'number' && typeof item.userId === 'string' && typeof item.problem === 'string') : [];
    } catch {
      return [];
    }
  }
}
