import { Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';
import { BinanceModule } from 'src/binance/binance.module';
import { StorageModule } from 'src/storage/storage.module';
import { BotService } from './bot.service';
import { AssetStateService } from './asset-state/asset-state.service';
import { RendererService } from './renderer/renderer.service';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TelegrafModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        token: configService.get<string>('TELEGRAM_BOT_TOKEN'),
      }),
      inject: [ConfigService],
    }),
    StorageModule,
    BinanceModule,
  ],
  providers: [BotService, AssetStateService, RendererService],
})
export class BotModule {}
