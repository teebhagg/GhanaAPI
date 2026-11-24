import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurriculumService } from './curriculum.service';
@ApiTags('Curriculum')
@Controller('education/curriculum')
export class CurriculumController {
  constructor(private readonly service: CurriculumService) {}
  @Get() @ApiOperation({ summary: 'Fetch curriculum entries' }) @ApiQuery({ name: 'year', required: false }) @ApiQuery({ name: 'subject', required: false }) @ApiQuery({ name: 'strand', required: false }) @ApiQuery({ name: 'substrand', required: false }) @ApiQuery({ name: 'limit', required: false, type: Number }) @ApiQuery({ name: 'offset', required: false, type: Number }) getCurriculum(@Query() query: any) { return this.service.getCurriculum(query); }
  @Get('summary') @ApiOperation({ summary: 'Fetch curriculum summary' }) getSummary() { return this.service.getSummary(); }
  @Get('content-standards') @ApiOperation({ summary: 'Fetch content standards' }) getContentStandards(@Query() query: any) { return this.service.getContentStandards(query); }
  @Get('strands') @ApiOperation({ summary: 'Fetch all strands and substrands' }) getStrands() { return this.service.getStrands(); }
  @Get('levels') @ApiOperation({ summary: 'Fetch available curriculum levels' }) getLevels() { return this.service.getLevels(); }
}
