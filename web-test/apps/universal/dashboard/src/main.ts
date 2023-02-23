import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { USER_INFO, X } from '@b3networks/shared/common';
import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
  console.log = () => undefined;
}

X.init();

// that for use from public link
if (!X[USER_INFO.orgUuid] || !X[USER_INFO.sessionToken]) {
  let match;
  const pl = /\+/g, // Regex for replacing addition symbol with a space
    search = /([^&=]+)=?([^&]*)/g,
    decode = function (s) {
      return decodeURIComponent(s.replace(pl, ' '));
    },
    query = window.location.hash.split('?')[1];

  const urlParams = {};
  while ((match = search.exec(query))) {
    urlParams[decode(match[1])] = decode(match[2]);
  }

  if (!X[USER_INFO.orgUuid]) {
    X[USER_INFO.orgUuid] = urlParams[USER_INFO.orgUuid];
  }

  if (!X[USER_INFO.sessionToken]) {
    X[USER_INFO.sessionToken] = urlParams[USER_INFO.sessionToken];
  }
}

platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .catch(err => console.error(err));
