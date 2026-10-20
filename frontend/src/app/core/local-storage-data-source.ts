import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Client, MasterDeskData, RepairOrder } from '../models/masterdesk.models';
import { MasterDeskDataSource } from '../services/data-source';
import { createDemoData } from '../services/demo-data';

@Injectable()
export class LocalStorageDataSource extends MasterDeskDataSource {
  private readonly key = 'masterdesk-demo-v1';
  private fallback: MasterDeskData | null = null;

  override load(): Observable<MasterDeskData> {
    return of(this.read());
  }

  override saveOrder(order: RepairOrder): Observable<RepairOrder> {
    const data = this.read();
    data.orders = [...data.orders.filter((item) => item.id !== order.id), order];
    this.write(data);
    return of(order);
  }

  override deleteOrder(id: number): Observable<void> {
    const data = this.read();
    data.orders = data.orders.filter((item) => item.id !== id);
    this.write(data);
    return of(void 0);
  }

  override saveClient(client: Client): Observable<Client> {
    const data = this.read();
    data.clients = [...data.clients.filter((item) => item.id !== client.id), client];
    this.write(data);
    return of(client);
  }

  override deleteClient(id: number): Observable<void> {
    const data = this.read();
    data.clients = data.clients.filter((item) => item.id !== id);
    this.write(data);
    return of(void 0);
  }

  override reset(): Observable<MasterDeskData> {
    const data = createDemoData();
    this.write(data);
    return of(data);
  }

  private read(): MasterDeskData {
    try {
      const stored = localStorage.getItem(this.key);
      if (stored) {
        const parsed: unknown = JSON.parse(stored);
        if (this.isData(parsed)) return parsed;
      }
    } catch {
      // Private browsing and disabled storage still allow a temporary demo session.
    }
    if (!this.fallback) {
      this.fallback = createDemoData();
      this.write(this.fallback);
    }
    return structuredClone(this.fallback);
  }

  private write(data: MasterDeskData): void {
    this.fallback = structuredClone(data);
    try {
      localStorage.setItem(this.key, JSON.stringify(data));
    } catch {
      // Continue with in-memory data when the browser cannot write LocalStorage.
    }
  }

  private isData(value: unknown): value is MasterDeskData {
    if (!value || typeof value !== 'object') return false;
    const data = value as Partial<MasterDeskData>;
    return Array.isArray(data.clients) && Array.isArray(data.technicians) && Array.isArray(data.orders);
  }
}
