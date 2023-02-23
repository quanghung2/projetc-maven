import { Component, Input, OnInit } from '@angular/core';
import { GenieBlock } from '@b3networks/api/ivr';
import { KeyValue } from '@angular/common';
import { MatSelectChange } from '@angular/material/select';
import { ControlContainer, NgForm } from '@angular/forms';
import { SkillCatalog } from '@b3networks/api/intelligence';

@Component({
  selector: 'b3n-genie',
  templateUrl: './genie.component.html',
  styleUrls: ['./genie.component.scss'],
  viewProviders: [{ provide: ControlContainer, useExisting: NgForm }]
})
export class GenieComponent implements OnInit {
  @Input() block: GenieBlock = new GenieBlock();
  @Input() skills: SkillCatalog[];

  skillOptions: KeyValue<string | number, string>[];
  selectedSkill: string | number;
  skillMapping: { [Tkey in string]: SkillCatalog };

  constructor() {}

  ngOnInit() {
    this.skillOptions = this.skills.map(skill => {
      return { key: skill.code, value: skill.name };
    });

    this.skillMapping = this.skills.reduce((map, skill) => {
      map[skill.code] = skill;
      return map;
    }, {});

    this.selectedSkill = this.skillOptions[0].key;
    this.generateData();
  }

  generateData() {
    const skill = this.skillMapping[this.selectedSkill];
    this.block.path = skill.path;
    this.block.skill = skill.code;
    const params = skill.params;
    this.block.data = params.map(skill => {
      return { fieldName: skill.key, fieldValue: null };
    });
  }

  onChangeSkill(event: MatSelectChange) {
    this.selectedSkill = event.value;
    this.generateData();
  }
}
