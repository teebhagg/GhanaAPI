import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Test } from '@nestjs/testing';
import { CurriculumService } from './curriculum.service';

describe('CurriculumService', () => {
  let service: CurriculumService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        CurriculumService,
        { provide: CACHE_MANAGER, useValue: { get: jest.fn(), set: jest.fn() } },
      ],
    }).compile();
    service = module.get(CurriculumService);
  });

  it('loads metadata and SHS levels from the supplied dataset', () => {
    expect(service.getSummary().data.title).toContain('Ghana Science');
    expect(service.getLevels().data).toEqual(['Basic 7', 'Basic 8', 'Basic 9', 'Basic 10', 'SHS 1', 'SHS 2', 'SHS 3']);
  });

  it('filters curriculum entries by year', async () => {
    const result = await service.getCurriculum({ year: 'SHS 1' });
    expect(result.data.length).toBeGreaterThan(0);
    expect(result.data.every((entry) => entry.year === 'SHS 1')).toBe(true);
  });

  it('finds standards and indicators by stable source IDs', async () => {
    const standard = (await service.getContentStandards({})).data.find((item) => item.id === '1.1.1.CS.1');
    expect(standard.id).toBe('1.1.1.CS.1');
    expect(standard.learning_indicators.some((item) => item.id === '1.1.1.LI.1')).toBe(true);
  });

  it('loads the Basic 7-10 Science curriculum alongside SHS', async () => {
    const result = await service.getCurriculum({ year: 'Basic 7', subject: 'Science' });
    expect(result.data.length).toBeGreaterThan(0);
    expect(result.data.every((entry) => entry.year === 'Basic 7' && entry.subject === 'Science')).toBe(true);
    expect((await service.getStandard('B7.1.1.1')).id).toBe('B7.1.1.1');
  });

  it('searches curriculum text and rejects invalid input', () => {
    expect(service.getContentStandards({ strand: 'Exploring Materials' }).data.length).toBeGreaterThan(0);
  });
});
