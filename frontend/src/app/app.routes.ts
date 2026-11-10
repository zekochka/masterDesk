import { inject } from '@angular/core';
import { CanActivateFn, Router, Routes } from '@angular/router';
import { AuthService } from './services/auth.service';

const requireRole = (role: 'User' | 'Master'): CanActivateFn => (_route, state) => {
  const user = inject(AuthService).user();
  const router = inject(Router);
  if (!user) return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  return user.role === role ? true : router.createUrlTree([user.role === 'Master' ? '/requests/available' : '/requests/my']);
};

export const routes: Routes = [
  { path: '', loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.DashboardPage), title: 'Главная — MasterDesk' },
  { path: 'shop', loadComponent: () => import('./features/shop/shop').then((m) => m.ShopPage), title: 'Магазин — MasterDesk' },
  { path: 'requests/new', canActivate: [requireRole('User')], loadComponent: () => import('./features/orders/order-form').then((m) => m.OrderFormPage), title: 'Создать заявку — MasterDesk' },
  { path: 'requests/my', canActivate: [requireRole('User')], loadComponent: () => import('./features/orders/orders').then((m) => m.OrdersPage), title: 'Мои заявки — MasterDesk' },
  { path: 'requests/available', canActivate: [requireRole('Master')], loadComponent: () => import('./features/orders/orders').then((m) => m.OrdersPage), title: 'Новые заявки — MasterDesk' },
  { path: 'requests/assigned', canActivate: [requireRole('Master')], loadComponent: () => import('./features/orders/orders').then((m) => m.OrdersPage), title: 'Мои ремонты — MasterDesk' },
  { path: 'settings', canActivate: [(_route, state) => inject(AuthService).user() ? true : inject(Router).createUrlTree(['/login'], { queryParams: { returnUrl: state.url } })], loadComponent: () => import('./features/settings/settings').then((m) => m.SettingsPage), title: 'Настройки — MasterDesk' },
  { path: 'login', loadComponent: () => import('./features/auth/auth').then((m) => m.AuthPage), title: 'Вход — MasterDesk' },
  { path: 'register', loadComponent: () => import('./features/auth/auth').then((m) => m.AuthPage), title: 'Регистрация — MasterDesk' },
  { path: '**', redirectTo: '' },
];
