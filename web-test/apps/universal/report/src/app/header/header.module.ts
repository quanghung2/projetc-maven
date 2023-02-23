import { NgModule } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { HeaderComponent } from './header.component';

@NgModule({
  declarations: [HeaderComponent],
  imports: [MatToolbarModule],
  exports: [HeaderComponent],
  providers: []
})
export class HeaderModule {}
