import { HttpParams } from '@angular/common/http';
import { Application } from '@b3networks/api/app';
import { Pinnedapp } from '@b3networks/api/portal';
import { HashMap } from '@datorama/akita';

export enum PortalAppType {
  module = 'module',
  application = 'application'
}

export enum AppRenderType {
  iframe = 'iframe',
  webComponent = 'webComponent',
  blank = 'blank'
}

export enum RenderStatus {
  unloaded,
  loading,
  loaded
}

export class PortalApplication extends Application {
  id: string;
  orgUuid: string;
  modulePath: string;
  type: PortalAppType;
  version: string;
  renderType: AppRenderType;
  renderStatus: RenderStatus;
  webComponent: string;
  queryParams: HashMap<string[]>;
  monoIcon: string;
  monoType: 'svg' | 'font';

  pinned: boolean;
  pinnedOrder: number;
  order: number;
  pathPrefix: string;

  notificationCount: number;
  renderedAt: Date;
  isFeatureApp?: boolean;
  lastNavigate?: string;

  constructor(obj?: Partial<PortalApplication>) {
    super(obj);
    this.path = this.path || this.redirectUrl;
    this.renderType = this.renderType || AppRenderType.iframe;
    this.renderStatus = this.renderStatus || RenderStatus.unloaded;
    this.queryParams = this.queryParams || {};
    this.order = obj?.order;
    this.notificationCount = this.notificationCount || 0;

    if (this.path?.includes('?')) {
      try {
        const paths = this.path?.split('?');
        this.path = paths[0];

        const urlSearch = new URLSearchParams(paths[1]);
        const params = {};
        urlSearch.forEach((value, key) => {
          params[key] = [value];
        });
        this.queryParams = { ...this.queryParams, ...params };
      } catch (error) {
        // do nothing
      }
    }
  }

  static createApplication(obj?: Partial<PortalApplication>) {
    const app = new PortalApplication(obj);
    app.type = PortalAppType.application;
    return app;
  }

  static createPortalModule(name: string, modulePath: string, sourcePath: string, id?: string) {
    return new PortalApplication({
      name: name,
      modulePath: modulePath,
      path: sourcePath.endsWith('/') ? sourcePath : sourcePath + '/',
      appId: id,
      type: PortalAppType.module
    });
  }

  withPathPrefix(prefix: string) {
    this.pathPrefix = prefix;
    return this;
  }

  get pathIframe() {
    return this.lastNavigate?.split('/') || [];
  }

  get portalFragment() {
    return this.type === PortalAppType.application ? this.portalAppPath : this.modulePath;
  }

  get rightSourcePath() {
    let path = this.path;

    if (!path) {
      return '404';
    }

    let isValidUrl = false;
    try {
      const _ = new URL(path);
      isValidUrl = true;
    } catch (e) {
      // do nothing
    }
    if (!isValidUrl) {
      // internal app
      if (!!path && !!this.pathPrefix) {
        path = this.pathPrefix + path;
      }
      path = path.endsWith('/') ? path : path + '/';
      path = !this.version || this.version === '*' ? path : `${path}${this.version}/`;
    }

    let p = new HttpParams();
    Object.keys(this.queryParams).forEach(key => {
      if (this.queryParams[key] && this.queryParams[key].length > 0) {
        p = p.set(key, this.queryParams[key].join(','));
      }
    });

    if (this.isExternalApp) {
      p = p.set(`app_id`, this.appId).set('org_uuid', this.orgUuid);
    } else {
      p = p.set('orgUuid', this.orgUuid);
    }

    if (!this.isExternalApp) {
      // internal app will have hash in route
      path += '#/';
    }

    path += `?${p.toString()}`;

    return path;
  }

  get opening() {
    return this.renderStatus !== RenderStatus.unloaded;
  }

  get rendering() {
    return this.renderStatus !== RenderStatus.loaded;
  }

  get rendered() {
    return this.renderStatus === RenderStatus.loaded;
  }

  get htmlTag() {
    return this.renderType === AppRenderType.webComponent ? `<${this.webComponent}></${this.webComponent}>` : null;
  }

  get shouldOpenNewTab() {
    return this.renderType === AppRenderType.blank;
  }

  withOrg(orgUuid: string) {
    this.orgUuid = orgUuid;
    this.updateId();
    return this;
  }

  updateId() {
    this.id = this.orgUuid + '_' + this.portalFragment;
    return this;
  }

  withGkVersion(version: string) {
    this.version = version;
    return this;
  }

  withWebComponent(webComponent: string) {
    this.renderType = AppRenderType.webComponent;
    this.webComponent = webComponent;
    return this;
  }

  withPinned(info: Pinnedapp) {
    this.pinned = true;
    this.pinnedOrder = info.order;
  }
}

export function createApplication(params: Partial<PortalApplication>) {
  return new PortalApplication(params);
}
