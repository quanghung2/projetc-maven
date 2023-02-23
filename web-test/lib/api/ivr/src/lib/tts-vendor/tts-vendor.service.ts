import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { cacheable, HashMap } from '@datorama/akita';
import { tap } from 'rxjs/operators';
import { TtsVendor2 } from './tts-vendor.model';
import { TtsVendorStore } from './tts-vendor.store';

@Injectable({ providedIn: 'root' })
export class TtsVendorService {
  constructor(private ttsVendorStore: TtsVendorStore, private http: HttpClient) {}

  /**
   * Cached request and return EMPTY observable when recall.
   * So should use query to get data instead of subscribe from this.
   */
  get() {
    const req$ = this.http.get<HashMap<HashMap<TtsVendor2>>>('workflow/private/v1/tts').pipe(
      tap(tts => {
        const list: TtsVendor2[] = [];
        if (tts) {
          Object.keys(tts).forEach(lan => {
            const ttsList = tts[lan];
            Object.keys(ttsList).forEach(code => {
              list.push(<TtsVendor2>{ language: lan, code: `${lan}-${code}`, voiceCode: code, ...ttsList[code] });
            });
          });
        }
        this.ttsVendorStore.update({ languages: Object.keys(tts) });
        this.ttsVendorStore.set(list);
      })
    );

    return cacheable(this.ttsVendorStore, req$);
  }
}
