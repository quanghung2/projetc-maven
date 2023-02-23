import { ClipboardModule } from '@angular/cdk/clipboard';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { LayoutModule } from '@angular/cdk/layout';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatOptionModule, MatRippleModule } from '@angular/material/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatStepperModule } from '@angular/material/stepper';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTreeModule } from '@angular/material/tree';
import { MatDatepickerModule } from '@matheo/datepicker';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { ShmMiniFabButton, ShmMiniFabComponent, ShmMiniFabTitle } from './components/button/button/button.component';
import { ButtonLoadingDirective } from './directives/button-loading.directive';

const providers = [
  MatCheckboxModule,
  MatMenuModule,
  MatSidenavModule,
  MatToolbarModule,
  MatButtonModule,
  MatCardModule,
  MatListModule,
  MatPaginatorModule,
  MatTableModule,
  MatProgressBarModule,
  MatSnackBarModule,
  MatIconModule,
  MatGridListModule,
  MatDialogModule,
  MatSelectModule,
  MatProgressSpinnerModule,
  MatFormFieldModule,
  MatInputModule,
  MatTooltipModule,
  MatSlideToggleModule,
  MatBadgeModule,
  MatAutocompleteModule,
  MatChipsModule,
  MatExpansionModule,
  MatTabsModule,
  MatOptionModule,
  MatButtonToggleModule,
  MatDatepickerModule,
  MatRadioModule,
  MatRippleModule,
  MatDividerModule,
  MatTreeModule,
  MatStepperModule,
  ScrollingModule,
  ClipboardModule,
  NgxMatSelectSearchModule,
  FlexLayoutModule,
  LayoutModule,
  DragDropModule
];

const CUSTOM_COMPONENTS = [ShmMiniFabComponent];
const CUSTOM_DIRECTIVES = [ShmMiniFabButton, ShmMiniFabTitle, ButtonLoadingDirective];
@NgModule({
  imports: [providers],
  declarations: [CUSTOM_DIRECTIVES, CUSTOM_COMPONENTS],
  exports: [providers, CUSTOM_DIRECTIVES, CUSTOM_COMPONENTS],
  providers: []
})
export class SharedUiMaterialModule {}
