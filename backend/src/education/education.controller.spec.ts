import { HttpException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { EducationController } from './education.controller';
import { EducationService } from './education.service';
import { SchoolCategory, SchoolGrade } from './entities/school.entity';
import { SchoolSearchDto } from './dto/school-search.dto';
import { SchoolSearchResponseDto } from './dto/school-search-response.dto';

const createSchoolSearchResponse = (): SchoolSearchResponseDto => ({
  success: true,
  data: [],
  total: 0,
  pagination: { limit: 20, offset: 0, hasMore: false },
  searchParams: {},
  timestamp: new Date().toISOString(),
});

describe('EducationController', () => {
  let controller: EducationController;
  let service: {
    searchSchools: jest.Mock;
    getAllSchools: jest.Mock;
    getStatistics: jest.Mock;
    getSchoolById: jest.Mock;
    getSchoolsByRegion: jest.Mock;
    getSchoolsByDistrict: jest.Mock;
    getSchoolsByCategory: jest.Mock;
    getSchoolsByGrade: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      searchSchools: jest.fn(),
      getAllSchools: jest.fn(),
      getStatistics: jest.fn(),
      getSchoolById: jest.fn(),
      getSchoolsByRegion: jest.fn(),
      getSchoolsByDistrict: jest.fn(),
      getSchoolsByCategory: jest.fn(),
      getSchoolsByGrade: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EducationController],
      providers: [
        {
          provide: EducationService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<EducationController>(EducationController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('delegates searchSchools to the service', async () => {
    const response = createSchoolSearchResponse();
    service.searchSchools.mockResolvedValue(response);
    const query = new SchoolSearchDto();

    const result = await controller.searchSchools(query);

    expect(service.searchSchools).toHaveBeenCalledWith(query);
    expect(result).toBe(response);
  });

  it('wraps search errors in HttpException', async () => {
    service.searchSchools.mockRejectedValue(new Error('failure'));
    const query = new SchoolSearchDto();

    await expect(controller.searchSchools(query)).rejects.toThrow(
      HttpException,
    );
  });

  it('validates category before calling service', async () => {
    const validCategories = Object.values(SchoolCategory).join(', ');
    const expectedMessage = `Invalid category: INVALID. Valid categories are: ${validCategories}`;

    await expect(controller.getSchoolsByCategory('INVALID')).rejects.toThrow(
      expectedMessage,
    );
    expect(service.getSchoolsByCategory).not.toHaveBeenCalled();

    service.getSchoolsByCategory.mockResolvedValue([]);
    await controller.getSchoolsByCategory(SchoolCategory.SHS);
    expect(service.getSchoolsByCategory).toHaveBeenCalledWith(
      SchoolCategory.SHS,
    );
  });

  it('validates grade before calling service', async () => {
    const validGrades = Object.values(SchoolGrade).join(', ');
    const expectedMessage = `Invalid grade: Z. Valid grades are: ${validGrades}`;

    await expect(controller.getSchoolsByGrade('Z')).rejects.toThrow(
      expectedMessage,
    );
    expect(service.getSchoolsByGrade).not.toHaveBeenCalled();

    service.getSchoolsByGrade.mockResolvedValue([]);
    await controller.getSchoolsByGrade(SchoolGrade.A);
    expect(service.getSchoolsByGrade).toHaveBeenCalledWith(SchoolGrade.A);
  });

  it('returns statistics via the service', async () => {
    const stats = { totalSchools: 10 };
    service.getStatistics.mockResolvedValue(stats);

    await expect(controller.getStatistics()).resolves.toBe(stats);
    expect(service.getStatistics).toHaveBeenCalled();
  });

  it('returns school by id via the service', async () => {
    const school = { id: 'school-1' };
    service.getSchoolById.mockResolvedValue(school);

    await expect(controller.getSchoolById('school-1')).resolves.toBe(school);
    expect(service.getSchoolById).toHaveBeenCalledWith('school-1');
  });
});
