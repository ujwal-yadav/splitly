import type { Ionicons } from '@expo/vector-icons';

export type GroupIconType = 'office' | 'university' | 'trip' | 'family' | 'flatmates' | 'gym';
export type CategoryType =
  'food' | 'transport' | 'coffee' | 'party' | 'shopping' | 'accommodation' | 'travel' | 'other';
export type GroupStatus = 'active' | 'settled' | 'archived';

export interface Member {
  id: string;
  name: string;
  email: string;
  isAdmin?: boolean;
}

export interface Group {
  id: string;
  name: string;
  icon: GroupIconType;
  image: string;
  type: string;
  memberCount: number;
  transactionCount: number;
  balance: number;
  status: GroupStatus;
}

export interface Transaction {
  id: string;
  groupId: string;
  groupName: string;
  title: string;
  amount: number;
  category: CategoryType;
  paidBy: string;
  date: string;
  yourShare: number;
  notes?: string;
  splitMethod: string;
  members: string[];
}

export interface Balance {
  name: string;
  amount: number;
}

export const GROUP_ICON_CONFIG: Record<
  GroupIconType,
  { icon: keyof typeof Ionicons.glyphMap; color: string; bg: string }
> = {
  office: { icon: 'business', color: '#1565C0', bg: '#E3F2FD' },
  university: { icon: 'school', color: '#E65100', bg: '#FFF3E0' },
  trip: { icon: 'airplane', color: '#1565C0', bg: '#E3F2FD' },
  family: { icon: 'home', color: '#E65100', bg: '#FFF3E0' },
  flatmates: { icon: 'bed', color: '#00838F', bg: '#E0F7FA' },
  gym: { icon: 'fitness', color: '#2E7D32', bg: '#E8F5E9' },
};

export const CATEGORY_CONFIG: Record<
  CategoryType,
  { icon: keyof typeof Ionicons.glyphMap; color: string; bg: string }
> = {
  food: { icon: 'restaurant', color: '#C62828', bg: '#FFEBEE' },
  transport: { icon: 'car', color: '#1565C0', bg: '#E3F2FD' },
  coffee: { icon: 'cafe', color: '#E65100', bg: '#FFF3E0' },
  party: { icon: 'wine', color: '#7B1FA2', bg: '#F3E5F5' },
  shopping: { icon: 'bag-handle', color: '#00838F', bg: '#E0F7FA' },
  accommodation: { icon: 'home', color: '#E6A817', bg: '#FFF8E1' },
  travel: { icon: 'airplane', color: '#7B1FA2', bg: '#F3E5F5' },
  other: { icon: 'ellipsis-horizontal', color: '#616161', bg: '#F5F5F5' },
};

export const GROUP_TYPE_OPTIONS = ['Office', 'Friends', 'Family', 'Couple', 'Trip', 'Other'];

export const GROUP_ICON_OPTIONS: GroupIconType[] = [
  'office',
  'university',
  'trip',
  'family',
  'flatmates',
  'gym',
];

export const MEMBERS: Member[] = [
  { id: '1', name: 'Ujwal', email: 'ujwal@gmail.com', isAdmin: true },
  { id: '2', name: 'Rohan', email: 'rohan@gmail.com' },
  { id: '3', name: 'Priya', email: 'priya@gmail.com' },
  { id: '4', name: 'Aman', email: 'aman@gmail.com' },
  { id: '5', name: 'Sneha', email: 'sneha@gmail.com' },
];

export const GROUPS: Group[] = [
  {
    id: '1',
    name: 'Office',
    icon: 'office',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=200&h=200&fit=crop',
    type: 'Office',
    memberCount: 4,
    transactionCount: 8,
    balance: -850,
    status: 'active',
  },
  {
    id: '2',
    name: 'University',
    icon: 'university',
    image: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=200&h=200&fit=crop',
    type: 'Friends',
    memberCount: 6,
    transactionCount: 12,
    balance: 1250,
    status: 'active',
  },
  {
    id: '3',
    name: 'Goa Trip',
    icon: 'trip',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=200&h=200&fit=crop',
    type: 'Trip',
    memberCount: 5,
    transactionCount: 7,
    balance: -550,
    status: 'active',
  },
  {
    id: '4',
    name: 'Family',
    icon: 'family',
    image: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=200&h=200&fit=crop',
    type: 'Family',
    memberCount: 4,
    transactionCount: 5,
    balance: 0,
    status: 'settled',
  },
  {
    id: '5',
    name: 'Flatmates',
    icon: 'flatmates',
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=200&h=200&fit=crop',
    type: 'Other',
    memberCount: 3,
    transactionCount: 4,
    balance: -220,
    status: 'active',
  },
  {
    id: '6',
    name: 'Gym',
    icon: 'gym',
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=200&h=200&fit=crop',
    type: 'Other',
    memberCount: 3,
    transactionCount: 3,
    balance: 180,
    status: 'active',
  },
];

