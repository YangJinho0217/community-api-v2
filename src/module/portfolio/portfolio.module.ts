import { Module } from '@nestjs/common';
import { PortfolioController } from './portfolio.controller';
import { PortfolioService } from './portfolio.service';
import { PortFolioRepository } from './portfolio.repository';

@Module({
    controllers : [PortfolioController],
    providers : [PortfolioService, PortFolioRepository]
})
export class PortfolioModule {}
