import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from '../../services/auth.service';
import { RepairRequestService } from '../../services/repair-request.service';
import { NotificationService } from '../../shared/notification.service';
import { OrderFormPage } from './order-form';

describe('OrderFormPage', () => {
  const create = vi.fn();
  const success = vi.fn();
  const error = vi.fn();
  let page: OrderFormPage;
  let router: Router;

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      imports: [OrderFormPage],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { user: () => ({ id: 'user-1' }) } },
        { provide: RepairRequestService, useValue: { create } },
        { provide: NotificationService, useValue: { success, error } },
      ],
    });
    page = TestBed.createComponent(OrderFormPage).componentInstance;
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
  });

  it('rejects a short phone number without creating a request', () => {
    page.form.setValue({
      deviceType: 'Ноутбук', brandModel: 'ThinkPad', problem: 'Не включается',
      phone: '123 456 789', comment: '',
    });

    page.submit();

    expect(page.form.controls.phone.hasError('pattern')).toBe(true);
    expect(create).not.toHaveBeenCalled();
    expect(error).toHaveBeenCalledWith('Проверьте обязательные поля заявки');
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('creates a request for the current user with trimmed fields and navigates', () => {
    page.form.setValue({
      deviceType: 'Ноутбук', brandModel: ' ThinkPad ', problem: ' Не включается ',
      phone: '+7 700 000 00 00 ', comment: ' После 18:00 ',
    });

    page.submit();

    expect(create).toHaveBeenCalledWith({
      userId: 'user-1', deviceType: 'Ноутбук', brandModel: 'ThinkPad',
      problem: 'Не включается', phone: '+7 700 000 00 00', comment: 'После 18:00',
    });
    expect(success).toHaveBeenCalledWith('Заявка отправлена');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/requests/my');
  });
});
