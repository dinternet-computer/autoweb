import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { MainService } from './main.service';
import { Captcha, Payload } from './models/main.model';

@Resolver()
export class MainResolver {
    constructor(private readonly mainService: MainService) {}

    @Query(of => String)
    async main() {
        return await this.mainService.main();
    }

    @Query(of => Int)
    async scheduleNum() {
        return await this.mainService.scheduleNum();;
    }

    @Query(of => Captcha)
    async capatchas() {
        return await this.mainService.captchas();
    }

    @Query(of => Payload)
    async payloads() {
        return await this.mainService.payloads();
    }

    @Mutation(of => Captcha) 
    async addValueOnCaptcha(@Args('value') value: string, @Args('id') id: string ) {
        return await this.mainService.addValueOnCaptcha(id, value)
    }
}
