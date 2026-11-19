import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiOkResponse } from '@nestjs/swagger';
import { AppService, StatusResponse } from './app.service';
import { StatusResponseDto } from './common/swagger/response-schemas';

@Controller()
@ApiTags('Status')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @ApiOkResponse({ description: 'Welcome message', schema: { type: 'string' } })
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @ApiOkResponse({
    description: 'Health and statistics',
    type: StatusResponseDto,
  })
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
