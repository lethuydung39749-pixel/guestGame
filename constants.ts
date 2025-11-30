
import { SodaBrand } from './types';

export const BRANDS: SodaBrand[] = [
  { 
    id: 'cola', 
    name: '经典可乐', 
    color: '#e11d48', // red-600
    accent: '#f43f5e', // red-500
    textColor: '#ffffff',
    icon: '可乐'
  },
  { 
    id: 'lime', 
    name: '激爽青柠', 
    color: '#16a34a', // green-600
    accent: '#22c55e', // green-500
    textColor: '#ffffff',
    icon: '青柠'
  },
  { 
    id: 'orange', 
    name: '阳光甜橙', 
    color: '#ea580c', // orange-600
    accent: '#f97316', // orange-500
    textColor: '#ffffff',
    icon: '甜橙'
  },
  { 
    id: 'grape', 
    name: '皇家葡萄', 
    color: '#7e22ce', // purple-600
    accent: '#9333ea', // purple-500
    textColor: '#ffffff',
    icon: '葡萄'
  },
  { 
    id: 'water', 
    name: '纯净矿泉', 
    color: '#0284c7', // sky-600
    accent: '#0ea5e9', // sky-500
    textColor: '#ffffff',
    icon: '矿泉'
  },
  { 
    id: 'energy', 
    name: '闪电能量', 
    color: '#eab308', // yellow-500
    accent: '#facc15', // yellow-400
    textColor: '#000000',
    icon: '能量'
  },
  { 
    id: 'peach', 
    name: '白桃乌龙', 
    color: '#f472b6', // pink-400
    accent: '#ec4899', // pink-500
    textColor: '#ffffff',
    icon: '白桃'
  },
  { 
    id: 'coffee', 
    name: '醇香拿铁', 
    color: '#78350f', // amber-900
    accent: '#92400e', // amber-800
    textColor: '#ffffff',
    icon: '拿铁'
  },
  { 
    id: 'mint', 
    name: '冰极薄荷', 
    color: '#0d9488', // teal-600
    accent: '#14b8a6', // teal-500
    textColor: '#ffffff',
    icon: '薄荷'
  },
  { 
    id: 'berry', 
    name: '蓝莓气泡', 
    color: '#4338ca', // indigo-700
    accent: '#6366f1', // indigo-500
    textColor: '#ffffff',
    icon: '蓝莓'
  }
];

// Default starting size
export const DEFAULT_GAME_SIZE = 5;
