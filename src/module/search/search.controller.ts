import { Controller, UseGuards } from '@nestjs/common';
import { SearchService } from './search.service';
import { OptionalJwtAuthGuard } from 'src/auth/jwt/optional-jwt-auth.guard';

@Controller("/api/v2/search")
export class SearchController {

    constructor(
        private readonly searchService : SearchService

    ) {}

    // @UseGuards(OptionalJwtAuthGuard)
    // @Get("/current_search")
    // async getCurrentSearch(@Query())
}
