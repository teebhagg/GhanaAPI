/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { SchoolSearchResponseDto } from './dto/school-search-response.dto';
import { SchoolSearchDto } from './dto/school-search.dto';
import { SchoolDto } from './dto/school.dto';
import { SchoolCategory, SchoolGrade } from './entities/school.entity';
import { PrismaService } from './services/prisma.service';

@Injectable()
export class EducationService {
  private readonly logger = new Logger(EducationService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  /**
   * Search schools with multiple filters
   */
  async searchSchools(
    query: SchoolSearchDto,
  ): Promise<SchoolSearchResponseDto> {
    this.logger.log(`Searching schools with query: ${JSON.stringify(query)}`);

    const {
      name,
      region,
      district,
      category,
      grade,
      limit = 20,
      offset = 0,
    } = query;

    // Build cache key
    const cacheKey = `schools_search_${JSON.stringify(query)}`;
    const cached =
      await this.cacheManager.get<SchoolSearchResponseDto>(cacheKey);
    if (cached) {
      this.logger.log('Returning cached search results');
      return cached;
    }

    // Build where clause
    const where: any = {};

    if (name) {
      where.name = {
        contains: name,
        mode: 'insensitive',
      };
    }

    if (region) {
      where.region = {
        contains: region,
        mode: 'insensitive',
      };
    }

    if (district) {
      where.district = {
        contains: district,
        mode: 'insensitive',
      };
    }

    if (category) {
      where.category = category;
    }

    if (grade) {
      where.grade = grade;
    }

    // Execute query with pagination
    const [schools, total] = await Promise.all([
      this.prisma.school.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: [
          { grade: 'asc' }, // A, B, C, D order
          { name: 'asc' },
        ],
      }),
      this.prisma.school.count({ where }),
    ]);

    const response: SchoolSearchResponseDto = {
      success: true,
      data: schools.map((school) => this.toSchoolDto(school)),
      total: schools.length,
      pagination: {
        limit,
        offset,
        hasMore: offset + schools.length < total,
      },
      searchParams: query,
      timestamp: new Date().toISOString(),
    };

    // Cache for 1 hour
    await this.cacheManager.set(cacheKey, response, 3600000);

