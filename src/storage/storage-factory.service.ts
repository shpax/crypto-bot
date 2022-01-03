import { Injectable } from '@nestjs/common';
import { Connection } from 'typeorm';
import { SQLStorage } from './SQLStorage';
import { Storage } from './storage.interface';

@Injectable()
export class StorageFactoryService {
  constructor(private connection: Connection) {}

  create(userId: number): Storage {
    return new SQLStorage(userId, this.connection);
  }
}
