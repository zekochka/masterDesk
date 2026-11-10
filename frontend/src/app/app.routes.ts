import { inject } from '@angular/core';
import { CanActivateFn, Router, Routes } from '@angular/router';
import { AuthService } from './services/auth.service';

const requireUser: CanActivateFn = (_route, state) => inject(AuthService).user()
  ? true
  : inject(Router).createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });

export const routes: Routes = [
  { path: '', loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.DashboardPage), title: 'Главная — MasterDesk' },
  { path: 'shop', loadComponent: () => import('./features/shop/shop').then((m) => m.ShopPage), title: 'Магазин — MasterDesk' },
  { path: 'requests/new', canActivate: [requireUser], loadComponent: () => import('./features/orders/order-form').then((m) => m.OrderFormPage), title: 'Создать заявку — MasterDesk' },
  { path: 'requests/my', canActivate: [requireUser], loadComponent: () => import('./features/orders/orders').then((m) => m.OrdersPage), title: 'Мои заявки — MasterDesk' },
  { path: 'settings', canActivate: [requireUser], loadComponent: () => import('./features/settings/settings').then((m) => m.SettingsPage), title: 'Настройки — MasterDesk' },
  { path: 'login', loadComponent: () => import('./features/auth/auth').then((m) => m.AuthPage), title: 'Вход — MasterDesk' },
  { path: 'register', loadComponent: () => import('./features/auth/auth').then((m) => m.AuthPage), title: 'Регистрация — MasterDesk' },
  { path: '**', redirectTo: '' },
];
