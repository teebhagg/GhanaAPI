import type { Prisma } from '@prisma/client';
import axios from 'axios';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import * as pdfParser from 'pdf-parse';
import {
  Gender,
  Residency,
  School,
  SchoolCategory,
  SchoolGrade,
} from '../entities/school.entity';

async function parsePdf(buffer: Buffer | Uint8Array): Promise<string> {
  const moduleAny = pdfParser as unknown as {
    PDFParse?: new (options: { data: Buffer | Uint8Array }) => {
      getText: () => Promise<{ text: string }>;
      destroy: () => Promise<void>;
    };
  };

  if (!moduleAny?.PDFParse) {
    throw new TypeError('pdf-parse module did not expose PDFParse constructor');
  }

  const parser = new moduleAny.PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return result.text ?? '';
  } finally {
    await parser.destroy();
  }
}

const GES_SCHOOL_LIST_URL =
  'https://ges.gov.gh/wp-content/uploads/2020/08/SHSTVET_SCHOOLS.pdf';
const GES_DOUBLE_TRACK_URL =
  'https://ges.gov.gh/wp-content/uploads/2019/07/doubletrack.pdf';

const ALWAYS_UPPER = new Set(
  [
    'SHS',
    'JHS',
    'TVET',
    'SSS',
    'SDA',
    'RC',
    'T.I.',
    'J.H.S',
    'S.H.S',
    'S/D/A',
    'R/C',
  ].map((token) => token.toUpperCase()),
);

const PROGRAMS_SENIOR_HIGH = [
  'General Science',
  'General Arts',
  'Business',
  'Home Economics',
  'Visual Arts',
];

const PROGRAMS_TECH_VOC = [
  'Technical',
  'Engineering',
  'Business',
  'Applied Sciences',
];

const regionDataPath = path.resolve(
  __dirname,
  '../../locations/data/regions.json',
);

interface RegionsFile {
  status: boolean;
  regions: Array<{
    code: string;
    label: string;
    capital: string;
    districts: Array<{
      code: string;
      label: string;
      category: string;
      capital: string;
    }>;
  }>;
}

interface ParsedSchool
  extends Omit<School, 'id' | 'createdAt' | 'updatedAt' | 'metadata'> {
  metadata: Record<string, unknown>;
}

interface DistrictPattern {
  label: string;
  category: string;
  display: string;
  patterns: string[];
}

interface RegionPattern {
  label: string;
  uppercaseVariants: string[];
  districts: DistrictPattern[];
}

const regionsJson = JSON.parse(
  readFileSync(regionDataPath, 'utf-8'),
) as RegionsFile;

const REGION_PATTERNS: RegionPattern[] = regionsJson.regions.map((region) => {
  const baseLabel = normalizeSpaces(region.label.replace(/\s+Region$/i, ''));
  const titleLabel = toTitleCase(baseLabel);
  const uppercaseBase = baseLabel.toUpperCase();
  const uppercaseWithRegion = normalizeSpaces(region.label.toUpperCase());
  const uppercaseVariants = Array.from(
    new Set([uppercaseBase, uppercaseWithRegion]),
  );

  return {
    label: titleLabel,
    uppercaseVariants,
    districts: region.districts.map((district) => {
      const labelUpper = normalizeSpaces(
        district.label.toUpperCase().replace(/-/g, ' '),
      );
      const suffixes = getCategorySuffixes(district.category);
      const patterns = [
        labelUpper,
        ...suffixes.map((suffix) => `${labelUpper} ${suffix}`),
      ];

      return {
        label: district.label,
        category: district.category,
        display: formatDistrictDisplay(district.label, district.category),
        patterns: patterns.map(normalizeSpaces),
      };
    }),
  };
});

const REGION_LOOKUP = new Map(
  REGION_PATTERNS.flatMap((region) =>
    region.uppercaseVariants.map((variant) => [variant, region] as const),
  ),
);

const REGION_NAMES = Array.from(REGION_LOOKUP.keys()).sort(
  (a, b) => b.length - a.length,
);

const SCHOOL_END_KEYWORDS = new Set([
  'SCHOOL',
  'COLLEGE',
  'UNIVERSITY',
  'INSTITUTE',
  'ACADEMY',
  'POLYTECHNIC',
  'LYCEUM',
  'TRAINING',
  'COMPLEX',
  'CENTRE',
  'CENTER',
]);