export const TRANSACTIONS: Transaction[] = [
  {
    id: '1',
    groupId: '1',
    groupName: 'Office',
    title: 'Lunch at Bastian',
    amount: 4850,
    category: 'food',
    paidBy: 'Ujwal',
    date: 'Aug 24, 2026',
    yourShare: 970,
    notes: 'Team lunch after meeting',
    splitMethod: 'Equally',
    members: ['Ujwal', 'Rohan', 'Priya', 'Aman', 'Sneha'],
  },
  {
    id: '2',
    groupId: '1',
    groupName: 'Office',
    title: 'Uber to Office',
    amount: 1280,
    category: 'transport',
    paidBy: 'Rohan',
    date: 'Aug 23, 2026',
    yourShare: 320,
    notes: '',
    splitMethod: 'Equally',
    members: ['Ujwal', 'Rohan', 'Priya', 'Aman'],
  },
  {
    id: '3',
    groupId: '1',
    groupName: 'Office',
    title: 'Team Coffee',
    amount: 850,
    category: 'coffee',
    paidBy: 'Priya',
    date: 'Aug 20, 2026',
    yourShare: 212,
    notes: '',
    splitMethod: 'Equally',
    members: ['Ujwal', 'Rohan', 'Priya', 'Aman'],
  },
  {
    id: '4',
    groupId: '1',
    groupName: 'Office',
    title: 'Office Party',
    amount: 6400,
    category: 'party',
    paidBy: 'Aman',
    date: 'Aug 15, 2026',
    yourShare: 1280,
    notes: '',
    splitMethod: 'Equally',
    members: ['Ujwal', 'Rohan', 'Priya', 'Aman', 'Sneha'],
  },
];

export const BALANCES: Balance[] = [
  { name: 'You', amount: -850 },
  { name: 'Rohan', amount: 400 },
  { name: 'Priya', amount: -1250 },
  { name: 'Aman', amount: 300 },
  { name: 'Sneha', amount: -250 },
];

export type ActivityType = 'added' | 'settled' | 'edited';

export interface ActivityItem {
  id: string;
  type: ActivityType;
  person: string;
  description: string;
  amount: number;
  groupName: string;
  time: string;
  category?: CategoryType;
}

export const ACTIVITIES: ActivityItem[] = [
  {
    id: 'a1',
    type: 'added',
    person: 'Rohan',
    description: 'Lunch at Bastian',
    amount: 4850,
    groupName: 'Office',
    time: '10:24 AM',
    category: 'food',
  },
  {
    id: 'a2',
    type: 'settled',
    person: 'Priya',
    description: 'settled with you',
    amount: 800,
    groupName: 'University',
    time: '9:12 AM',
  },
  {
    id: 'a3',
    type: 'edited',
    person: 'Aman',
    description: 'Uber to Office',
    amount: 1280,
    groupName: 'Office',
    time: '8:41 AM',
    category: 'transport',
  },
  {
    id: 'a4',
    type: 'added',
    person: 'Sneha',
    description: 'Shopping',
    amount: 3400,
    groupName: 'University',
    time: '9:21 PM',
    category: 'shopping',
  },
  {
    id: 'a5',
    type: 'settled',
    person: 'You',
    description: 'settled with Rohan',
    amount: 1200,
    groupName: 'Gym',
    time: '6:15 PM',
  },
  {
    id: 'a6',
    type: 'added',
    person: 'Priya',
    description: 'Books',
    amount: 2300,
    groupName: 'University',
    time: '4:32 PM',
    category: 'shopping',
  },
];

export const TODAY_ACTIVITIES = ACTIVITIES.slice(0, 3);
export const YESTERDAY_ACTIVITIES = ACTIVITIES.slice(3);

export interface RecentActivity {
  id: string;
  title: string;
  groupName: string;
  date: string;
  amount: number;
  paidBy: string;
  category: CategoryType;
}

export const RECENT_ACTIVITIES: RecentActivity[] = [
  {
    id: 'r1',
    title: 'Dinner at Bastian',
    groupName: 'Goa Trip',
    date: 'Aug 24',
    amount: 4850,
    paidBy: 'You',
    category: 'food',
  },
  {
    id: 'r2',
    title: 'Uber to Airport',
    groupName: 'Goa Trip',
    date: 'Aug 23',
    amount: 1280,
    paidBy: 'You',
    category: 'transport',
  },
  {
    id: 'r3',
    title: 'Villa Stay',
    groupName: 'Goa Trip',
    date: 'Aug 20',
    amount: 12000,
    paidBy: 'Rohan',
    category: 'accommodation',
  },
  {
    id: 'r4',
    title: 'Flight Tickets',
    groupName: 'Goa Trip',
    date: 'Aug 18',
    amount: 8400,
    paidBy: 'You',
    category: 'travel',
  },
];

export const SETTLE_BALANCES: Balance[] = [
  { name: 'Rohan', amount: 400 },
  { name: 'Priya', amount: -1250 },
  { name: 'Aman', amount: 300 },
  { name: 'Sneha', amount: -250 },
];
