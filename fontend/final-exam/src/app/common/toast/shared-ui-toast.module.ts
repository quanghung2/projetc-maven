import { OverlayModule } from '@angular/cdk/overlay';
import { CommonModule } from '@angular/common';
import { ModuleWithProviders, NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { defaultToastConfig, TOAST_CONFIG_TOKEN } from './config/toast-configs';
import { ToastComponent } from './toast.component';

@NgModule({
  imports: [CommonModule, MatIconModule, MatButtonModule, FlexLayoutModule, MatProgressBarModule, OverlayModule],
  declarations: [ToastComponent]
})
export class SharedUiToastModule {
  public static forRoot(config = defaultToastConfig): ModuleWithProviders<SharedUiToastModule> {
    return {
      ngModule: SharedUiToastModule,
      providers: [
        {
          provide: TOAST_CONFIG_TOKEN,
          useValue: { ...defaultToastConfig, ...config }
        }
      ]
    };
  }
}
