export enum SchoolCategory {
  UNIVERSITY = 'UNIVERSITY',
  COLLEGE = 'COLLEGE',
  SHS = 'SHS',
  JHS = 'JHS',
  TECHNICAL_VOCATIONAL = 'TECHNICAL_VOCATIONAL',
}

export enum SchoolGrade {
  A = 'A',
  B = 'B',
  C = 'C',
  D = 'D',
  UNGRADED = 'UNGRADED',
}

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  MIXED = 'MIXED',
}

export enum Residency {
  DAY = 'DAY',
  BOARDING = 'BOARDING',
  DAY_BOARDING = 'DAY_BOARDING',
}

export interface School {
  id: string;
  name: string;
  nickname?: string;
  category: SchoolCategory;
  region: string;
  district: string;
  location?: string;
  grade: SchoolGrade;
  gender: Gender;
  residency: Residency;
  email?: string;
  phone?: string;
  website?: string;
  boxAddress?: string;
  establishedYear?: number;
  studentPopulation?: number;
  programsOffered: string[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}
