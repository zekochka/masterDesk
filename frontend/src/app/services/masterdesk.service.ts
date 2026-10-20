import { computed, inject, Injectable, signal } from '@angular/core';
import { map, Observable, tap, throwError } from 'rxjs';
import { Client, MasterDeskData, OrderStatus, RepairOrder, Technician } from '../models/masterdesk.models';
import { MasterDeskDataSource } from './data-source';

@Injectable({ providedIn: 'root' })
export class MasterDeskService {
  private readonly source = inject(MasterDeskDataSource);
  readonly orders = signal<RepairOrder[]>([]);
  readonly clients = signal<Client[]>([]);
  readonly technicians = signal<Technician[]>([]);
  readonly totalOrders = computed(() => this.orders().length);

  constructor() {
    this.reload().subscribe();
  }

  reload(): Observable<MasterDeskData> {
    return this.source.load().pipe(tap((data) => this.setData(data)));
  }

  getOrder(id: number): RepairOrder | undefined {
    return this.orders().find((order) => order.id === id);
  }

  getClient(id: number): Client | undefined {
    return this.clients().find((client) => client.id === id);
  }

  getTechnician(id: number | null): Technician | undefined {
    return this.technicians().find((technician) => technician.id === id);
  }

  ordersForClient(id: number): RepairOrder[] {
    return this.orders().filter((order) => order.clientId === id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  activeCountForTechnician(id: number): number {
    return this.orders().filter((order) => order.technicianId === id && order.status !== 'ready' && order.status !== 'delivered').length;
  }

  saveOrder(input: Omit<RepairOrder, 'id' | 'number' | 'createdAt'>, id?: number): Observable<RepairOrder> {
    const current = id ? this.getOrder(id) : undefined;
    if (id && !current) return throwError(() => new Error('Заказ не найден'));
    const nextId = Math.max(0, ...this.orders().map((order) => order.id)) + 1;
    const order: RepairOrder = {
      ...input,
      id: current?.id ?? nextId,
      number: current?.number ?? `MD-${new Date().getFullYear()}-${String(nextId).padStart(3, '0')}`,
      createdAt: current?.createdAt ?? new Date().toISOString(),
    };
    return this.source.saveOrder(order).pipe(tap((saved) => this.orders.update((items) => [...items.filter((item) => item.id !== saved.id), saved])));
  }

  changeStatus(id: number, status: OrderStatus): Observable<RepairOrder> {
    const order = this.getOrder(id);
    if (!order) return throwError(() => new Error('Заказ не найден'));
    return this.source.saveOrder({ ...order, status }).pipe(tap((saved) => this.orders.update((items) => items.map((item) => item.id === id ? saved : item))));
  }

  deleteOrder(id: number): Observable<void> {
    return this.source.deleteOrder(id).pipe(tap(() => this.orders.update((items) => items.filter((item) => item.id !== id))));
  }

  saveClient(input: Pick<Client, 'fullName' | 'phone'>, id?: number): Observable<Client> {
    const current = id ? this.getClient(id) : undefined;
    if (id && !current) return throwError(() => new Error('Клиент не найден'));
    const phoneDigits = input.phone.replace(/\D/g, '');
    if (!/^7\d{10}$/.test(phoneDigits)) return throwError(() => new Error('Укажите номер телефона в формате +7'));
    if (this.clients().some((client) => client.id !== id && client.phone.replace(/\D/g, '') === phoneDigits)) {
      return throwError(() => new Error('Клиент с таким номером телефона уже существует'));
    }
    const client: Client = {
      ...input,
      id: current?.id ?? Math.max(0, ...this.clients().map((item) => item.id)) + 1,
      registeredAt: current?.registeredAt ?? new Date().toISOString(),
    };
    return this.source.saveClient(client).pipe(tap((saved) => this.clients.update((items) => [...items.filter((item) => item.id !== saved.id), saved])));
  }

  deleteClient(id: number): Observable<void> {
    if (this.orders().some((order) => order.clientId === id)) {
      return throwError(() => new Error('У клиента есть заказы. Сначала удалите связанные заказы.'));
    }
    return this.source.deleteClient(id).pipe(tap(() => this.clients.update((items) => items.filter((item) => item.id !== id))));
  }

  resetDemo(): Observable<void> {
    return this.source.reset().pipe(tap((data) => this.setData(data)), map(() => void 0));
  }

  private setData(data: MasterDeskData): void {
    this.clients.set(data.clients);
    this.technicians.set(data.technicians);
    this.orders.set(data.orders);
  }
}
