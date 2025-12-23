import { Injectable } from '@nestjs/common';
import { PortFolioRepository } from './portfolio.repository';
import { VisitorDto } from './dto/visitor.dto';

@Injectable()
export class PortfolioService {

    constructor (private readonly portFolioReposytory : PortFolioRepository) {}


    async visitorWelcome(visitorDto : VisitorDto) {
        const visitor_name = visitorDto.visitor_name;

        await this.portFolioReposytory.insertUser(visitor_name);
    }
}
