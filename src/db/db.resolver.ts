import { Mutation, Resolver } from '@nestjs/graphql'

import { DbService } from './db.service'
import { SetDbSchema } from './models/db.model'

@Resolver()
export class DbResolver {
  constructor (private readonly dbService: DbService) {}

  @Mutation(of => SetDbSchema, { description: '重置数据库schema' })
  async setSchema () {
    return await this.dbService.setSchema()
  }

  @Mutation(of => Boolean, { description: '删除数据库所有数据，包括schema' })
  async dropAllData () {
    await this.dbService.dropAll()
    return true
  }

  @Mutation(of => Boolean, { description: '删除数据库所有数据，但保留schema' })
  async dropData () {
    await this.dbService.dropData()
    return true
  }
}
