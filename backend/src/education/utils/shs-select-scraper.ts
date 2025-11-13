import type { Prisma } from '@prisma/client';
import axios from 'axios';
import * as cheerio from 'cheerio';
import type { AnyNode } from 'domhandler';
import {
  Gender,
  Residency,
  School,
  SchoolCategory,
  SchoolGrade,
} from '../entities/school.entity';

type PartialSchool = Partial<School> & {
  name: string;
  category: SchoolCategory;
  region: string;
  district: string;
  grade: SchoolGrade;
  gender: Gender;
  residency: Residency;
  programsOffered: string[];
  metadata?: Record<string, unknown>;
};

interface SchoolSummary {
  slug: string;
  name: string;
}

const BASE_URL = 'https://shsselect.com';
const LIST_PATH = '/schools';
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';
const REQUEST_TIMEOUT = 30_000;
const LIST_SELECTOR = 'turbo-frame#schools_list_frame .grid a';
const NEXT_SELECTOR = 'nav[aria-label="Page navigation"] a[rel="next"]';
const DETAIL_INFO_SELECTOR = 'dl > div';
const PROGRAMS_SECTION_HEADING = 'Programmes Offered';
const HIGHLIGHTS_HEADING = 'Unique Highlights';
const CONTACT_HEADING = 'Contact Information';

const httpClient = axios.create({
  baseURL: BASE_URL,
  timeout: REQUEST_TIMEOUT,
  headers: {
    'User-Agent': USER_AGENT,
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  },
});

function toAbsoluteUrl(path: string | undefined): string | null {
  if (!path) {
    return null;
  }
  try {
    return new URL(path, BASE_URL).toString();
  } catch (error) {
    console.error(`[SHS Select] Failed to parse URL: ${path}`, error);
    return null;
  }
}

function toTitleCase(value: string): string {
  return value
    .toLowerCase()
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
    .trim();
}

function normalizeDistrict(value: string): string {
  const cleaned = value.replace(/municipal|metropolis|district/gi, (match) =>
    match.toLowerCase(),
  );
  return toTitleCase(cleaned);
}

function mapCategoryToGrade(category: string | undefined): SchoolGrade {
  switch ((category ?? '').trim().toUpperCase()) {
    case 'A':
      return SchoolGrade.A;
    case 'B':
      return SchoolGrade.B;
    case 'C':
      return SchoolGrade.C;
    case 'D':
      return SchoolGrade.D;
    default:
      return SchoolGrade.UNGRADED;
  }
}

function mapGender(value: string | undefined): Gender {
  const normalized = (value ?? '').trim().toLowerCase();
  if (normalized === 'boys' || normalized === 'male') {
    return Gender.MALE;
  }
  if (normalized === 'girls' || normalized === 'female') {
    return Gender.FEMALE;
  }
  return Gender.MIXED;
}

function mapResidency(value: string | undefined): Residency {
  const normalized = (value ?? '').trim().toLowerCase();
  if (normalized.includes('day') && normalized.includes('board')) {
    return Residency.DAY_BOARDING;
  }
  if (normalized.includes('board')) {
    return Residency.BOARDING;
  }
  return Residency.DAY;
}

function parseCoordinate(
  mapSrc: string | undefined,
): { latitude: number; longitude: number } | null {
  if (!mapSrc) {
    return null;
  }
  const llMatch = mapSrc.match(/[?&]ll=([-\d.]+),([-\d.]+)/i);
  if (llMatch) {
    const lat = Number.parseFloat(llMatch[1]);
    const lng = Number.parseFloat(llMatch[2]);
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
      return { latitude: lat, longitude: lng };
    }
  }
  const qMatch = mapSrc.match(/[?&]q=([-\d.]+),([-\d.]+)/i);
  if (qMatch) {
    const lat = Number.parseFloat(qMatch[1]);
    const lng = Number.parseFloat(qMatch[2]);
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
      return { latitude: lat, longitude: lng };
    }
  }
  return null;
}

