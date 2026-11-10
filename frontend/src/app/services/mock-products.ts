import { Product } from '../models/masterdesk.models';

// Демонстрационный каталог. Цены и наличие не являются коммерческим предложением.
export const MOCK_PRODUCTS: Product[] = [
  { id: 1, name: 'Lenovo ThinkPad T14 Gen 2', category: 'Ноутбуки', condition: 'refurbished', specs: 'Intel Core i5, 16 ГБ RAM, SSD 512 ГБ', price: 225000, imageUrl: '/products/laptop.svg' },
  { id: 2, name: 'ASUS Vivobook 15', category: 'Ноутбуки', condition: 'new', specs: 'Intel Core i5, 8 ГБ RAM, SSD 512 ГБ', price: 319000, imageUrl: '/products/laptop.svg' },
  { id: 3, name: 'Samsung Galaxy A55', category: 'Смартфоны', condition: 'new', specs: '8 ГБ RAM, 256 ГБ, экран 6,6″', price: 189000, imageUrl: '/products/phone.svg' },
  { id: 4, name: 'Apple iPhone 13', category: 'Смартфоны', condition: 'refurbished', specs: '128 ГБ, экран 6,1″', price: 205000, imageUrl: '/products/phone.svg' },
  { id: 5, name: 'HP ProDesk 400 G6', category: 'Компьютеры', condition: 'refurbished', specs: 'Intel Core i5, 16 ГБ RAM, SSD 256 ГБ', price: 159000, imageUrl: '/products/desktop.svg' },
  { id: 6, name: 'Dell P2422H', category: 'Мониторы', condition: 'refurbished', specs: '23,8″, IPS, Full HD', price: 69000, imageUrl: '/products/monitor.svg' },
  { id: 7, name: 'Kingston NV2 1 ТБ', category: 'Комплектующие', condition: 'new', specs: 'SSD M.2 NVMe, PCIe 4.0', price: 36000, imageUrl: '/products/component.svg' },
  { id: 8, name: 'Logitech M185', category: 'Периферия', condition: 'new', specs: 'Беспроводная мышь, USB-приёмник', price: 8900, imageUrl: '/products/mouse.svg' },
];
