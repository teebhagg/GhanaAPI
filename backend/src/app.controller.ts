import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppService, StatusResponse } from './app.service';

@Controller()
@ApiTags('Status')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('status')
  @ApiOperation({
    summary: 'Get API status and statistics',
    description:
      'Returns health checks for database and services, along with statistics for all modules',
  })
  getStatus(): Promise<StatusResponse> {
    return this.appService.getStatus();
  }
}
