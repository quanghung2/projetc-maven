import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Route, RouterModule } from '@angular/router';
import { CommsCallcenterSharedModule } from '@b3networks/comms/callcenter/shared';
import { SharedCommonModule } from '@b3networks/shared/common';
import { SharedUiMaterialModule } from '@b3networks/shared/ui/material';
import { CreateProductSkuComponent } from './create-sku/create-sku.component';
import { DeleteSkuMappingComponent } from './delete-sku-mapping/delete-sku-mapping.component';
import { ImportSkuMappingsComponent } from './import-sku-mappings/import-sku-mappings.component';
import { LoadPrefixesComponent } from './load-prefixes/load-prefixes.component';
import { SkuMappingComponent } from './sku-mapping.component';
import { UpdateSkuMappingComponent } from './update-sku-mapping/update-sku-mapping.component';

const routes: Route[] = [{ path: '', component: SkuMappingComponent }];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild(routes),
    SharedCommonModule,
    CommsCallcenterSharedModule,
    FlexLayoutModule,
    MatTableModule,
    MatTooltipModule,
    MatDividerModule,
    MatPaginatorModule,
    MatInputModule,
    MatButtonModule,
    MatChipsModule,
    MatDialogModule,
    MatSelectModule,
    MatIconModule,
    MatAutocompleteModule,
    MatProgressSpinnerModule,
    SharedUiMaterialModule
  ],
  declarations: [
    SkuMappingComponent,
    UpdateSkuMappingComponent,
    LoadPrefixesComponent,
    DeleteSkuMappingComponent,
    ImportSkuMappingsComponent,
    CreateProductSkuComponent
  ]
})
export class SkuMappingModule {}
