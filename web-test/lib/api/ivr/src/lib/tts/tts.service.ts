import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import * as _ from 'lodash';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { TtsVendor } from './tts-vendor';

@Injectable({ providedIn: 'root' })
export class TtsService {
  private ttsVendorData: any;

  constructor(protected http: HttpClient) {}

  getSupportVendors(): Observable<any> {
    if (this.ttsVendorData) {
      return of(this.ttsVendorData);
    }
    return this.http.get<any>('workflow/private/v1/tts').pipe(
      map(res => {
        this.ttsVendorData = res;
        return res;
      })
    );
  }

  findTtsVendors(languageCode: string): TtsVendor[] {
    if (!this.ttsVendorData || !languageCode) {
      return [];
    }

    try {
      let result = _.map(_.keys(this.ttsVendorData[languageCode]), key => {
        const tts = this.ttsVendorData[languageCode][key];
        return new TtsVendor(tts.vendor, tts.gender, tts.voiceName, tts.mappingName, key);
      });

      result = this.sortTtsVendors(result);

      return result;
    } catch (e) {
      return [];
    }
  }

  findTtsVendor(languageCode: string, ttsVendorCode: string): TtsVendor {
    if (!this.ttsVendorData || !languageCode || !ttsVendorCode) {
      return undefined;
    }

    try {
      const rawTtsVendor = this.ttsVendorData[languageCode][ttsVendorCode];
      return new TtsVendor(
        rawTtsVendor.vendor,
        rawTtsVendor.gender,
        rawTtsVendor.voiceName,
        rawTtsVendor.mappingName,
        ttsVendorCode
      );
    } catch (e) {
      return undefined;
    }
  }

  findDefaultTtsVendor(languageCode: string): TtsVendor {
    if (!this.ttsVendorData || !languageCode) {
      return undefined;
    }

    try {
      const ttsVendors = this.findTtsVendors(languageCode);
      return ttsVendors[0];
    } catch (e) {
      return undefined;
    }
  }

  testPlayMessageByPhoneCall(dest: string, tts): Observable<any> {
    const requestParams = {
      number: dest,
      tts: tts
    };
    return this.http.post(`workflow/private/v1/workflow/testcall`, requestParams);
  }

  private sortTtsVendors(ttsVendors: TtsVendor[]): TtsVendor[] {
    if (!ttsVendors) {
      return [];
    }

    return _.sortBy(ttsVendors, (item: TtsVendor) => {
      let value = item.gender.toLowerCase() === 'female' ? 0 : 10;
      if (item.vendor.toLowerCase() === 'azure') {
        value += 1;
      } else if (item.vendor.toLowerCase() === 'baidu') {
        value += 2;
      } else if (item.vendor.toLowerCase() === 'google') {
        value += 3;
      } else if (item.vendor.toLowerCase() === 'ispeech') {
        value += 4;
      } else {
        value += 5;
      }
      return value;
    });
  }
}
