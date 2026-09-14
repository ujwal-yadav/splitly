export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type GroupRole = 'admin' | 'member';
export type SplitMethod = 'equal' | 'amount' | 'percentage';
export type SettlementStatus = 'pending' | 'confirmed';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Profile, 'id'>>;
      };
      groups: {
        Row: DbGroup;
        Insert: Omit<DbGroup, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<DbGroup, 'id'>>;
      };
      group_members: {
        Row: GroupMember;
        Insert: Omit<GroupMember, 'joined_at'>;
        Update: Partial<Omit<GroupMember, 'group_id' | 'user_id'>>;
      };
      expenses: {
        Row: Expense;
        Insert: Omit<Expense, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Expense, 'id'>>;
      };
      expense_splits: {
        Row: ExpenseSplit;
        Insert: Omit<ExpenseSplit, 'id'>;
        Update: Partial<Omit<ExpenseSplit, 'id'>>;
      };
      settlements: {
        Row: Settlement;
        Insert: Omit<Settlement, 'id' | 'created_at'>;
        Update: Partial<Omit<Settlement, 'id'>>;
      };
      payment_methods: {
        Row: PaymentMethod;
        Insert: Omit<PaymentMethod, 'id' | 'created_at'>;
        Update: Partial<Omit<PaymentMethod, 'id'>>;
      };
    };
  };
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  username: string | null;
  phone: string | null;
  avatar_url: string | null;
  currency: string;
  push_token: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbGroup {
  id: string;
  name: string;
  icon: string;
  type: string;
  image_url: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface GroupMember {
  group_id: string;
  user_id: string;
  role: GroupRole;
  joined_at: string;
}

export interface Expense {
  id: string;
  group_id: string;
  title: string;
  amount: number;
  currency: string;
  category: string;
  paid_by: string;
  split_method: SplitMethod;
  date: string;
  notes: string | null;
  receipt_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExpenseSplit {
  id: string;
  expense_id: string;
  user_id: string;
  amount: number;
  percentage: number | null;
  is_settled: boolean;
}

export interface Settlement {
  id: string;
  group_id: string;
  from_user: string;
  to_user: string;
  amount: number;
  currency: string;
  method: string;
  status: SettlementStatus;
  note: string | null;
  created_at: string;
}

export interface PaymentMethod {
  id: string;
  user_id: string;
  type: 'upi' | 'bank';
  label: string;
  detail: string;
  is_default: boolean;
  created_at: string;
}
