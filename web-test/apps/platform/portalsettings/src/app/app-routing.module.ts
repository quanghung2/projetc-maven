import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { ErrorComponent } from './components/error/error.component';
import { InvoicePermissionComponent } from './components/invoice-permission/invoice-permission.component';
import { PermissionErrorComponent } from './components/permission-error/permission-error.component';
import { AppGuardService, AppInvoiceGuardService } from './core/services';
import { ConfirmDeactivateService } from './core/services/confirm-deactivate.service';
import { DomainSettingsComponent } from './domain-settings/domain-settings.component';
import { GeneralComponent } from './general/general.component';
import { PortalConfigComponent } from './portal-config/portal-config.component';
import { TaxComponent } from './tax/tax.component';

const routes: Routes = [
  {
    path: 'general',
    component: GeneralComponent,
    canActivate: [AppGuardService],
    canDeactivate: [ConfirmDeactivateService]
  },
  {
    path: 'domain-settings',
    component: DomainSettingsComponent,
    canActivate: [AppGuardService],
    canDeactivate: [ConfirmDeactivateService]
  },
  { path: 'portal-config', component: PortalConfigComponent, canActivate: [AppGuardService] },
  { path: 'tax', component: TaxComponent, canActivate: [AppGuardService] },
  {
    path: 'security',
    canActivate: [AppGuardService],
    loadChildren: () => import('./security/security.module').then(m => m.SecurityModule)
  },
  {
    path: 'invoice',
    canActivate: [AppGuardService, AppInvoiceGuardService],
    loadChildren: () => import('./invoice/invoice.module').then(m => m.InvoiceModule)
  },
  { path: 'invoice-permission', component: InvoicePermissionComponent },
  { path: 'permission', component: PermissionErrorComponent },
  { path: '', pathMatch: 'full', redirectTo: 'general' },
  { path: '**', component: ErrorComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })],
  exports: [RouterModule]
})
export class AppRoutingModule {}
