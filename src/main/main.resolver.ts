import { Query, Resolver } from '@nestjs/graphql';
import { MainService } from './main.service';

@Resolver()
export class MainResolver {
    constructor(private readonly mainService: MainService) {}

    @Query(of => String)
    async main() {
        return await this.mainService.main();
    }
}
