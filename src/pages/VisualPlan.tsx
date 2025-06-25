import React, { useState, useEffect } from 'react';
import { MapPin, Monitor, Server, Building, Wifi, Package, Edit3, Save, X, Plus, Trash2, Layers, Home, ArrowUp, ArrowDown } from 'lucide-react';
import { Device, ServerDevice, NetworkDevice, MFUDevice } from '../types';

interface Floor {
  id: string;
  name: string;
  level: number;
  rooms: Room[];
}

interface Room {
  id: string;
  name: string;
  type: 'office' | 'server' | 'storage' | 'network' | 'meeting' | 'corridor' | 'stairs' | 'elevator';
  x: number;
  y: number;
  width: number;
  height: number;
  devices: Array<{
    id: number;
    type: 'device' | 'server' | 'network' | 'mfu';
    name: string;
    status: string;
    x: number;
    y: number;
  }>;
}

const VisualPlan: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [servers, setServers] = useState<ServerDevice[]>([]);
  const [networkDevices, setNetworkDevices] = useState<NetworkDevice[]>([]);
  const [mfuDevices, setMfuDevices] = useState<MFUDevice[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [currentFloor, setCurrentFloor] = useState<string>('floor-1');
  const [draggedRoom, setDraggedRoom] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showFloorSelector, setShowFloorSelector] = useState(false);
  const [editingFloor, setEditingFloor] = useState<Floor | null>(null);

  // Загрузка данных
  useEffect(() => {
    const loadData = async () => {
      try {
        const [devicesRes, serversRes, networkRes, mfuRes] = await Promise.all([
          fetch('/api/devices'),
          fetch('/api/server-equipment'),
          fetch('/api/network-devices'),
          fetch('/api/mfu-devices')
        ]);

        if (devicesRes.ok) setDevices(await devicesRes.json());
        if (serversRes.ok) setServers(await serversRes.json());
        if (networkRes.ok) setNetworkDevices(await networkRes.json());
        if (mfuRes.ok) setMfuDevices(await mfuRes.json());
      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
      }
    };

    loadData();
  }, []);

  // Инициализация этажей
  useEffect(() => {
    const initialFloors: Floor[] = [
      {
        id: 'floor-1',
        name: '1 этаж',
        level: 1,
        rooms: [
          {
            id: 'office-1',
            name: 'Офис 1',
            type: 'office',
            x: 50,
            y: 50,
            width: 200,
            height: 150,
            devices: devices
              .filter(d => d.office === 'Офис 1')
              .map(d => ({
                id: d.id,
                type: 'device' as const,
                name: d.name,
                status: d.status,
                x: 10 + Math.random() * 80,
                y: 10 + Math.random() * 80
              }))
          },
          {
            id: 'office-2',
            name: 'Офис 2',
            type: 'office',
            x: 300,
            y: 50,
            width: 200,
            height: 150,
            devices: devices
              .filter(d => d.office === 'Офис 2')
              .map(d => ({
                id: d.id,
                type: 'device' as const,
                name: d.name,
                status: d.status,
                x: 10 + Math.random() * 80,
                y: 10 + Math.random() * 80
              }))
          },
          {
            id: 'corridor-1',
            name: 'Коридор',
            type: 'corridor',
            x: 250,
            y: 200,
            width: 100,
            height: 30,
            devices: []
          },
          {
            id: 'stairs-1',
            name: 'Лестница',
            type: 'stairs',
            x: 500,
            y: 200,
            width: 60,
            height: 100,
            devices: []
          }
        ]
      },
      {
        id: 'floor-2',
        name: '2 этаж',
        level: 2,
        rooms: [
          {
            id: 'tsh1',
            name: 'ТШ1',
            type: 'server',
            x: 50,
            y: 50,
            width: 150,
            height: 120,
            devices: servers
              .filter(s => s.location?.includes('ТШ1'))
              .map(s => ({
                id: s.id,
                type: 'server' as const,
                name: s.name,
                status: s.status,
                x: 10 + Math.random() * 60,
                y: 10 + Math.random() * 60
              }))
          },
          {
            id: 'tsh2',
            name: 'ТШ2',
            type: 'server',
            x: 250,
            y: 50,
            width: 150,
            height: 120,
            devices: servers
              .filter(s => s.location?.includes('ТШ2'))
              .map(s => ({
                id: s.id,
                type: 'server' as const,
                name: s.name,
                status: s.status,
                x: 10 + Math.random() * 60,
                y: 10 + Math.random() * 60
              }))
          },
          {
            id: 'network-room',
            name: 'Сетевая комната',
            type: 'network',
            x: 450,
            y: 50,
            width: 120,
            height: 120,
            devices: networkDevices
              .filter(n => n.location?.includes('Сетевая'))
              .map(n => ({
                id: n.id,
                type: 'network' as const,
                name: n.name,
                status: n.status,
                x: 10 + Math.random() * 40,
                y: 10 + Math.random() * 40
              }))
          },
          {
            id: 'storage',
            name: 'Склад',
            type: 'storage',
            x: 50,
            y: 200,
            width: 300,
            height: 100,
            devices: mfuDevices
              .filter(m => m.status === 'storage')
              .map(m => ({
                id: m.id,
                type: 'mfu' as const,
                name: m.name,
                status: m.status,
                x: 10 + Math.random() * 120,
                y: 10 + Math.random() * 40
              }))
          }
        ]
      }
    ];
    setFloors(initialFloors);
  }, [devices, servers, networkDevices, mfuDevices]);

  const currentFloorData = floors.find(f => f.id === currentFloor);
  const rooms = currentFloorData?.rooms || [];

  const getRoomColor = (type: string) => {
    switch (type) {
      case 'office': return 'bg-blue-100 border-blue-300';
      case 'server': return 'bg-red-100 border-red-300';
      case 'network': return 'bg-green-100 border-green-300';
      case 'storage': return 'bg-yellow-100 border-yellow-300';
      case 'corridor': return 'bg-gray-100 border-gray-300';
      case 'stairs': return 'bg-purple-100 border-purple-300';
      case 'elevator': return 'bg-orange-100 border-orange-300';
      case 'meeting': return 'bg-indigo-100 border-indigo-300';
      default: return 'bg-gray-100 border-gray-300';
    }
  };

  const getRoomIcon = (type: string) => {
    switch (type) {
      case 'office': return <Building className="w-4 h-4" />;
      case 'server': return <Server className="w-4 h-4" />;
      case 'network': return <Wifi className="w-4 h-4" />;
      case 'storage': return <Package className="w-4 h-4" />;
      case 'corridor': return <MapPin className="w-4 h-4" />;
      case 'stairs': return <ArrowUp className="w-4 h-4" />;
      case 'elevator': return <ArrowDown className="w-4 h-4" />;
      case 'meeting': return <Building className="w-4 h-4" />;
      default: return <MapPin className="w-4 h-4" />;
    }
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'device': return <Monitor className="w-3 h-3" />;
      case 'server': return <Server className="w-3 h-3" />;
      case 'network': return <Wifi className="w-3 h-3" />;
      case 'mfu': return <Package className="w-3 h-3" />;
      default: return <MapPin className="w-3 h-3" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_use': return 'bg-green-500';
      case 'storage': return 'bg-yellow-500';
      case 'broken': return 'bg-red-500';
      case 'repair': return 'bg-orange-500';
      case 'online': return 'bg-green-500';
      case 'offline': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.5));

  // Функции редактирования помещений
  const handleEditRoom = (room: Room) => {
    setEditingRoom(room);
  };

  const handleSaveRoom = () => {
    if (editingRoom) {
      setFloors(prev => prev.map(floor => 
        floor.id === currentFloor 
          ? {
              ...floor,
              rooms: floor.rooms.map(room => 
                room.id === editingRoom.id ? editingRoom : room
              )
            }
          : floor
      ));
      setEditingRoom(null);
    }
  };

  const handleDeleteRoom = (roomId: string) => {
    setFloors(prev => prev.map(floor => 
      floor.id === currentFloor 
        ? {
            ...floor,
            rooms: floor.rooms.filter(room => room.id !== roomId)
          }
        : floor
    ));
    setSelectedRoom(null);
  };

  const handleAddRoom = () => {
    const newRoom: Room = {
      id: `room-${Date.now()}`,
      name: 'Новое помещение',
      type: 'office',
      x: 100,
      y: 100,
      width: 150,
      height: 100,
      devices: []
    };
    
    setFloors(prev => prev.map(floor => 
      floor.id === currentFloor 
        ? {
            ...floor,
            rooms: [...floor.rooms, newRoom]
          }
        : floor
    ));
    setEditingRoom(newRoom);
  };

  // Функции управления этажами
  const handleAddFloor = () => {
    const newFloor: Floor = {
      id: `floor-${Date.now()}`,
      name: `${floors.length + 1} этаж`,
      level: floors.length + 1,
      rooms: []
    };
    setFloors(prev => [...prev, newFloor]);
    setCurrentFloor(newFloor.id);
    setEditingFloor(newFloor);
  };

  const handleEditFloor = (floor: Floor) => {
    setEditingFloor(floor);
  };

  const handleSaveFloor = () => {
    if (editingFloor) {
      setFloors(prev => prev.map(floor => 
        floor.id === editingFloor.id ? editingFloor : floor
      ));
      setEditingFloor(null);
    }
  };

  const handleDeleteFloor = (floorId: string) => {
    const newFloors = floors.filter(floor => floor.id !== floorId);
    setFloors(newFloors);
    
    if (currentFloor === floorId && newFloors.length > 0) {
      setCurrentFloor(newFloors[0].id);
    }
  };

  // Drag & Drop для помещений
  const handleMouseDown = (e: React.MouseEvent, roomId: string) => {
    if (!isEditMode) return;
    
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    
    setDraggedRoom(roomId);
    setDragOffset({ x: offsetX, y: offsetY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggedRoom || !isEditMode) return;

    const container = e.currentTarget.getBoundingClientRect();
    const newX = e.clientX - container.left - dragOffset.x;
    const newY = e.clientY - container.top - dragOffset.y;

    setFloors(prev => prev.map(floor => 
      floor.id === currentFloor 
        ? {
            ...floor,
            rooms: floor.rooms.map(room => 
              room.id === draggedRoom 
                ? { ...room, x: Math.max(0, newX), y: Math.max(0, newY) }
                : room
            )
          }
        : floor
    ));
  };

  const handleMouseUp = () => {
    setDraggedRoom(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Заголовок */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <Building className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Визуальный план (БЕТА)
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {isEditMode ? 'Режим редактирования' : 'Интерактивная карта помещений и оборудования'}
                </p>
              </div>
            </div>
            
            {/* Элементы управления */}
            <div className="flex items-center space-x-4">
              {/* Селектор этажей */}
              <div className="relative">
                <button
                  onClick={() => setShowFloorSelector(!showFloorSelector)}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <Layers className="w-4 h-4" />
                  <span>{currentFloorData?.name || 'Выберите этаж'}</span>
                </button>
                
                {showFloorSelector && (
                  <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                          Этажи
                        </h3>
                        {isEditMode && (
                          <button
                            onClick={handleAddFloor}
                            className="p-1 text-blue-600 hover:text-blue-700"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {floors.map((floor) => (
                          <div
                            key={floor.id}
                            className={`flex items-center justify-between p-2 rounded cursor-pointer ${
                              currentFloor === floor.id 
                                ? 'bg-blue-100 dark:bg-blue-900' 
                                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                            onClick={() => {
                              setCurrentFloor(floor.id);
                              setShowFloorSelector(false);
                            }}
                          >
                            <div className="flex items-center space-x-2">
                              <Home className="w-4 h-4 text-gray-500" />
                              <span className="text-sm text-gray-700 dark:text-gray-300">
                                {floor.name}
                              </span>
                            </div>
                            
                            {isEditMode && (
                              <div className="flex space-x-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditFloor(floor);
                                  }}
                                  className="p-1 text-blue-600 hover:text-blue-700"
                                >
                                  <Edit3 className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteFloor(floor.id);
                                  }}
                                  className="p-1 text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {isEditMode && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleAddRoom}
                    className="btn-primary flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Добавить помещение</span>
                  </button>
                </div>
              )}
              
              <div className="flex items-center space-x-2 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-2">
                <button
                  onClick={handleZoomOut}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
                >
                  <span className="text-lg">−</span>
                </button>
                <span className="text-sm text-gray-600 dark:text-gray-300 min-w-[40px] text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={handleZoomIn}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
                >
                  <span className="text-lg">+</span>
                </button>
              </div>

              <button
                onClick={() => setIsEditMode(!isEditMode)}
                className={`btn-primary flex items-center space-x-2 ${
                  isEditMode ? 'bg-green-600 hover:bg-green-700' : ''
                }`}
              >
                {isEditMode ? (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Сохранить</span>
                  </>
                ) : (
                  <>
                    <Edit3 className="w-4 h-4" />
                    <span>Редактировать</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Легенда */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded"></div>
              <span className="text-gray-700 dark:text-gray-300">Офисы</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
              <span className="text-gray-700 dark:text-gray-300">Серверные</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
              <span className="text-gray-700 dark:text-gray-300">Сетевая инфраструктура</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded"></div>
              <span className="text-gray-700 dark:text-gray-300">Склад</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded"></div>
              <span className="text-gray-700 dark:text-gray-300">Коридоры</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-purple-100 border border-purple-300 rounded"></div>
              <span className="text-gray-700 dark:text-gray-300">Лестницы</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-gray-700 dark:text-gray-300">В работе</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-gray-700 dark:text-gray-300">На складе</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-gray-700 dark:text-gray-300">Неисправно</span>
            </div>
            {isEditMode && (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-blue-600 dark:text-blue-400 font-medium">Режим редактирования</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* План помещений */}
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div 
            className="relative bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
            style={{ 
              transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
              transformOrigin: 'top left',
              transition: 'transform 0.2s ease-in-out'
            }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            {/* Сетка */}
            <div className="absolute inset-0 opacity-10">
              <svg width="100%" height="100%">
                <defs>
                  <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="1"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
            </div>

            {/* Помещения */}
            {rooms.map((room) => (
              <div
                key={room.id}
                className={`absolute border-2 rounded-lg transition-all duration-200 ${
                  isEditMode ? 'cursor-move' : 'cursor-pointer'
                } ${
                  selectedRoom === room.id 
                    ? 'ring-4 ring-blue-500 ring-opacity-50' 
                    : 'hover:ring-2 hover:ring-blue-300'
                } ${getRoomColor(room.type)} ${
                  draggedRoom === room.id ? 'z-50 shadow-2xl' : ''
                }`}
                style={{
                  left: `${room.x}px`,
                  top: `${room.y}px`,
                  width: `${room.width}px`,
                  height: `${room.height}px`
                }}
                onMouseDown={(e) => handleMouseDown(e, room.id)}
                onClick={() => !isEditMode && setSelectedRoom(selectedRoom === room.id ? null : room.id)}
              >
                {/* Название помещения */}
                <div className="absolute top-2 left-2 right-2">
                  <div className="flex items-center space-x-1">
                    {getRoomIcon(room.type)}
                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
                      {room.name}
                    </h3>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {room.devices.length} устройств
                  </p>
                </div>

                {/* Кнопки редактирования */}
                {isEditMode && (
                  <div className="absolute top-2 right-2 flex space-x-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditRoom(room);
                      }}
                      className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                      title="Редактировать"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteRoom(room.id);
                      }}
                      className="p-1 bg-red-500 text-white rounded hover:bg-red-600"
                      title="Удалить"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {/* Устройства в помещении */}
                {room.devices.map((device) => (
                  <div
                    key={device.id}
                    className="absolute group"
                    style={{
                      left: `${device.x}%`,
                      top: `${device.y}%`
                    }}
                  >
                    <div className="relative">
                      <div className="flex items-center justify-center w-6 h-6 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-full shadow-sm hover:shadow-md transition-shadow">
                        {getDeviceIcon(device.type)}
                        <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${getStatusColor(device.status)}`}></div>
                      </div>
                      
                      {/* Тултип */}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                        {device.name}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}

            {/* Размеры плана */}
            <div className="absolute bottom-4 right-4 text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-2 py-1 rounded border">
              Масштаб: 1:100 | {currentFloorData?.name}
            </div>
          </div>
        </div>
      </div>

      {/* Модальное окно редактирования помещения */}
      {editingRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Редактировать помещение
              </h3>
              <button
                onClick={() => setEditingRoom(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Название
                </label>
                <input
                  type="text"
                  value={editingRoom.name}
                  onChange={(e) => setEditingRoom(prev => prev ? { ...prev, name: e.target.value } : null)}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Тип
                </label>
                <select
                  value={editingRoom.type}
                  onChange={(e) => setEditingRoom(prev => prev ? { ...prev, type: e.target.value as any } : null)}
                  className="input-field"
                >
                  <option value="office">Офис</option>
                  <option value="server">Серверная</option>
                  <option value="network">Сетевая инфраструктура</option>
                  <option value="storage">Склад</option>
                  <option value="meeting">Переговорная</option>
                  <option value="corridor">Коридор</option>
                  <option value="stairs">Лестница</option>
                  <option value="elevator">Лифт</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    X позиция
                  </label>
                  <input
                    type="number"
                    value={editingRoom.x}
                    onChange={(e) => setEditingRoom(prev => prev ? { ...prev, x: parseInt(e.target.value) || 0 } : null)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Y позиция
                  </label>
                  <input
                    type="number"
                    value={editingRoom.y}
                    onChange={(e) => setEditingRoom(prev => prev ? { ...prev, y: parseInt(e.target.value) || 0 } : null)}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Ширина
                  </label>
                  <input
                    type="number"
                    value={editingRoom.width}
                    onChange={(e) => setEditingRoom(prev => prev ? { ...prev, width: parseInt(e.target.value) || 0 } : null)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Высота
                  </label>
                  <input
                    type="number"
                    value={editingRoom.height}
                    onChange={(e) => setEditingRoom(prev => prev ? { ...prev, height: parseInt(e.target.value) || 0 } : null)}
                    className="input-field"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setEditingRoom(null)}
                className="btn-secondary"
              >
                Отмена
              </button>
              <button
                onClick={handleSaveRoom}
                className="btn-primary"
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно редактирования этажа */}
      {editingFloor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Редактировать этаж
              </h3>
              <button
                onClick={() => setEditingFloor(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Название
                </label>
                <input
                  type="text"
                  value={editingFloor.name}
                  onChange={(e) => setEditingFloor(prev => prev ? { ...prev, name: e.target.value } : null)}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Уровень
                </label>
                <input
                  type="number"
                  value={editingFloor.level}
                  onChange={(e) => setEditingFloor(prev => prev ? { ...prev, level: parseInt(e.target.value) || 1 } : null)}
                  className="input-field"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setEditingFloor(null)}
                className="btn-secondary"
              >
                Отмена
              </button>
              <button
                onClick={handleSaveFloor}
                className="btn-primary"
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Панель информации о выбранном помещении */}
      {selectedRoom && !isEditMode && (
        <div className="fixed bottom-4 left-4 right-4 max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {rooms.find(r => r.id === selectedRoom)?.name}
            </h3>
            <button
              onClick={() => setSelectedRoom(null)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-2">
            {rooms.find(r => r.id === selectedRoom)?.devices.map((device) => (
              <div key={device.id} className="flex items-center space-x-2 text-sm">
                {getDeviceIcon(device.type)}
                <span className="text-gray-700 dark:text-gray-300 flex-1 truncate">
                  {device.name}
                </span>
                <div className={`w-2 h-2 rounded-full ${getStatusColor(device.status)}`}></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default VisualPlan; 