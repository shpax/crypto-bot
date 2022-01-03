import { Test, TestingModule } from '@nestjs/testing';
import { BinanceApiService } from './binance.service';

describe('BinanceService', () => {
  let service: BinanceApiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BinanceApiService],
    }).compile();

    service = module.get<BinanceApiService>(BinanceApiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
