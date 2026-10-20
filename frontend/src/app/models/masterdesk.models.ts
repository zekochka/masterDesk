export type OrderStatus = 'new' | 'diagnostics' | 'repair' | 'ready' | 'delivered';

export interface Client {
  id: number;
  fullName: string;
  phone: string;
  registeredAt: string;
}

export interface Technician {
  id: number;
  fullName: string;
  specialization: string;
}

export interface RepairOrder {
  id: number;
  number: string;
  clientId: number;
  deviceType: string;
  brand: string;
  model: string;
  problem: string;
  technicianId: number | null;
  estimatedCost: number;
  receivedAt: string;
  createdAt: string;
  status: OrderStatus;
}

export interface MasterDeskData {
  clients: Client[];
  technicians: Technician[];
  orders: RepairOrder[];
}

export const ORDER_STATUSES: { value: OrderStatus; label: string }[] = [
  { value: 'new', label: 'Новый' },
  { value: 'diagnostics', label: 'Диагностика' },
  { value: 'repair', label: 'В ремонте' },
  { value: 'ready', label: 'Готов' },
  { value: 'delivered', label: 'Выдан' },
];

export function statusLabel(status: OrderStatus): string {
  return ORDER_STATUSES.find((item) => item.value === status)?.label ?? status;
}

export function formatMoney(value: number): string {
  return `${new Intl.NumberFormat('ru-KZ').format(value)} ₸`;
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat('ru-KZ', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));
}

export function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('ru-KZ', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}
