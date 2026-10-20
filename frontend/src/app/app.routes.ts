import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.DashboardPage), title: 'Главная — MasterDesk' },
  { path: 'orders', loadComponent: () => import('./features/orders/orders').then((m) => m.OrdersPage), title: 'Заказы — MasterDesk' },
  { path: 'orders/new', loadComponent: () => import('./features/orders/order-form').then((m) => m.OrderFormPage), title: 'Новый заказ — MasterDesk' },
  { path: 'orders/:id/edit', loadComponent: () => import('./features/orders/order-form').then((m) => m.OrderFormPage), title: 'Редактирование заказа — MasterDesk' },
  { path: 'orders/:id', loadComponent: () => import('./features/orders/order-detail').then((m) => m.OrderDetailPage), title: 'Заказ — MasterDesk' },
  { path: 'clients', loadComponent: () => import('./features/clients/clients').then((m) => m.ClientsPage), title: 'Клиенты — MasterDesk' },
  { path: 'technicians', loadComponent: () => import('./features/technicians/technicians').then((m) => m.TechniciansPage), title: 'Мастера — MasterDesk' },
  { path: 'settings', loadComponent: () => import('./features/settings/settings').then((m) => m.SettingsPage), title: 'Настройки — MasterDesk' },
  { path: '**', redirectTo: '' },
];
