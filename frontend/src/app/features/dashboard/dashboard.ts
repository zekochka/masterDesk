import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink],
  templateUrl: './dashboard.html',
})
export class DashboardPage {
  readonly services = [
    'Диагностика техники',
    'Ремонт ноутбуков и компьютеров',
    'Обслуживание смартфонов',
    'Замена комплектующих',
    'Установка и настройка программного обеспечения',
    'Модернизация техники',
  ];
  readonly steps = [
    'Вы оставляете заявку',
    'Менеджер принимает обращение',
    'Мастер проводит диагностику и ремонт',
    'Вы получаете готовую технику',
  ];
}
