import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from './header.component';
import { HeaderActionComponent } from './header-action/header-action.component';
import { PortalModule } from '@angular/cdk/portal';

@NgModule({
  imports: [
    RouterModule,
    CommonModule,

    FlexLayoutModule,

    PortalModule,

    MatMenuModule,
    MatToolbarModule,
    MatButtonModule,
    MatTabsModule
  ],
  declarations: [HeaderComponent, HeaderActionComponent],
  exports: [HeaderComponent, HeaderActionComponent]
})
export class HeaderModule {}
