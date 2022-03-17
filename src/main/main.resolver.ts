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

    @Query(of => [Captcha], {description: '只返回没有通过验证的验证码'})
    async captchas() {
        return await this.mainService.captchas();
    }

    @Query(of => [Payload])
    async payloads() {
        return await this.mainService.payloads();
    }

    @Mutation(of => Captcha) 
    async addValueOnCaptcha(@Args('value') value: string, @Args('id') id: string ) {
        return await this.mainService.addValueOnCaptcha(id, value)
    }
}
