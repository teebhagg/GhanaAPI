export const SCHOOL_CATEGORIES = [
  "UNIVERSITY",
  "COLLEGE",
  "SHS",
  "JHS",
  "TECHNICAL_VOCATIONAL",
] as const;

export type SchoolCategory = (typeof SCHOOL_CATEGORIES)[number];

export const SCHOOL_GRADES = ["A", "B", "C", "D", "UNGRADED"] as const;

export type SchoolGrade = (typeof SCHOOL_GRADES)[number];
