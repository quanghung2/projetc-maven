import { RouterModule, Routes } from '@angular/router';

import { PageNotFoundComponent } from './exception';
import { SubscriptionComponent } from './subscription';
import { HistoryComponent } from './history';
import { PaymentComponent } from './payment';
import { ManagerComponent } from './manager/manager.component';
import { MainComponent } from './main/main.component';
import { NewComplianceComponent } from './new-compliance/new-compliance.component';
import { NewHistoryComponent } from './new-history/new-history.component';
import { AccessDeniedComponent } from './access-denied/access-denied.component';

const appRoutes: Routes = [
  {
    path: 'main',
    component: MainComponent
  },
  {
    path: 'subscriptions',
    component: SubscriptionComponent
  },
  {
    path: 'histories',
    component: HistoryComponent
  },
  {
    path: 'payment',
    component: PaymentComponent
  },
  {
    path: 'managers',
    component: ManagerComponent
  },
  {
    path: 'settings',
    component: NewComplianceComponent
  },
  {
    path: 'history',
    component: NewHistoryComponent
  },
  {
    path: 'access-denied',
    component: AccessDeniedComponent
  },
  {
    path: '',
    redirectTo: '/main',
    pathMatch: 'full'
  },
  {
    path: '**',
    component: PageNotFoundComponent
  }
];

export const AppRoutes = RouterModule.forRoot(appRoutes);
