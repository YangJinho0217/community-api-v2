import { Module } from '@nestjs/common';
import { InitializeController } from './initialize.controller';
import { InitializeService } from './initialize.service';
import { InitializeRepository } from './initialize.repository';
import { DatabaseService } from 'src/database/database.service';

@Module({
  controllers: [InitializeController],
  providers: [
    DatabaseService, InitializeService, InitializeRepository]
})
export class InitializeModule {}
