export interface Bank {
  id: string;
  name: string;
  type: 'bank' | 'atm';
  code?: string;
  address: string;
  city: string;
  region: string;
  latitude: number;
  longitude: number;
  phone?: string;
  email?: string;
  website?: string;
  operatingHours?: string;
  services?: string[];
  branchInfo?: {
    branchCode?: string;
    isHeadOffice?: boolean;
    hasATM?: boolean;
    is24Hours?: boolean;
  };
}

export interface BankingFacility extends Bank {
  distance?: number;
  lastUpdated?: Date;
  dataSource?: string;
}

export interface ATMLocation {
  id: string;
  name: string;
  bank: string;
  address: string;
  city: string;
  region: string;
  latitude: number;
  longitude: number;
  is24Hours: boolean;
  services: string[];
  network: string[]; // e.g., ['Visa', 'MasterCard', 'GhIPSS']
  cashAvailable?: boolean;
  lastChecked?: Date;
}
