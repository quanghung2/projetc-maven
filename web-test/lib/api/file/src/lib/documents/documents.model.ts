import { UploadEvent } from '../s3/s3.service';

export class PresignDocumentResponse {
  url: string;
  header: any;

  constructor(obj?: any) {
    Object.assign(this, obj);
  }
}
export interface OrganizationResponse {
  name: string;
}

export class Category {
  id: number;
  name: string;
  uploadEvent: UploadEvent;

  constructor(obj?) {
    Object.assign(this, obj);
  }
}

export class FilesResponse {
  id: number;
  category: string;
  fileName: string;
  uploadedOn: string;
  uploadedByUuid: string;
  uploadedByEmail: string;

  constructor(obj?) {
    Object.assign(this, obj);
  }

  get uploadedAt() {
    var find = '/';
    var re = new RegExp(find, 'g');
    const uploadedAt = this.uploadedOn.replace(re, '-').replace(/(\d{2})-(\d{2})-(\d{4})/, '$2/$1/$3');
    return uploadedAt;
  }
}
