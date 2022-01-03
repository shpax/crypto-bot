import { Update, Command, Ctx, On } from 'nestjs-telegraf';
import { BinanceApiService } from 'src/binance/binance.service';
import { StorageFactoryService } from 'src/storage/storage-factory.service';
import { Asset } from 'src/storage/storage.interface';
import { Context } from 'telegraf';
import { Message } from 'telegraf/typings/core/types/typegram';
import {
  AssetStateService,
  ASSET_DIALOG_ID,
  STEP_CHOOSE_ACTION,
} from './asset-state/asset-state.service';
import { prettify } from './helpers';
import { RendererService } from './renderer/renderer.service';

@Update()
export class BotService {
  constructor(
    private storageFactory: StorageFactoryService,
    private binanceApi: BinanceApiService,
    private assetState: AssetStateService,
    private renderer: RendererService,
  ) {}

  private getStorage(ctx: Context) {
    return this.storageFactory.create(ctx.from.id);
  }

  @Command('hello')
  async hello(@Ctx() ctx: Context) {
    await ctx.reply(`Welcome ${(ctx.message as Message.TextMessage).text}`);
  }

  private async renderAssets(
    ctx: Context,
    renderFunc: (a: Asset) => Promise<string>,
  ) {
    const storage = this.getStorage(ctx);

    await storage.resetSession();
    const assets = await storage.getAssets();

    if (assets.length) {
      const assetsMd = await Promise.all(assets.map(renderFunc));

      ctx.reply(this.renderer.code(assetsMd.join('\n')), {
        parse_mode: 'MarkdownV2',
      });
    } else {
      ctx.reply('У вас нет сохраненных активов');
    }
  }

  @Command('assets')
  async assets(@Ctx() ctx: Context) {
    const storage = this.getStorage(ctx);

    await storage.resetSession();
    const assets = await storage.getAssets();

    if (assets.length) {
      const assetsMd = await Promise.all(
        assets.map((a) => this.renderer.bareAsset(a)),
      );

      ctx.reply(this.renderer.code(assetsMd.join('\n')), {
        parse_mode: 'MarkdownV2',
      });
    } else {
      ctx.reply('У вас нет сохраненных активов');
    }
  }

  @Command('status')
  async status(@Ctx() ctx: Context) {
    await this.renderAssets(ctx, (a) => this.renderer.currentAsset(a));
  }

  @Command('profits')
  async profits(@Ctx() ctx: Context) {
    await this.renderAssets(ctx, (a) => this.renderer.profitAsset(a));
  }

  @On('text')
  async handleText(@Ctx() ctx: Context) {
    const session = await this.getStorage(ctx).getSession();

    if (session.dialog === ASSET_DIALOG_ID && session.stage) {
      await this.assetState.run(ctx, this.getStorage(ctx));
    } else {
      await this.assetStatus(ctx);
    }
  }

  private async assetStatus(ctx: Context) {
    const { text } = ctx.message as Message.TextMessage;
    const match = text.match(/[A-Z0-9]+/);
    if (match) {
      const token = match[0];

      await this.getStorage(ctx).setSession({
        dialog: ASSET_DIALOG_ID,
        stage: STEP_CHOOSE_ACTION,
        payload: { token },
      });

      await this.assetState.run(ctx, this.getStorage(ctx));
    }
  }
}
