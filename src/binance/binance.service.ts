import { Injectable } from '@nestjs/common';
import got from 'got';

@Injectable()
export class BinanceApiService {
  async getTokenPrice(token: string): Promise<number> {
    const res = await got(
      `https://api1.binance.com/api/v3/avgPrice?symbol=${token}`,
    ).json();

    return +(res as { price: string }).price;
  }
}
