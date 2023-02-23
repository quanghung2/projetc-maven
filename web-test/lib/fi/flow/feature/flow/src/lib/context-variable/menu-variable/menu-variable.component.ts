import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { OptionForControl, PropertyForVariable, VariableForAction } from '@b3networks/api/flow';
import Fuse from 'fuse.js';
import { cloneDeep } from 'lodash';

@Component({
  selector: 'b3n-menu-variable',
  templateUrl: './menu-variable.component.html',
  styleUrls: ['./menu-variable.component.scss']
})
export class MenuVariableComponent implements OnInit {
  @Input() contextVariables: VariableForAction[];
  @Input() keyForContextVar: string;
  @Input() optionForControl: OptionForControl;
  @Output() selectProp = new EventEmitter<PropertyForVariable>();

  selectedActions: VariableForAction[] = [];
  searchAction = new UntypedFormControl();
  filteredActions: VariableForAction[];

  selectedProperties: PropertyForVariable[] = [];
  searchProperty = new UntypedFormControl();
  filteredProperties: PropertyForVariable[];
  allPropertiesOfAction: PropertyForVariable[] = [];
  suggestionProperties: PropertyForVariable[] = [];

  selectedArrayItems: PropertyForVariable[] = [];
  searchArrayItems = new UntypedFormControl();
  filteredArrayItems: PropertyForVariable[];

  compareAction = (o1: VariableForAction, o2: VariableForAction) => o1.index === o2.index;
  compareProp = (o1: PropertyForVariable, o2: PropertyForVariable) => o1.expressionTree === o2.expressionTree;

  ngOnInit(): void {
    this.filteredActions = this.getContextVariables();
    this.suggestionProperties = this.createOptionSuggestion();

    this.searchAction.valueChanges.subscribe(val => {
      this.filteredActions = this.getContextVariables().filter(
        c => `${c.number}. ${c.actionName.toLowerCase()}`.indexOf(val.toLowerCase()) >= 0 && c.properties.length > 0
      );
      this.selectedActions.length = 0;
    });

    this.searchProperty.valueChanges.subscribe(val => {
      this.filteredProperties = this.selectedActions[0].properties.filter(
        p => p.title.toLowerCase().indexOf(val.toLowerCase()) >= 0
      );
      this.selectedProperties.length = 0;
    });

    this.searchArrayItems.valueChanges.subscribe(val => {
      this.filteredArrayItems = this.selectedProperties[0].arrayItems.filter(
        p => p.title.toLowerCase().indexOf(val.toLowerCase()) >= 0
      );
      this.selectedArrayItems.length = 0;
    });
  }

  selectAction() {
    this.filteredProperties = this.selectedActions[0].properties;
    this.selectedProperties.length = 0;
  }

  selectProperty(e?: PropertyForVariable) {
    if (e) {
      this.selectProp.emit(e);
    } else {
      if (this.keyForContextVar === 'looping') {
        if (this.selectedProperties[0].arrayItems?.length) {
          this.filteredArrayItems = this.selectedProperties[0].arrayItems;
          this.selectedArrayItems.length = 0;
        } else {
          this.selectProp.emit(this.selectedProperties[0]);
        }
      } else {
        this.selectProp.emit(this.selectedProperties[0]);
      }
    }
  }

  selectArrayItem() {
    this.selectProp.emit(this.selectedArrayItems[0]);
  }

  private getContextVariables() {
    const contextVariables: VariableForAction[] = cloneDeep(this.contextVariables);
    switch (this.keyForContextVar) {
      case 'switching':
        return contextVariables.filter(item => {
          item.properties = item.properties.filter(
            x => x.dataType !== 'array' || (x.dataType === 'array' && x.arrayItemDataType !== 'object')
          );
          if (item.properties.length > 0) {
            return item;
          }
          return null;
        });
      case 'looping':
        return contextVariables.filter(item => {
          item.properties = item.properties
            .filter(
              x =>
                x.dataType === 'array' ||
                x.dataType === this.optionForControl.dataType ||
                x.arrayItemDataType === this.optionForControl.dataType
            )
            .map(x => {
              if (x.dataType === 'array') {
                x.arrayItems = x.arrayItems.filter(i => i.dataType === this.optionForControl.dataType);
                if (x.arrayItems.length > 0) {
                  return x;
                }
              }
              return x;
            });
          if (item.properties.length > 0) {
            return item;
          }
          return null;
        });
      default:
        return contextVariables.filter(item => {
          if (this.optionForControl.dataType === 'array' && this.optionForControl.arrayItemDataType) {
            item.properties = item.properties.filter(
              x =>
                x.dataType === this.optionForControl.arrayItemDataType ||
                x.arrayItemDataType === this.optionForControl.arrayItemDataType
            );
          } else {
            if (this.optionForControl.selectAllDynamicVar) {
              item.properties = item.properties.filter(
                x => x.dataType === 'string' || x.dataType === 'number' || x.dataType === 'boolean'
              );
            } else {
              item.properties = item.properties.filter(x => x.dataType === this.optionForControl.dataType);
            }
          }
          if (item.properties.length > 0) {
            return item;
          }
          return null;
        });
    }
  }

  private createOptionSuggestion() {
    this.allPropertiesOfAction.length = 0;
    this.contextVariables.forEach(i => {
      i.properties.forEach(j => {
        if (j.dataType === this.optionForControl.dataType) {
          this.allPropertiesOfAction.push(j);
        }
      });
    });
    let data = [];
    if (this.optionForControl.title?.length) {
      const options = { keys: ['title'], includeScore: true, threshold: 0.3 };
      const fuse = new Fuse(this.allPropertiesOfAction, options);
      data = fuse.search(this.optionForControl.title).map(r => r.item);
    }
    return data?.slice(0, 3);
  }
}
