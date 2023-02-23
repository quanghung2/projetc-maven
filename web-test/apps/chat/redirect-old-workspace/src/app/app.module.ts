import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BrowserModule } from '@angular/platform-browser';
import { Route, RouterModule } from '@angular/router';
import { AppComponent } from './app.component';
import { RedirectWorkspaceComponent } from './redirect-workspace/redirect-workspace.component';

const routes: Route[] = [
  {
    path: ':type/:id',
    component: RedirectWorkspaceComponent
  },
  { path: '', redirectTo: 'team/empty', pathMatch: 'full' },
  { path: '**', redirectTo: 'team/empty' }
];

@NgModule({
  declarations: [AppComponent, RedirectWorkspaceComponent],
  imports: [
    BrowserModule,
    RouterModule.forRoot(routes, {
      initialNavigation: 'enabledBlocking',
      enableTracing: false,
      useHash: true
    }),
    MatProgressSpinnerModule
  ],
  providers: [],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  bootstrap: [AppComponent]
})
export class AppModule {}
