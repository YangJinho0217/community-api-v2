import { Module } from '@nestjs/common';
import { InitializeController } from './initialize.controller';
import { InitializeService } from './initialize.service';
import { InitializeRepository } from './initialize.repository';

@Module({
  controllers: [InitializeController],
  providers: [
    InitializeService, InitializeRepository]
})
export class InitializeModule {}
