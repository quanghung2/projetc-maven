import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { TESTING_DOMAIN } from '@b3networks/shared/common';
import { enableAkitaProdMode } from '@datorama/akita';
import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
  enableAkitaProdMode();
  if (location.host !== atob(TESTING_DOMAIN)) {
    console.log = function () {
      // donothing
    };
  }
}

platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .catch(err => console.error(err));
