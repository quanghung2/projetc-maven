import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Route, RouterModule } from '@angular/router';
import { LandingComponent } from './landing.component';

const routes: Route[] = [{ path: '', component: LandingComponent }];

@NgModule({
  declarations: [LandingComponent],
  imports: [MatCardModule, FlexLayoutModule, RouterModule.forChild(routes)],
  providers: [MatSnackBar]
})
export class LandingModule {}