function decodeCfEmail(encoded?: string | null): string | undefined {
  if (!encoded) {
    return undefined;
  }
  try {
    let result = '';
    const key = Number.parseInt(encoded.slice(0, 2), 16);
    for (let i = 2; i < encoded.length; i += 2) {
      const code = Number.parseInt(encoded.slice(i, i + 2), 16) ^ key;
      result += String.fromCharCode(code);
    }
    return result;
  } catch (error) {
    console.error(`[SHS Select] Failed to decode CF email: ${encoded}`, error);
    return undefined;
  }
}

function cleanText(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }
  const trimmed = value.replace(/\s+/g, ' ').trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

async function fetchSchoolList(): Promise<SchoolSummary[]> {
  const summaries: SchoolSummary[] = [];
  const visited = new Set<string>();
  let nextUrl: string | null = toAbsoluteUrl(LIST_PATH);

  while (nextUrl) {
    if (visited.has(nextUrl)) {
      break;
    }
    visited.add(nextUrl);

    const response = await httpClient.get<string>(
      nextUrl.replace(BASE_URL, ''),
    );
    const $ = cheerio.load(response.data);
    const cards = $(LIST_SELECTOR);

    cards.each((_, element) => {
      const anchor = $(element);
      const href = anchor.attr('href');
      const slug = href?.startsWith('/') ? href : `/${href ?? ''}`;
      const name = cleanText(anchor.find('h3').text());

      if (slug && name) {
        summaries.push({ slug, name });
      }
    });

    const nextLink = $(NEXT_SELECTOR).attr('href');
    nextUrl = nextLink ? toAbsoluteUrl(nextLink) : null;
  }

  return summaries;
}

function extractInfoMap($: cheerio.CheerioAPI): Record<string, string> {
  const info: Record<string, string> = {};
  $(DETAIL_INFO_SELECTOR).each((_, element) => {
    const container = $(element);
    const label = cleanText(container.find('dt').text())?.toLowerCase();
    const value = cleanText(container.find('dd').text());
    if (label && value) {
      info[label] = value;
    }
  });
  return info;
}

function extractSectionList(
  $: cheerio.CheerioAPI,
  $root: cheerio.Cheerio<AnyNode>,
): string[] {
  const values: string[] = [];
  $root.find('li').each((_, element) => {
    const item = cleanText($(element).text());
    if (item) {
      values.push(item);
    }
  });
  return values;
}

function extractPrograms($: cheerio.CheerioAPI): string[] {
  const heading = $(`h2:contains("${PROGRAMS_SECTION_HEADING}")`).first();
  if (!heading.length) {
    return [];
  }
  const programsRoot = heading.nextAll('div').first();
  const programs = new Set<string>();
  programsRoot.find('li a').each((_, element) => {
    const program = cleanText($(element).text());
    if (program) {
      programs.add(toTitleCase(program));
    }
  });
  return Array.from(programs);
}

function extractHighlights($: cheerio.CheerioAPI): string[] {
  const heading = $(`h3:contains("${HIGHLIGHTS_HEADING}")`).first();
  if (!heading.length) {
    return [];
  }
  const list = heading.nextAll('ul').first();
  return extractSectionList($, list);
}

function extractContactInfo($: cheerio.CheerioAPI): {
  email?: string;
  phone?: string;
  boxAddress?: string;
} {
  const heading = $(`h3:contains("${CONTACT_HEADING}")`).first();
  if (!heading.length) {
    return {};
  }
  const container = heading.parent('div');
  const info: { email?: string; phone?: string; boxAddress?: string } = {};

  container.find('li').each((_, element) => {
    const text = $(element).text();
    const label = cleanText(
      $(element).find('span.font-semibold').text(),
    )?.toLowerCase();

    if (!label) {
      return;
    }

    if (label.includes('email')) {
      const encoded = $(element).find('a[data-cfemail]').attr('data-cfemail');
      const fallback = cleanText($(element).find('a').text());
      info.email = decodeCfEmail(encoded) ?? fallback;
    } else if (label.includes('phone')) {
      info.phone = cleanText(text.replace(/phone\s*:*/i, ''));
    } else if (label.includes('box address')) {
      info.boxAddress = cleanText(text.replace(/box address\s*:*/i, ''));
    }
  });

  return info;
}

function detectDoubleTrack(about?: string, highlights?: string[]): boolean {
  const haystack =
    `${about ?? ''} ${(highlights ?? []).join(' ')}`.toLowerCase();
  return haystack.includes('double track');
}

