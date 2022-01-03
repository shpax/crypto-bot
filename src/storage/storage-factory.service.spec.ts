import { Test, TestingModule } from '@nestjs/testing';
import { StorageFactoryService } from './storage-factory.service';

describe('StorageService', () => {
  let service: StorageFactoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StorageFactoryService],
    }).compile();

    service = module.get<StorageFactoryService>(StorageFactoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