function normalizeSpaces(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function getCategorySuffixes(category: string): string[] {
  const lower = category.toLowerCase();
  switch (lower) {
    case 'municipal':
      return ['MUNICIPAL'];
    case 'district':
      return ['DISTRICT'];
    case 'metropolitan':
      return ['METROPOLIS', 'METROPOLITAN'];
    case 'municipality':
      return ['MUNICIPALITY'];
    default:
      return [category.toUpperCase()];
  }
}

function formatDistrictDisplay(label: string, category: string): string {
  const categoryWord = (() => {
    switch (category.toLowerCase()) {
      case 'municipal':
        return 'Municipal';
      case 'district':
        return 'District';
      case 'metropolitan':
        return 'Metropolis';
      case 'municipality':
        return 'Municipality';
      default:
        return toTitleCase(category);
    }
  })();

  const upperLabel = label.toUpperCase();
  if (upperLabel.includes(categoryWord.toUpperCase())) {
    return toTitleCase(label);
  }
  return `${toTitleCase(label)} ${categoryWord}`;
}

async function downloadPdf(url: string): Promise<Buffer> {
  const response = await axios.get<ArrayBuffer>(url, {
    responseType: 'arraybuffer',
  });
  return Buffer.from(response.data);
}

function toTitleCase(value: string): string {
  return value
    .split(/\s+/)
    .map((word) => toTitleCaseWord(word))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function toTitleCaseWord(word: string): string {
  if (!word) {
    return word;
  }

  const cleaned = word.replace(/[^A-Z0-9.'/-]/gi, '');
  if (ALWAYS_UPPER.has(cleaned.toUpperCase())) {
    return cleaned.toUpperCase();
  }

  if (cleaned.includes('-')) {
    return cleaned
      .split('-')
      .map((segment) => toTitleCaseWord(segment))
      .join('-');
  }

  if (cleaned.includes('/')) {
    return cleaned
      .split('/')
      .map((segment) => toTitleCaseWord(segment))
      .join('/');
  }

  if (cleaned.length <= 3) {
    return cleaned.toUpperCase();
  }

  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
}

function normalizeName(value: string): string {
  return value.replace(/[^A-Z0-9]/gi, '').toUpperCase();
}

function determineCategory(name: string): SchoolCategory {
  const upper = name.toUpperCase();

  if (upper.includes('UNIVERSITY')) return SchoolCategory.UNIVERSITY;
  if (upper.includes('COLLEGE')) return SchoolCategory.COLLEGE;
  if (upper.includes('JHS') || upper.includes('JUNIOR')) {
    return SchoolCategory.JHS;
  }
  if (
    upper.includes('TECH') ||
    upper.includes('VOCATIONAL') ||
    upper.includes('AGRIC') ||
    upper.includes('INSTITUTE')
  ) {
    return SchoolCategory.TECHNICAL_VOCATIONAL;
  }
  return SchoolCategory.SHS;
}

function assignGrade(name: string, region: string): SchoolGrade {
  const upperName = name.toUpperCase();

  const categoryA = [
    'ACHIMOTA',
    'PREMPEH',
    'OPOKU WARE',
    'WESLEY GIRLS',
    'HOLY CHILD',
    'MFANTSIPIM',
    'GHANA NATIONAL',
    'ST. AUGUSTINE',
    'ADISADEL',
    'ARCHBISHOP PORTER',
    'PRESEC',
    'ST. PETER',
    'ST. MARY',
  ];

  const categoryB = [
    'ACCRA ACADEMY',
    'AGGREY MEMORIAL',
    'TAMALE SENIOR HIGH',
    'T.I. AHMADIYYA',
    'KUMASI HIGH',
    'TEMA SENIOR HIGH',
  ];

  if (categoryA.some((keyword) => upperName.includes(keyword))) {
    return SchoolGrade.A;
  }

  if (categoryB.some((keyword) => upperName.includes(keyword))) {
    return SchoolGrade.B;
  }

  if (
    region.includes('Greater Accra') ||
    region.includes('Ashanti') ||
    region.includes('Western')
  ) {
    return SchoolGrade.B;
  }

  if (upperName.includes('GIRLS') || upperName.includes('BOYS')) {
    return SchoolGrade.B;
  }

  return SchoolGrade.C;
}

function inferPrograms(name: string, category: SchoolCategory): string[] {
  const upper = name.toUpperCase();

  if (category === SchoolCategory.TECHNICAL_VOCATIONAL) {
    if (upper.includes('AGRIC')) {
      return ['Agriculture', 'General Science'];
    }
    return PROGRAMS_TECH_VOC;
  }

  if (category === SchoolCategory.UNIVERSITY) {
    return ['Undergraduate Programs', 'Postgraduate Programs'];
  }

  if (category === SchoolCategory.COLLEGE) {
    return ['Diploma Programs', 'Professional Courses'];
  }

  return PROGRAMS_SENIOR_HIGH;
}

function extractEmail(segment: string): { email?: string; rest: string } {
  const match = segment.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  if (!match) {
    return { rest: segment.trim() };
  }
  const email = match[0];
  const rest = segment.replace(email, ' ').replace(/\s+/g, ' ').trim();
  return { email, rest };
}

function extractResidency(segment: string): {
  residency: Residency;
  rest: string;
} {
  const patterns: Array<{ pattern: string; value: Residency }> = [
    { pattern: 'DAY/BOARDING', value: Residency.DAY_BOARDING },
    { pattern: 'BOARDING', value: Residency.BOARDING },
    { pattern: 'DAY', value: Residency.DAY },
  ];

  for (const { pattern, value } of patterns) {
    const index = segment.toUpperCase().lastIndexOf(pattern);
    if (index !== -1) {
      const updated = (
        segment.slice(0, index) + segment.slice(index + pattern.length)
      )
        .replace(/\s+/g, ' ')
        .trim();
      return { residency: value, rest: updated };
    }
  }

  return { residency: Residency.DAY, rest: segment };
}

function extractGender(segment: string): {
  gender: Gender;
  rest: string;
} {
  const patterns: Array<{ pattern: string; value: Gender }> = [
    { pattern: 'MIXED', value: Gender.MIXED },
    { pattern: 'MALE', value: Gender.MALE },
    { pattern: 'FEMALE', value: Gender.FEMALE },
  ];

  for (const { pattern, value } of patterns) {
    const index = segment.toUpperCase().lastIndexOf(pattern);
    if (index !== -1) {
      const updated = (
        segment.slice(0, index) + segment.slice(index + pattern.length)
      )
        .replace(/\s+/g, ' ')
        .trim();
      return { gender: value, rest: updated };
    }
  }

  return { gender: Gender.MIXED, rest: segment };
}

function extractRegion(segment: string): {
  region?: RegionPattern;
  rest: string;
} {
  const upperSegment = segment.toUpperCase();
  for (const regionName of REGION_NAMES) {
    if (
      upperSegment.startsWith(regionName + ' ') ||
      upperSegment === regionName
    ) {
      const region = REGION_LOOKUP.get(regionName);
      if (!region) continue;
      const rest = segment.slice(regionName.length).trim();
      return { region, rest };
    }
  }

  return { rest: segment };
}

function extractDistrict(
  segment: string,
  region?: RegionPattern,
): { district?: string; rest: string } {
  if (!region) {
    return { rest: segment };
  }

  const upperSegment = segment.toUpperCase();
  for (const district of region.districts) {
    for (const pattern of district.patterns) {
      if (upperSegment.startsWith(pattern + ' ') || upperSegment === pattern) {
        const rest = segment.slice(pattern.length).trim();
        return { district: district.display, rest };
      }
    }
  }

  return { rest: segment };
}

function extractSchoolAndLocation(segment: string): {
  school?: string;
  location?: string;
} {
  const tokens = segment.split(' ').filter(Boolean);
  if (!tokens.length) {
    return {};
  }

  let schoolEndIndex = -1;
  for (let index = tokens.length - 1; index >= 0; index -= 1) {
    const token = tokens[index].toUpperCase();
    if (SCHOOL_END_KEYWORDS.has(token)) {
      schoolEndIndex = index;
      break;
    }
  }

  if (schoolEndIndex === -1) {
    schoolEndIndex = Math.max(tokens.length - 2, 0);
  }

  const schoolTokens = tokens.slice(0, schoolEndIndex + 1);
  const locationTokens = tokens.slice(schoolEndIndex + 1);

  const school = schoolTokens.length
    ? toTitleCase(normalizeSpaces(schoolTokens.join(' ')))
    : undefined;
  const location = locationTokens.length
    ? toTitleCase(normalizeSpaces(locationTokens.join(' ')))
    : undefined;

  return { school, location };
}

function parseDoubleTrackSet(text: string): Set<string> {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const keywords = ['SCHOOL', 'COLLEGE', 'UNIVERSITY', 'INSTITUTE'];
  const set = new Set<string>();

  for (const line of lines) {
    const upper = line.toUpperCase();
    if (keywords.some((keyword) => upper.includes(keyword))) {
      set.add(normalizeName(line));
    }
  }

  return set;
}

function parseSchoolEntries(
  text: string,
  doubleTrackSet: Set<string>,
): ParsedSchool[] {
  const lines = text
    .split('\n')
    .map((line) => normalizeSpaces(line))
    .filter((line) => line.length > 0);

  const entries: ParsedSchool[] = [];
  let buffer: string[] = [];

  const flush = () => {
    if (!buffer.length) {
      return;
    }
    const parsed = buildSchoolFromLines(buffer, doubleTrackSet);
    if (parsed) {
      entries.push(parsed);
    }
    buffer = [];
  };

  for (const line of lines) {
    if (/^\d+\s+/.test(line)) {
      flush();
      buffer = [line];
    } else if (buffer.length) {
      buffer.push(line);
    }
  }
  flush();

  return deduplicate(entries);
}

function deduplicate(entries: ParsedSchool[]): ParsedSchool[] {
  const map = new Map<string, ParsedSchool>();
  for (const entry of entries) {
    const key = `${normalizeName(entry.name)}|${normalizeName(entry.district)}|${normalizeName(entry.region)}`;
    if (!map.has(key)) {
      map.set(key, entry);
    }
  }
  return Array.from(map.values());
}

function buildSchoolFromLines(
  lines: string[],
  doubleTrackSet: Set<string>,
): ParsedSchool | undefined {
  const combined = normalizeSpaces(lines.join(' '));
  const match = combined.match(/^(\d+)\s+(.*)$/);
  if (!match) {
    return undefined;
  }

  const serial = parseInt(match[1], 10);
  let remaining = match[2];

  const { region, rest: afterRegion } = extractRegion(remaining);
  if (!region) {
    return undefined;
  }
  remaining = afterRegion;

  const { district, rest: afterDistrict } = extractDistrict(remaining, region);
  remaining = afterDistrict;

  const { email, rest: afterEmail } = extractEmail(remaining);
  const { residency, rest: afterResidency } = extractResidency(afterEmail);
  const { gender, rest: afterGender } = extractGender(afterResidency);

  const { school, location } = extractSchoolAndLocation(afterGender);
  if (!school) {
    return undefined;
  }

  const regionName = toTitleCase(region.label);
  const districtName = district ?? 'Unknown District';

  const category = determineCategory(school);
  const grade = assignGrade(school, regionName);
  const programs = inferPrograms(school, category);
  const normalizedName = normalizeName(school);

  return {
    name: school,
    category,
    region: regionName,
    district: districtName,
    location,
    grade,
    gender,
    residency,
    email: email?.toLowerCase(),
    website: undefined,
    programsOffered: programs,
    metadata: {
      source: 'GES',
      dataYear: 2020,
      serial,
      doubleTrack: doubleTrackSet.has(normalizedName),
      raw: lines,
    },
  };
}

export async function fetchGesSchoolData(): Promise<ParsedSchool[]> {
  const [schoolPdfBuffer, doubleTrackBuffer] = await Promise.all([
    downloadPdf(GES_SCHOOL_LIST_URL),
    downloadPdf(GES_DOUBLE_TRACK_URL),
  ]);

  const [schoolText, doubleTrackText] = await Promise.all([
    parsePdf(schoolPdfBuffer),
    parsePdf(doubleTrackBuffer),
  ]);

  const doubleTrackSet = parseDoubleTrackSet(doubleTrackText);
  const entries = parseSchoolEntries(schoolText, doubleTrackSet);

  return entries;
}

export async function fetchGesSchoolDataForPrisma(): Promise<
  Prisma.SchoolCreateManyInput[]
> {
  const schools = await fetchGesSchoolData();
  return schools.map((school) => ({
    name: school.name,
    category: school.category,
    region: school.region,
    district: school.district,
    location: school.location ?? null,
    grade: school.grade,
    gender: school.gender,
    residency: school.residency,
    email: school.email ?? null,
    website: school.website ?? null,
    programsOffered: school.programsOffered,
    metadata: school.metadata as Prisma.InputJsonValue,
  }));
}
