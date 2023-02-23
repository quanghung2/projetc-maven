import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { X } from '@b3networks/shared/common';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

X.init();

platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .catch(err => console.error(err));
