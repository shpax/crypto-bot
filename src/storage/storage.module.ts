import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import path from 'path';

import { User } from './SQLStorage';

import { StorageFactoryService } from './storage-factory.service';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: __dirname + `../../../db.sqlite`,
      entities: [User],
      logging: true,
      synchronize: true,
    }),
  ],
  providers: [StorageFactoryService],
  exports: [StorageFactoryService],
})
export class StorageModule {}
