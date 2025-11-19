import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { InitializeService } from './initialize.service';
import { AppVersionDto } from './dto/appVersion.dto';
import { ApiResponse } from 'src/common/response.util';

@Controller('/api/v1/initialize')
export class InitializeController {

    constructor(private readonly initializeService: InitializeService) {}
    
    @Get("/auth/init")
    async tryLogin(@Query() appVersionDto : AppVersionDto) {
    const data = await this.initializeService.getAppVersion(appVersionDto);
        return ApiResponse.success(data, "init Success");
    }
}
