import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { ActionBarComponent } from './action-bar/action-bar.component';
import { UpdateConfigComponent } from './register-webhook/register-webhook.component';
import { WebhookUrlComponent } from './webhook-url.component';

const routes: Routes = [{ path: '', component: WebhookUrlComponent }];

@NgModule({
  declarations: [WebhookUrlComponent, UpdateConfigComponent, ActionBarComponent],
  imports: [CommonModule, RouterModule.forChild(routes), SharedUiMaterialModule, FormsModule]
})
export class WebhookUrlModule {}
