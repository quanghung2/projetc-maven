import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfirmModalComponent } from './confirm-modal/confirm-modal.component';
import { CommonDropdownDirective } from './directive/common-dropdown.directive';
import { TinymceDirective } from './directive/tinymce.directive';
import { LoaderComponent } from './loader/loader.component';
import { SafePipe } from './pipe/safe.pipe';
import { SanitizeHtmlPipe } from './pipe/sanitize-html.pipe';
import { SentenceCasePipe } from './pipe/sentence-case.pipe';

@NgModule({
  imports: [CommonModule, FormsModule],
  declarations: [
    LoaderComponent,
    ConfirmModalComponent,
    CommonDropdownDirective,
    TinymceDirective,
    SanitizeHtmlPipe,
    SafePipe,
    SentenceCasePipe
  ],
  exports: [
    CommonModule,
    FormsModule,
    LoaderComponent,
    ConfirmModalComponent,
    CommonDropdownDirective,
    TinymceDirective,
    SanitizeHtmlPipe,
    SafePipe,
    SentenceCasePipe
  ]
})
export class AppCommonModule {}
