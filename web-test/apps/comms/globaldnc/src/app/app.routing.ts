import { RouterModule, Routes } from '@angular/router';
import { AdminToolsComponent } from './admin-tools/admin-tools.component';
import { CheckNumberComponent } from './check-number/check-number.component';
import { ComplianceWindowComponent } from './compliance-window/compliance-window.component';
import { CompliantFlagComponent } from './compliant-flag/compliant-flag.component';
import { ErrorPageComponent } from './error-page';
import { LandingComponent } from './landing/landing.component';
import { ListManagementComponent } from './list-management/list-management.component';
import { OrgLinksComponent } from './org-links/org-links.component';
import { UserManagementComponent } from './user-management/user-management.component';

export const routes: Routes = [
  { path: '', redirectTo: '/landing', pathMatch: 'full' },
  { path: 'compliance-window', component: ComplianceWindowComponent },
  { path: 'list-management', component: ListManagementComponent },
  { path: 'org-links', component: OrgLinksComponent },
  { path: 'check-number', component: CheckNumberComponent },
  { path: 'user-management', component: UserManagementComponent },
  { path: 'admin-tools', component: AdminToolsComponent },
  { path: 'landing', component: LandingComponent },
  { path: 'compliant-flag', component: CompliantFlagComponent },
  { path: 'error', component: ErrorPageComponent }
];

export const appRoutingProviders: any[] = [];

export const appRouting = RouterModule.forRoot(routes, { useHash: true });
