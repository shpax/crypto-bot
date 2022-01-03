import { Injectable } from '@nestjs/common';
import { BinanceApiService } from 'src/binance/binance.service';
import { Asset } from 'src/storage/storage.interface';
import { prettify } from '../helpers';

@Injectable()
export class RendererService {
  constructor(private binanceApi: BinanceApiService) {}

  async bareAsset(asset: Asset) {
    const { amount, price, token } = asset;

    const value = amount * price;

    return `[${token}]:\t\t${[amount, price, value].map(prettify).join(' | ')}`;
  }

  async currentAsset(asset: Asset) {
    const { amount, token } = asset;
    const currentPrice = await this.binanceApi.getTokenPrice(token);

    const value = amount * currentPrice;

    return `[${token}]:\t\t${[amount, currentPrice, value]
      .map(prettify)
      .join(' | ')}`;
  }

  async profitAsset(asset: Asset) {
    const { amount, token, price } = asset;
    const currentPrice = await this.binanceApi.getTokenPrice(token);

    const profit = amount * (currentPrice - price);
    const profitScaled = +((currentPrice / price) * 100).toFixed(0);

    return `[${token}]:\t\t${[amount, profitScaled, profit]
      .map(prettify)
      .join(' | ')}`;
  }

  code(text: string) {
    return `\`\`\`\n${text}\`\`\``;
  }
}
