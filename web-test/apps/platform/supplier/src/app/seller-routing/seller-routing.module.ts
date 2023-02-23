import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Route, RouterModule } from '@angular/router';
import { CommsCallcenterSharedModule } from '@b3networks/comms/callcenter/shared';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { ClipboardModule } from 'ngx-clipboard';
import { DeleteSellerRoutingComponent } from './delete-seller-routing/delete-seller-routing.component';
import { SellerRoutingComponent } from './seller-routing.component';
import { UpdateSellerRoutingComponent } from './update-seller-routing/update-seller-routing.component';

const routes: Route[] = [{ path: '', component: SellerRoutingComponent }];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild(routes),
    SharedCommonModule,
    CommsCallcenterSharedModule,
    FlexLayoutModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatIconModule,
    MatTableModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressBarModule,
    MatInputModule,
    MatButtonModule,
    MatDialogModule,
    ClipboardModule,
    MatTooltipModule,
    MatPaginatorModule,
    MatAutocompleteModule,
    SharedUiMaterialModule
  ],
  declarations: [SellerRoutingComponent, UpdateSellerRoutingComponent, DeleteSellerRoutingComponent]
})
export class SellerRoutingModule {}
