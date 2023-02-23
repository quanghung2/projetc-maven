import { forwardRef, Inject, Injectable } from '@angular/core';
import { BackendService } from '../service/backend.service';
import { environment } from './../../../environments/environment';

const APPS_PATH = '/apps/private/v2';

@Injectable()
export class MsApps {
  private msEndpoint: string = environment.api.endpoint;

  private apps: any = {};
  private appIds: Object = environment.app.apps;

  public appIconMapper: any = {
    sip: {
      name: 'SIP',
      icon: 'https://ui.b3networks.com/external/icon/sip_128x128.png'
    },
    biz_phone: {
      name: 'BizPhone',
      icon: 'https://ui.b3networks.com/external/images/app-logo/bizphone_128x128.png'
    },
    direct_line: {
      name: 'Direct Line',
      icon: 'https://ui.b3networks.com/external/icon/directline_128x128.png'
    },
    virtual_line: {
      name: 'Virtual Line',
      icon: 'https://ui.b3networks.com/external/icon/virtualline_128x128_2.png'
    },
    extensions: {
      name: 'Extensions',
      icon: 'https://ui.b3networks.com/external/images/app-logo/bizphone_128x128.png'
    },
    wallboard: {
      name: 'Wallboard',
      icon: 'https://ui.b3networks.com/platform/product-old/455649e7-95fc-43eb-8a66-ec5b88755d13.png'
    }
  };

  constructor(
    @Inject(forwardRef(() => BackendService))
    private backendService: BackendService
  ) {}

  getApps(appIds: Array<any>, force: boolean = false): Promise<any> {
    const waiters = [];

    appIds.forEach(appId => {
      const waiter = this.getApp(appId);
      waiters.push(waiter);
    });

    return Promise.all(waiters).then(() => this.apps);
  }

  getApp(appId: string, force: boolean = false): Promise<any> {
    if (!force && this.apps[appId] != undefined) {
      return Promise.resolve(this.apps[appId]);
    }

    return this.backendService.get(this.getEndpoint('/application/' + appId)).then(app => {
      this.apps[appId] = app;
      return app;
    });
  }

  getEndpoint(path: string) {
    return this.backendService.parseApiUrl(APPS_PATH + path, false, this.msEndpoint);
  }

  getWithApps(waiters: Array<any>) {
    const appsWaiter = this.getApps(Object.keys(this.appIds).map(k => this.appIds[k]));
    waiters.push(appsWaiter);
    return Promise.all(waiters);
  }

  getAppInfo(appName) {
    const res: any = {};
    try {
      appName = appName.toLowerCase();
      let appId;
      if (appName.indexOf('sip') >= 0) {
        appId = this.appIds['sip'];
        res.appLogo = this.appIconMapper.sip.icon;
        res.appName = this.appIconMapper.sip.name;
      } else if (appName.indexOf('virtual') >= 0) {
        appId = this.appIds['virtualline'];
        res.appLogo = this.appIconMapper.virtual_line.icon;
        res.appName = this.appIconMapper.virtual_line.name;
      } else if (appName.indexOf('direct') >= 0) {
        appId = this.appIds['directline'];
        res.appLogo = this.appIconMapper.direct_line.icon;
        res.appName = this.appIconMapper.direct_line.name;
      } else if (appName.indexOf('biz') >= 0) {
        appId = this.appIds['bizphone'];
        res.appLogo = this.appIconMapper.biz_phone.icon;
        res.appName = this.appIconMapper.biz_phone.name;
      } else if (appName.indexOf('cr') >= 0) {
        appId = this.appIds['cr'];
      } else if (appName.indexOf('extension') >= 0) {
        appId = this.appIds['extension'];
        res.appLogo = this.appIconMapper.biz_phone.icon;
        res.appName = this.appIconMapper.biz_phone.name;
      } else if (appName.indexOf('wallboard') >= 0) {
        appId = this.appIds['wallboard'];
        res.appLogo = this.appIconMapper.wallboard.icon;
        res.appName = this.appIconMapper.wallboard.name;
      }

      if (!res.appLogo) {
        res.appLogo = this.apps[appId].iconUrl;
      }

      if (!res.appName) {
        res.appName = this.apps[appId].name;
      }
    } catch (e) {}
    return res;
  }
}
