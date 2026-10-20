import { MasterDeskData, OrderStatus } from '../models/masterdesk.models';

function daysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

export function createDemoData(): MasterDeskData {
  const clients = [
    ['Айдана Сейдахметова', '+7 701 234 56 78'],
    ['Руслан Омаров', '+7 777 842 11 09'],
    ['Алия Тлеубаева', '+7 705 391 24 67'],
    ['Тимур Касымов', '+7 747 218 03 45'],
    ['Мария Волкова', '+7 702 905 70 12'],
    ['Данияр Ахметов', '+7 775 436 22 81'],
    ['Салтанат Нурланова', '+7 708 174 68 30'],
    ['Алексей Морозов', '+7 701 602 90 14'],
    ['Жанар Абдрахманова', '+7 776 309 41 55'],
  ].map(([fullName, phone], index) => ({ id: index + 1, fullName, phone, registeredAt: daysAgo(48 - index * 4) }));

  const technicians = [
    { id: 1, fullName: 'Арман Ибраев', specialization: 'Смартфоны и планшеты' },
    { id: 2, fullName: 'Елена Петрова', specialization: 'Ноутбуки и компьютеры' },
    { id: 3, fullName: 'Нурлан Беков', specialization: 'Бытовая техника' },
    { id: 4, fullName: 'Сергей Ким', specialization: 'Телевизоры и аудио' },
  ];

  const entries: [number, string, string, string, string, number | null, number, OrderStatus, number][] = [
    [1, 'Смартфон', 'Samsung', 'Galaxy S23', 'Не заряжается, нагревается разъём', 1, 18500, 'new', 0],
    [2, 'Ноутбук', 'Lenovo', 'ThinkPad E14', 'Не включается после обновления', 2, 42000, 'diagnostics', 1],
    [3, 'Смартфон', 'Apple', 'iPhone 13', 'Разбит экран и не работает сенсор', 1, 68000, 'repair', 2],
    [4, 'Планшет', 'Samsung', 'Galaxy Tab S8', 'Быстро разряжается аккумулятор', 1, 27500, 'ready', 3],
    [5, 'Ноутбук', 'ASUS', 'Vivobook 15', 'Шумит вентилятор и перегревается', 2, 31500, 'repair', 4],
    [6, 'Телевизор', 'LG', 'OLED C2', 'Нет изображения, звук работает', 4, 74500, 'diagnostics', 5],
    [7, 'Кофемашина', 'DeLonghi', 'Magnifica S', 'Протекает вода при работе', 3, 29000, 'delivered', 7],
    [8, 'Смартфон', 'Xiaomi', 'Redmi Note 12', 'Не работает микрофон', null, 14000, 'new', 0],
    [9, 'Ноутбук', 'HP', 'Pavilion 14', 'Замена клавиатуры', 2, 35500, 'ready', 9],
    [1, 'Пылесос', 'Dyson', 'V11', 'Потеря мощности всасывания', 3, 22000, 'delivered', 12],
    [5, 'Смартфон', 'Apple', 'iPhone 12', 'Замена аккумулятора', 1, 32000, 'repair', 14],
    [6, 'Монитор', 'Dell', 'P2419H', 'Мерцает экран', 4, 26000, 'delivered', 18],
  ];

  const year = new Date().getFullYear();
  const orders = entries.map(([clientId, deviceType, brand, model, problem, technicianId, estimatedCost, status, age], index) => ({
    id: index + 1,
    number: `MD-${year}-${String(index + 1).padStart(3, '0')}`,
    clientId,
    deviceType,
    brand,
    model,
    problem,
    technicianId,
    estimatedCost,
    receivedAt: daysAgo(age),
    createdAt: daysAgo(age),
    status,
  }));

  return { clients, technicians, orders };
}
