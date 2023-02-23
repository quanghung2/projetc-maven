import { Component, OnInit } from '@angular/core';
import { FILE_TYPE, TITLE } from '../common/constants';

@Component({
  selector: 'b3n-voicemail',
  templateUrl: './voicemail.component.html',
  styleUrls: ['./voicemail.component.scss']
})
export class VoicemailComponent implements OnInit {
  title = TITLE.voicemails;
  type = FILE_TYPE.voicemails;

  constructor() {}

  ngOnInit(): void {}
}
