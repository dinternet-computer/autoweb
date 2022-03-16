import { Module } from '@nestjs/common';
import { DbService } from 'src/db/db.service';
import { MainResolver } from './main.resolver';
import { MainService } from './main.service';

@Module({
  providers: [MainService, MainResolver, DbService]
})
export class MainModule {}
