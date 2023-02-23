import { Component, Input, OnInit } from '@angular/core';
import { AbstractControl, UntypedFormArray, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { AuthorDataSource, AuthorDataSourceQuery } from '@b3networks/api/flow';
import { Utils } from '@b3networks/fi/flow/shared';
import { Observable } from 'rxjs';

@Component({
  selector: 'b3n-extract-json-prop',
  templateUrl: './extract-json-prop.component.html',
  styleUrls: ['./extract-json-prop.component.scss']
})
export class ExtractJsonPropComponent implements OnInit {
  @Input() formProperties: UntypedFormGroup;
  @Input() key: string;
  formArray: UntypedFormArray;
  authorDataSource$: Observable<AuthorDataSource[]>;

  getErrorInput(ctrl: UntypedFormControl | AbstractControl) {
    return Utils.getErrorInput(ctrl);
  }

  constructor(private authorDataSourceQuery: AuthorDataSourceQuery) {}

  ngOnInit(): void {
    this.formArray = this.formProperties.get(this.key) as UntypedFormArray;
    this.authorDataSource$ = this.authorDataSourceQuery.selectAll({
      filterBy: state => state.type === 'STATIC'
    });
  }

  removeOption(i: number) {
    this.formArray.removeAt(i);
  }

  parseFormGroup(a: AbstractControl) {
    return a as UntypedFormGroup;
  }
}
