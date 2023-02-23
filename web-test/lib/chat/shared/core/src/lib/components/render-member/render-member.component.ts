import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Integration, User } from '@b3networks/api/workspace';

@Component({
  selector: 'csh-render-member',
  templateUrl: './render-member.component.html',
  styleUrls: ['./render-member.component.scss']
})
export class RenderMemberComponent implements OnChanges {
  readonly User = User;
  photoUrl: string;

  @Input() user: User;
  @Input() integration: Integration;
  @Input() key = '';
  @Input() showStatus = true;
  @Input() showDisplayName = true;
  @Input() isLarge: boolean;
  @Input() isSmall: boolean;

  constructor() {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['user'] && this.user.hasPhoto) {
      this.photoUrl = `url("${this.user.photoUrlOrDefault}")`;
    }

    if (changes['integration'] && this.integration.hasPhoto) {
      this.photoUrl = `url("${this.integration.photoUrlOrDefault}")`;
    }
  }
}
