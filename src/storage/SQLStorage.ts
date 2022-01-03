import {
  Connection,
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
} from 'typeorm';

import { Asset, Session, Storage } from './storage.interface';

interface UserData<T = unknown> {
  assets: Asset[];
  session: Session<T>;
}

@Entity()
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  data: string;

  getData<T>() {
    return JSON.parse(this.data) as UserData<T>;
  }

  setData(data: UserData) {
    this.data = JSON.stringify(data);
  }
}

export class SQLStorage implements Storage {
  private userRecord: User | null = null;
  private userData: UserData | null = null;

  constructor(private userId: number, private connection: Connection) {}

  private async createEmptyUser() {
    const user = new User();

    user.setData({
      session: { dialog: 0, stage: 0, payload: {} },
      assets: [],
    });

    user.id = this.userId;

    await user.save();

    return user;
  }

  private async getUserData<T = object>() {
    if (!this.userData) {
      this.userRecord = await User.findOne({ id: this.userId });

      if (!this.userRecord) {
        this.userRecord = await this.createEmptyUser();
      }
      this.userData = this.userRecord.getData();
    }

    return this.userData as UserData<T>;
  }

  private async setUserData(data: UserData) {
    if (!this.userRecord) {
      await this.getUserData();
    }

    this.userRecord.setData(data);
    this.userData = data;

    return this.userRecord.save();
  }

  async resetSession(): Promise<void> {
    const data = await this.getUserData();

    data.session = {
      dialog: 0,
      stage: 0,
      payload: {},
    };

    await this.setUserData(data);
  }

  async getAssets(): Promise<Asset[]> {
    return (await this.getUserData()).assets;
  }

  async setAssets(list: Asset[]): Promise<void> {
    const data = await this.getUserData();

    data.assets = list;

    await this.setUserData(data);
  }

  async getAsset(token: string): Promise<Asset> {
    const assets = await this.getAssets();

    return assets.find((a) => a.token === token);
  }

  async getSession<T = object>(): Promise<Session<T>> {
    return (await this.getUserData<T>()).session;
  }

  async setSession<T = object>(session: Session<T>): Promise<void> {
    const data = await this.getUserData<T>();

    data.session = session;

    await this.setUserData(data);
  }
}
