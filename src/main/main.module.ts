import { Module } from '@nestjs/common';
import { MainResolver } from './main.resolver';
import { MainService } from './main.service';

@Module({
  providers: [MainService, MainResolver]
})
export class MainModule {}
