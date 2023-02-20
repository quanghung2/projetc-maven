import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { SharedUiMaterialModule } from './common/material-share/shared-ui-material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { SharedUiToastModule } from './common/toast/shared-ui-toast.module';
import { HeaderModule } from './sidebar/sidebar.module';
import { ROUTE_LINK } from './common/contants';

const routes: Routes = [
  {
    path: ROUTE_LINK.account,
    loadChildren: () => import('./account/account.module').then(m => m.AccountModule)
  },
  {
    path: ROUTE_LINK.department,
    loadChildren: () => import('./department/department.module').then(m => m.DepartmentModule)
  },
  { path: ROUTE_LINK.home, 
    loadChildren: () => import('./home/home.module').then(m => m.HomeModule) 
  },
  { path: '',loadChildren: () => import('./home/home.module').then(m => m.HomeModule)  
  }
]

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    SharedUiMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    HeaderModule,
    SharedUiToastModule.forRoot(),
    RouterModule.forRoot(routes, {
      initialNavigation: 'enabledBlocking',
      preloadingStrategy: PreloadAllModules,
      useHash: true
    }),
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
