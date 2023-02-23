import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

declare const X: any;

if (environment.production) {
  enableProdMode();
}

X.init();

platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .catch(err => console.error(err));
