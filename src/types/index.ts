export interface Device {
  id: number;
  name: string;
  inventory_number: string;
  model: string;
  serial_number: string;
  user: string;
  department: string;
  status: 'in_use' | 'storage' | 'broken' | 'personal_use' | 'repair';
  category: 'ПК' | 'Ноутбук';
  office?: string;
  location?: string;
  cpu?: string;
  ram?: string;
  drives?: string;
  gpu?: string;
  monitor?: string;
  monitor2?: string;
  monitor_price?: number;
  monitor2_price?: number;
  price?: number;
  os?: string;
  created_at: string;
  updated_at: string;
}

export interface NetworkDevice {
  id: number;
  name: string;
  inventory_number: string;
  model: string;
  serial_number: string;
  ip_address: string;
  mac_address: string;
  status: 'online' | 'offline' | 'broken' | 'personal_use' | 'repair';
  location: string;
  department: string;
  created_at: string;
  updated_at: string;
}

export interface StorageItem {
  id: number;
  name: string;
  inventory_number: string;
  category: string;
  quantity: number;
  price?: number;
  last_check_date?: string;
  responsible_person: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface HistoryRecord {
  id: number;
  table_name: string;
  record_id: number;
  action: 'create' | 'update' | 'delete';
  field_name?: string;
  old_value?: string;
  new_value?: string;
  user: string;
  timestamp: string;
}

export interface Statistics {
  total_devices: number;
  devices_in_use: number;
  devices_in_storage: number;
  devices_personal_use: number;
  devices_repair: number;
  devices_broken: number;
  total_mfu: number;
  mfu_in_use: number;
  mfu_in_storage: number;
  total_server: number;
  server_in_use: number;
  server_in_storage: number;
  total_network_devices: number;
  network_devices_online: number;
  total_storage_items: number;
  storage_categories: number;
}

export interface Category {
  id: number;
  name: string;
  icon: string;
  color: string;
}

export interface Department {
  id: number;
  name: string;
  description?: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  department: string;
  role: 'admin' | 'user';
}

export interface Employee {
  id: number;
  name: string;
  department: string;
  position?: string;
  email?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

export interface MFUDevice {
  id: number;
  name: string;
  inventory_number: string;
  model: string;
  serial_number: string;
  user?: string;
  department?: string;
  status: 'in_use' | 'storage' | 'broken' | 'personal_use' | 'repair';
  category: string;
  price?: number;
  created_at: string;
  updated_at: string;
}

export interface ServerDevice {
  id: number;
  name: string;
  inventory_number: string;
  model: string;
  serial_number: string;
  user?: string;
  department?: string;
  status: 'in_use' | 'storage' | 'broken' | 'personal_use' | 'repair';
  category: string;
  price?: number;
  hard_disk_size?: number;
  hard_disk_count?: number;
  hard_disk_price?: number;
  hard_disks_details?: Array<{
    size: number;
    count: number;
    price: number;
    model?: string;
  }>;
  location?: string;
  created_at: string;
  updated_at: string;
}

export const DEPARTMENTS = [
  'IT отдел',
  'Бухгалтерия',
  'Отдел продаж',
  'HR отдел',
  'Склад',
]; 