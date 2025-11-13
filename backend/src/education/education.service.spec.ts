import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { EducationService } from './education.service';
import { PrismaService } from './services/prisma.service';
import {
  Gender,
  Residency,
  SchoolCategory,
  SchoolGrade,
} from './entities/school.entity';
import { SchoolSearchDto } from './dto/school-search.dto';
import { SchoolSearchResponseDto } from './dto/school-search-response.dto';
import { SchoolDto } from './dto/school.dto';

const createPrismaSchool = () => {
  const now = new Date();
  return {
    id: 'school-1',
    name: 'Achimota School',
    nickname: 'Motown',
    category: SchoolCategory.SHS,
    region: 'Greater Accra',
    district: 'Accra Metropolis',
    location: 'Achimota, Accra',
    grade: SchoolGrade.A,
    gender: Gender.MIXED,
    residency: Residency.DAY_BOARDING,
    email: 'info@achimota.edu.gh',
    phone: '+233302666962',
    website: 'https://achimota.edu.gh',
    boxAddress: 'P. O. BOX AH 1, Achimota',
    establishedYear: 1927,
    studentPopulation: 2400,
    programsOffered: ['Science', 'Arts'],
    metadata: { motto: 'Ut Omnes Unum Sint' },
    createdAt: now,
    updatedAt: now,
  };
};

const createSchoolDto = (): SchoolDto => ({
  ...createPrismaSchool(),
});

interface SchoolStatistics {
  totalSchools: number;
  byCategory: Record<string, number>;
  byGrade: Record<string, number>;
  byRegion: Record<string, number>;
  timestamp: string;
}

describe('EducationService', () => {
  let service: EducationService;
  let prisma: {
    school: {
      findMany: jest.Mock;
      count: jest.Mock;
      findUnique: jest.Mock;
      groupBy: jest.Mock;
    };
  };
  let cache: {
    get: jest.Mock;
    set: jest.Mock;
    del: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      school: {
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        groupBy: jest.fn(),
      },
    };

    cache = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EducationService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: CACHE_MANAGER,
          useValue: cache,
        },
      ],
    }).compile();

    service = module.get<EducationService>(EducationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('searchSchools', () => {
    it('returns cached response when available', async () => {
      const cached: SchoolSearchResponseDto = {
        success: true,
        data: [],
        total: 0,
        pagination: { limit: 20, offset: 0, hasMore: false },
        searchParams: {},
        timestamp: new Date().toISOString(),
      };
      cache.get.mockResolvedValue(cached);

      const query = new SchoolSearchDto();
      const result = await service.searchSchools(query);

      expect(result).toBe(cached);
      expect(prisma.school.findMany).not.toHaveBeenCalled();
      expect(prisma.school.count).not.toHaveBeenCalled();
    });

    it('queries prisma and caches result when cache is empty', async () => {
      cache.get.mockResolvedValue(null);
      const prismaSchool = createPrismaSchool();
      prisma.school.findMany.mockResolvedValue([prismaSchool]);
      prisma.school.count.mockResolvedValue(1);

      const query = Object.assign(new SchoolSearchDto(), {
        name: 'achi',
        limit: 10,
        offset: 0,
      });

      const result = await service.searchSchools(query);

      expect(prisma.school.findMany).toHaveBeenCalledWith({
        where: {
          name: {
            contains: 'achi',
            mode: 'insensitive',
          },
        },
        take: 10,
        skip: 0,
        orderBy: [{ grade: 'asc' }, { name: 'asc' }],
      });
      expect(prisma.school.count).toHaveBeenCalledWith({
        where: {
          name: {
            contains: 'achi',
            mode: 'insensitive',
          },
        },
      });
      const expectedKey =
        'schools_search_' +
        JSON.stringify({ name: 'achi', limit: 10, offset: 0 });
      expect(cache.set).toHaveBeenCalledWith(
        expectedKey,
        expect.objectContaining({ success: true }),
        3600000,
      );
      expect(result.data[0]).toMatchObject({
        id: prismaSchool.id,
        name: prismaSchool.name,
        nickname: prismaSchool.nickname,
        phone: prismaSchool.phone,
      });
    });
  });

  describe('getSchoolById', () => {
    it('returns cached school when present', async () => {
      const dto = createSchoolDto();
      cache.get.mockResolvedValue(dto);

      const result = await service.getSchoolById(dto.id);

      expect(result).toBe(dto);
      expect(prisma.school.findUnique).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when school does not exist', async () => {
      cache.get.mockResolvedValue(null);
      prisma.school.findUnique.mockResolvedValue(null);

      await expect(service.getSchoolById('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getStatistics', () => {
    it('returns cached statistics when available', async () => {
      const cachedStats = { totalSchools: 5 };
      cache.get.mockResolvedValue(cachedStats);

      await expect(service.getStatistics()).resolves.toBe(cachedStats);
      expect(prisma.school.count).not.toHaveBeenCalled();
    });

    it('computes statistics and caches them when cache empty', async () => {
      cache.get.mockResolvedValue(null);
      prisma.school.count.mockResolvedValue(2);
      prisma.school.groupBy
        .mockResolvedValueOnce([
          { category: SchoolCategory.SHS, _count: 1 },
          { category: SchoolCategory.UNIVERSITY, _count: 1 },
        ])
        .mockResolvedValueOnce([
          { grade: SchoolGrade.A, _count: 1 },
          { grade: SchoolGrade.UNGRADED, _count: 1 },
        ])
        .mockResolvedValueOnce([
          { region: 'Greater Accra', _count: 1 },
          { region: 'Ashanti', _count: 1 },
        ]);

      const stats = (await service.getStatistics()) as SchoolStatistics;

      expect(stats.totalSchools).toBe(2);
      expect(stats.byCategory).toEqual({
        SHS: 1,
        UNIVERSITY: 1,
      });
      expect(stats.byGrade).toEqual({
        A: 1,
        UNGRADED: 1,
      });
      expect(stats.byRegion).toEqual({
        'Greater Accra': 1,
        Ashanti: 1,
      });
      expect(cache.set).toHaveBeenCalledWith(
        'schools_statistics',
        expect.objectContaining({ totalSchools: 2 }),
        3600000,
      );
    });
  });
});
