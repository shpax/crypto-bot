import { Module } from '@nestjs/common';
import { BinanceApiService } from './binance.service';

@Module({
  providers: [BinanceApiService],
  exports: [BinanceApiService],
})
export class BinanceModule {}
