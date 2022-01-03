import { Injectable, Logger } from '@nestjs/common';

import { Message } from 'telegraf/typings/core/types/typegram';
import { Context, Markup } from 'telegraf';
import { BinanceApiService } from 'src/binance/binance.service';
import { Asset, Storage } from 'src/storage/storage.interface';
import { prettify } from '../helpers';
import { RendererService } from '../renderer/renderer.service';

export const ASSET_DIALOG_ID = 1;

export const STEP_CHOOSE_ACTION = 1;
export const STEP_CHOOSE_ACTION_RESPONSE = 2;
export const STEP_ENTER_PRICE = 3;
export const STEP_ENTER_AMOUNT = 4;
export const STEP_CONFIRM_ASSET = 5;

const KEY_ADD = 'Добавить';
const KEY_SELL = 'Продать';
const KEY_DELETE = 'Удалить';
const KEY_CONFIRM = 'Да';
const KEY_CANCEL = 'Отмена';

interface Key {
  key: string;
}

@Injectable()
export class AssetStateService {
  private readonly logger = new Logger(AssetStateService.name);

  constructor(
    private binanceApi: BinanceApiService,
    private renderer: RendererService,
  ) {}

  async run(ctx: Context, storage: Storage) {
    const session = await storage.getSession();

    switch (session.stage) {
      case STEP_CHOOSE_ACTION:
        return this.actionSelectAction(ctx, storage);
      case STEP_CHOOSE_ACTION_RESPONSE:
        return this.actionSelectActionResponse(ctx, storage);
      case STEP_ENTER_PRICE:
        return this.actionEnterPrice(ctx, storage);
      case STEP_ENTER_AMOUNT:
        return this.actionEnterAmount(ctx, storage);
      case STEP_CONFIRM_ASSET:
        return this.actionSaveAsset(ctx, storage);
    }
  }

  async actionSelectAction(ctx: Context, storage: Storage) {
    const message = ctx.message as Message.TextMessage;
    const tokenMatch = message.text.match(/[A-Z0-9]+/g);
    if (tokenMatch && tokenMatch[0]) {
      const assetName = tokenMatch[0];

      const asset = await storage.getAsset(assetName);

      if (asset) {
        ctx.reply(
          `Найдена запись\\:\n` +
            this.renderer.code(await this.renderer.bareAsset(asset)),
          { parse_mode: 'MarkdownV2' },
        );

        setTimeout(
          () =>
            ctx.reply(
              `Что вы хотите сделать?`,
              Markup.keyboard([KEY_ADD, KEY_SELL, KEY_DELETE])
                .oneTime()
                .resize(),
            ),
          100,
        );
      } else {
        ctx.reply(
          `Желаете добавить ${assetName}?`,
          Markup.keyboard([KEY_ADD]).oneTime().resize(),
        );
      }

      storage.setSession({
        dialog: ASSET_DIALOG_ID,
        stage: STEP_CHOOSE_ACTION_RESPONSE,
        payload: { token: assetName },
      });
    } else {
      ctx.reply(
        'Непонятное имя токена, введите пару [валюта]USDT, например BTCUSDT',
      );
    }
  }

  async deleteToken(ctx: Context, storage: Storage) {
    const [session, assets] = await Promise.all([
      storage.getSession<Asset>(),
      storage.getAssets(),
    ]);

    if (session.payload.token) {
      await storage.setAssets(
        assets.filter((a) => a.token != session.payload.token),
      );

      ctx.reply('Готово');
      storage.resetSession();
    }
  }

  async changeToken(ctx: Context, storage: Storage, key: string) {
    const session = await storage.getSession<Asset & Key>();
    if (session.payload.token) {
      const tokenPrice = await this.binanceApi.getTokenPrice(
        session.payload.token as string,
      );

      ctx.reply(
        `Введите стоимость ${key == KEY_ADD ? 'покупки' : 'продажи'}`,
        Markup.keyboard([String(prettify(tokenPrice))])
          .oneTime()
          .resize(),
      );

      session.stage = STEP_ENTER_PRICE;
      session.payload.key = key;

      storage.setSession(session);
    }
  }

  async actionEnterPrice(ctx: Context, storage: Storage) {
    const session = await storage.getSession<Asset & Key>();
    const message = ctx.message as Message.TextMessage;

    const isBuy = session.payload.key === KEY_ADD;
    const price = +message.text;

    if (isNaN(price)) {
      return ctx.reply('Неправильное число!');
    }

    ctx.reply(`Введите количество монет для ${isBuy ? 'покупки' : 'продажи'}`);

    session.payload.price = price;
    session.stage = STEP_ENTER_AMOUNT;

    await storage.setSession(session);
  }

  async actionEnterAmount(ctx: Context, storage: Storage) {
    const session = await storage.getSession<Asset & Key>();
    const message = ctx.message as Message.TextMessage;
    const { token, price, key } = session.payload;
    const isBuy = key === KEY_ADD;
    const asset = await storage.getAsset(token);

    const amount = +message.text;

    if (isNaN(amount)) {
      return ctx.reply('Неправильное число!');
    }

    const value = price * amount;

    session.payload.amount = amount;
    session.stage = STEP_CONFIRM_ASSET;

    let text =
      `Вы ${isBuy ? 'добавляете' : 'продаете'}\\: \n` +
      this.renderer.code(
        await this.renderer.bareAsset({ token, amount, price }),
      );

    if (asset) {
      const oldValue = asset.price * asset.amount;
      const newAmount = isBuy ? amount + asset.amount : asset.amount - amount;
      const newPrice = isBuy ? (oldValue + value) / newAmount : asset.price;

      text +=
        `\nС учетом имеющихся активов\\:\n` +
        this.renderer.code(
          await this.renderer.bareAsset({
            token,
            amount: newAmount,
            price: newPrice,
          }),
        );

      session.payload.price = newPrice;
      session.payload.amount = newAmount;
    }

    await storage.setSession(session);
    ctx.reply(text, {
      parse_mode: 'MarkdownV2',
    });

    ctx.reply(
      'Все верно?',
      Markup.keyboard([KEY_CONFIRM, KEY_CANCEL]).oneTime().resize(),
    );
  }

  async actionSaveAsset(ctx: Context, storage: Storage) {
    const message = ctx.message as Message.TextMessage;
    const assets = await storage.getAssets();
    const session = await storage.getSession<Asset>();

    const newAsset = session.payload;

    switch (message.text) {
      case KEY_CONFIRM:
        const otherAssets = assets.filter((a) => a.token !== newAsset.token);

        await storage.setAssets(
          newAsset.amount > 0.00001 ? [...otherAssets, newAsset] : otherAssets,
        );
        await storage.resetSession();
        return ctx.reply('Готово');

      case KEY_CANCEL:
        await storage.resetSession();
        return ctx.reply('Ок, забыли');
    }
  }

  async actionSelectActionResponse(ctx: Context, storage: Storage) {
    const message = ctx.message as Message.TextMessage;
    switch (message.text) {
      case KEY_DELETE:
        return this.deleteToken(ctx, storage);
      case KEY_ADD:
      case KEY_SELL:
        return this.changeToken(ctx, storage, message.text);
    }
  }
}
