import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('App')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Saludo / health léger' })
  @ApiOkResponse({ description: 'Texto de bienvenida', schema: { type: 'string' } })
  getHello(): string {
    return this.appService.getHello();
  }
}
