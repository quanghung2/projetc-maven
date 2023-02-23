import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { ClipboardModule } from 'ngx-clipboard';
import { LandingPageComponent } from './landing-page.component';
import { StoreAnnouncementComponent } from './store-announcement/store-announcement.component';

const routes: Routes = [{ path: '', component: LandingPageComponent }];

@NgModule({
  declarations: [LandingPageComponent, StoreAnnouncementComponent],
  imports: [CommonModule, SharedUiMaterialModule, FormsModule, ClipboardModule],
  exports: [LandingPageComponent]
})
export class LandingPageModule {}

@NgModule({ imports: [LandingPageModule, RouterModule.forChild(routes)] })
export class LandingPageFeatureModule {}
