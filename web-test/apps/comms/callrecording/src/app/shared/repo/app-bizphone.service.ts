import { forwardRef, Inject, Injectable } from '@angular/core';
import { BackendService } from '../service/backend.service';
import { environment } from './../../../environments/environment';

const BIZ_PHONE_LICENSE_PATH = '/private/v2/licenses/bizphone';

@Injectable()
export class AppBizPhone {
  private msEndpoint: string = environment.api.endpoint;

  constructor(
    @Inject(forwardRef(() => BackendService))
    private backendService: BackendService
  ) {}

  getConfig(): Promise<any> {
    return this.backendService.get(BIZ_PHONE_LICENSE_PATH);
  }

  setConfig(configs: any): Promise<any> {
    try {
      configs.forEach(config => {
        config.extensionKey = config.ext.extensionKey;
        delete config.ext;
      });
    } catch (e) {}
    return this.backendService.post(BIZ_PHONE_LICENSE_PATH, configs);
  }
}
