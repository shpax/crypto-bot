export interface Asset {
  amount: number;
  price: number;
  token: string;
}

export interface Session<T> {
  dialog: number;
  stage: number;
  payload: T;
}

export const STORAGE = 'STORAGE';

export interface Storage {
  getAssets(): Promise<Asset[]>;
  setAssets(list: Asset[]): Promise<void>;

  getAsset(token: string): Promise<Asset | null>;

  resetSession(): Promise<void>;
  getSession<T = object>(): Promise<Session<T>>;
  setSession<T = object>(data: Session<T>): Promise<void>;
}
