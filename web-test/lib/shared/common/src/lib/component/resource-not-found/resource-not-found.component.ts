import { Component, Input } from '@angular/core';

@Component({
  selector: 'shc-resource-not-found',
  templateUrl: './resource-not-found.component.html',
  styleUrls: ['./resource-not-found.component.scss']
})
export class ResourceNotFoundComponent {
  @Input() message = 'No Resource Found';
  @Input() icon = 'insert_drive_file';
}
