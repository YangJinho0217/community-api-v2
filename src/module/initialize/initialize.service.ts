import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InitializeRepository } from './initialize.repository';
import { AppVersionDto } from './dto/appVersion.dto';

@Injectable()
export class InitializeService {

    constructor(
        private readonly initializeRepository : InitializeRepository,
        private readonly configService : ConfigService
    ) {}

    async getAppVersion(appVersionDto : AppVersionDto) {

        const device_type = appVersionDto.device_type;
        const version = appVersionDto.version;

        const findAppVersion = await this.initializeRepository.findAppVersion(device_type, version);

        if(!findAppVersion) {
            throw new BadRequestException('invalid_version OR invalid_device_type')
        }

        if(findAppVersion.is_inspc == 1) {
            throw new BadRequestException('inspection');
        }

        const privacy_url = this.configService.get<string>('APM_PRIVACY_URL')!;
        const terms_url = this.configService.get<string>('APM_TERMS_URL');

        const result = {
            privacy_url : privacy_url,
            terms_url : terms_url
        }

        return result;
    }
}
