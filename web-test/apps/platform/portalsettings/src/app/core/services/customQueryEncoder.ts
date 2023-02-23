import { HttpUrlEncodingCodec } from '@angular/common/http';

export class CustomQueryEncoder extends HttpUrlEncodingCodec {
  override encodeValue(v: string): string {
    v = encodeURIComponent(v + '');

    if (v.indexOf('+') != -1) {
      return v.replace('+', '%2B');
    }
    return v;
  }
}
