import { Test, TestingModule } from '@nestjs/testing';
import { AssetStateService } from './asset-state.service';

describe('AssetStateService', () => {
  let service: AssetStateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AssetStateService],
    }).compile();

    service = module.get<AssetStateService>(AssetStateService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
