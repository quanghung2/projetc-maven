import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule, Routes } from '@angular/router';
import { AppComponent } from './app.component';
import { DefaultComponent } from './default/default.component';
import { RedirectComponent } from './redirect/redirect.component';

const routes: Routes = [
  { path: '', component: DefaultComponent },
  { path: ':segment', component: RedirectComponent }
];

@NgModule({
  declarations: [AppComponent, RedirectComponent, DefaultComponent],
  imports: [BrowserModule, RouterModule.forRoot(routes, { useHash: true }), MatButtonModule, MatProgressSpinnerModule],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}