    return response;
  }

  /**
   * Get all schools with pagination
   */
  async getAllSchools(
    limit: number = 20,

    query: SchoolSearchDto,
    offset: number = 0,
  ): Promise<SchoolDto[]> {
    this.logger.log(`Getting all schools (limit: ${limit}, offset: ${offset})`);

    const schools = await this.prisma.school.findMany({
      take: limit,
      skip: offset,
      orderBy: [{ grade: 'asc' }, { name: 'asc' }],
    });

    return schools.map((school) => this.toSchoolDto(school));
  }

  /**
   * Get school by ID
   */
  async getSchoolById(id: string): Promise<SchoolDto> {
    this.logger.log(`Getting school by ID: ${id}`);

    const cacheKey = `school_${id}`;
    const cached = await this.cacheManager.get<SchoolDto>(cacheKey);
    if (cached) {
      return cached;
    }

    const school = await this.prisma.school.findUnique({
      where: { id },
    });

    if (!school) {
      throw new NotFoundException(`School with ID ${id} not found`);
    }

    const dto = this.toSchoolDto(school);

    // Cache for 1 hour
    await this.cacheManager.set(cacheKey, dto, 3600000);

    return dto;
  }

  /**
   * Get schools by region
   */
  async getSchoolsByRegion(region: string): Promise<SchoolDto[]> {
    this.logger.log(`Getting schools in region: ${region}`);

    const cacheKey = `schools_region_${region}`;
    const cached = await this.cacheManager.get<SchoolDto[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const schools = await this.prisma.school.findMany({
      where: {
        region: {
          contains: region,
          mode: 'insensitive',
        },
      },
      orderBy: [{ grade: 'asc' }, { name: 'asc' }],
    });

    const dtos = schools.map((school) => this.toSchoolDto(school));

    // Cache for 1 hour
    await this.cacheManager.set(cacheKey, dtos, 3600000);

    return dtos;
  }

  /**
   * Get schools by district
   */
  async getSchoolsByDistrict(district: string): Promise<SchoolDto[]> {
    this.logger.log(`Getting schools in district: ${district}`);

    const cacheKey = `schools_district_${district}`;
    const cached = await this.cacheManager.get<SchoolDto[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const schools = await this.prisma.school.findMany({
      where: {
        district: {
          contains: district,
          mode: 'insensitive',
        },
      },
      orderBy: [{ grade: 'asc' }, { name: 'asc' }],
    });

    const dtos = schools.map((school) => this.toSchoolDto(school));

    // Cache for 1 hour
    await this.cacheManager.set(cacheKey, dtos, 3600000);

    return dtos;
  }

  /**
   * Get schools by category
   */
  async getSchoolsByCategory(category: SchoolCategory): Promise<SchoolDto[]> {
    this.logger.log(`Getting schools by category: ${category}`);

    const cacheKey = `schools_category_${category}`;
    const cached = await this.cacheManager.get<SchoolDto[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const schools = await this.prisma.school.findMany({
      where: { category },
      orderBy: [{ grade: 'asc' }, { name: 'asc' }],
    });

    const dtos = schools.map((school) => this.toSchoolDto(school));

    // Cache for 1 hour
    await this.cacheManager.set(cacheKey, dtos, 3600000);

    return dtos;
  }

  /**
   * Get schools by grade
   */
  async getSchoolsByGrade(grade: SchoolGrade): Promise<SchoolDto[]> {
    this.logger.log(`Getting schools by grade: ${grade}`);

    const cacheKey = `schools_grade_${grade}`;
    const cached = await this.cacheManager.get<SchoolDto[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const schools = await this.prisma.school.findMany({
      where: { grade },
      orderBy: { name: 'asc' },
    });

    const dtos = schools.map((school) => this.toSchoolDto(school));

    // Cache for 1 hour
    await this.cacheManager.set(cacheKey, dtos, 3600000);

    return dtos;
  }

  /**
   * Get statistics about schools
   */
  async getStatistics(): Promise<any> {
    this.logger.log('Getting school statistics');

    const cacheKey = 'schools_statistics';
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached;
    }

    const [totalSchools, byCategory, byGrade, byRegion] = await Promise.all([
      this.prisma.school.count(),
      this.prisma.school.groupBy({
        by: ['category'],
        _count: true,
      }),
      this.prisma.school.groupBy({
        by: ['grade'],
        _count: true,
      }),
      this.prisma.school.groupBy({
        by: ['region'],
        _count: true,
      }),
    ]);

    const stats = {
      totalSchools,
      byCategory: byCategory.reduce(
        (acc, item) => {
          acc[item.category] = item._count;
          return acc;
        },
        {} as Record<string, number>,
      ),
      byGrade: byGrade.reduce(
        (acc, item) => {
          acc[item.grade] = item._count;
          return acc;
        },
        {} as Record<string, number>,
      ),
      byRegion: byRegion.reduce(
        (acc, item) => {
          acc[item.region] = item._count;
          return acc;
        },
        {} as Record<string, number>,
      ),
      timestamp: new Date().toISOString(),
    };

    // Cache for 1 hour
    await this.cacheManager.set(cacheKey, stats, 3600000);

    return stats;
  }

  /**
   * Convert Prisma School to SchoolDto
   */
  private toSchoolDto(school: any): SchoolDto {
    return {
      id: school.id,
      name: school.name,
      nickname: school.nickname,
      category: school.category,
      region: school.region,
      district: school.district,
      location: school.location,
      grade: school.grade,
      gender: school.gender,
      residency: school.residency,
      email: school.email,
      phone: school.phone,
      website: school.website,
      boxAddress: school.boxAddress,
      establishedYear: school.establishedYear ?? undefined,
      studentPopulation: school.studentPopulation ?? undefined,
      programsOffered: school.programsOffered,
      metadata: school.metadata,
      createdAt: school.createdAt,
      updatedAt: school.updatedAt,
    };
  }
}
