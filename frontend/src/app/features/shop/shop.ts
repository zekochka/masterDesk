import { Component, computed, signal } from '@angular/core';
import { ProductCategory, ProductCondition, formatMoney } from '../../models/masterdesk.models';
import { MOCK_PRODUCTS } from '../../services/mock-products';

@Component({
  selector: 'app-shop',
  templateUrl: './shop.html',
})
export class ShopPage {
  readonly categories: ('Все товары' | ProductCategory)[] = ['Все товары', 'Ноутбуки', 'Смартфоны', 'Компьютеры', 'Мониторы', 'Комплектующие', 'Периферия'];
  readonly conditions: { label: string; value: 'all' | ProductCondition }[] = [
    { label: 'Все', value: 'all' }, { label: 'Новые', value: 'new' }, { label: 'Восстановленные', value: 'refurbished' },
  ];
  readonly category = signal<'Все товары' | ProductCategory>('Все товары');
  readonly condition = signal<'all' | ProductCondition>('all');
  readonly products = computed(() => MOCK_PRODUCTS.filter((product) =>
    (this.category() === 'Все товары' || product.category === this.category()) &&
    (this.condition() === 'all' || product.condition === this.condition())));
  readonly formatMoney = formatMoney;

  setCategory(value: string): void {
    this.category.set(value as 'Все товары' | ProductCategory);
  }

  setCondition(value: string): void {
    this.condition.set(value as 'all' | ProductCondition);
  }
}