async function fetchSchoolDetail(
  summary: SchoolSummary,
): Promise<PartialSchool | null> {
  const url = toAbsoluteUrl(summary.slug);
  if (!url) {
    return null;
  }

  const response = await httpClient.get<string>(url.replace(BASE_URL, ''));
  const $ = cheerio.load(response.data);

  const heading = $('h1').first();
  const name = cleanText(heading.text()) ?? summary.name;
  const info = extractInfoMap($);
  const categoryLetter = info['category'];
  const genderValue = info['gender'];
  const residencyValue = info['residential status'];
  const districtValue = info['district'];
  const regionValue = info['region'];
  const statusValue = info['status'];

  const aboutSection = $(`h2:contains("About")`).first().nextAll('div').first();
  const aboutText = cleanText(aboutSection.text());
  const motto = cleanText($('p:contains("Motto")').next().text());
  const mission = cleanText($('p:contains("Mission")').next().text());
  const vision = cleanText($('p:contains("Vision")').next().text());

  const programsOffered = extractPrograms($);
  const highlights = extractHighlights($);
  const { email, phone, boxAddress } = extractContactInfo($);
  const mapUrl = $('iframe[src*="maps.google.com"]').attr('src');
  const coordinates = parseCoordinate(mapUrl ?? undefined);
  const doubleTrack = detectDoubleTrack(aboutText, highlights);

  const locationLine = cleanText(heading.next('p').first().text());

  const metadata: Record<string, unknown> = {
    source: 'SHS Select',
    detailUrl: url,
    status: statusValue,
    motto,
    mission,
    vision,
    highlights,
    about: aboutText,
    phone,
    email,
    boxAddress,
    mapUrl,
  };

  if (coordinates) {
    metadata.coordinates = coordinates;
  }

  if (doubleTrack) {
    metadata.doubleTrack = true;
  }

  return {
    name,
    category: SchoolCategory.SHS,
    location: locationLine,
    region: regionValue ? toTitleCase(regionValue) : '',
    district: districtValue ? normalizeDistrict(districtValue) : '',
    grade: mapCategoryToGrade(categoryLetter),
    gender: mapGender(genderValue),
    residency: mapResidency(residencyValue),
    email,
    phone,
    boxAddress,
    programsOffered,
    metadata,
  };
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R | null>,
): Promise<R[]> {
  const results: R[] = [];
  let index = 0;

  async function worker(): Promise<void> {
    while (index < items.length) {
      const current = index;
      index += 1;
      try {
        const value = await mapper(items[current], current);
        if (value) {
          results.push(value);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.warn(
          `[SHS Select] Failed to process ${JSON.stringify(items[current])}: ${message}`,
        );
      }
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    () => worker(),
  );
  await Promise.all(workers);
  return results;
}

export async function fetchShsSelectSchools(): Promise<PartialSchool[]> {
  const summaries = await fetchSchoolList();
  if (!summaries.length) {
    return [];
  }

  const schools = await mapWithConcurrency(
    summaries,
    8,
    async (summary, idx) => {
      const school = await fetchSchoolDetail(summary);
      if (school && ((idx + 1) % 25 === 0 || idx === summaries.length - 1)) {
        console.log(
          `[SHS Select] Parsed ${idx + 1}/${summaries.length}: ${school.name}`,
        );
      }
      return school;
    },
  );

  return schools;
}

export async function fetchShsSelectSchoolsForPrisma(): Promise<
  Prisma.SchoolCreateManyInput[]
> {
  const schools = await fetchShsSelectSchools();
  return schools.map((school) => ({
    name: school.name,
    nickname: school.nickname ?? undefined,
    category: school.category,
    region: school.region ?? '',
    district: school.district ?? '',
    location: school.location ?? undefined,
    grade: school.grade,
    gender: school.gender,
    residency: school.residency,
    email: school.email ?? undefined,
    phone: school.phone ?? undefined,
    website: school.website ?? undefined,
    boxAddress: school.boxAddress ?? undefined,
    establishedYear: school.establishedYear ?? undefined,
    studentPopulation: school.studentPopulation ?? undefined,
    programsOffered: school.programsOffered,
    metadata: school.metadata as Prisma.InputJsonValue,
  }));
}
