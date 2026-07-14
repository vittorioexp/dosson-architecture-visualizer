export interface StorageObject {
  key: string;
  size: number;
  lastModified: Date;
}

export interface IStorageService {
  upload(key: string, data: Buffer, contentType?: string): Promise<string>;
  download(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  getUrl(key: string): string;
}
