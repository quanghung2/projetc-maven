import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CustomActionConfig, TagInput } from '../portal-config.component';

@Component({
  selector: 'app-portal-action',
  templateUrl: './action.component.html',
  styleUrls: ['./action.component.scss']
})
export class ActionComponent {
  autocompleteItems: TagInput[];
  isParentAllowed: boolean;
  selectedItems: TagInput[];
  originAction: CustomActionConfig;
  selectAllOption = [
    {
      key: 'all',
      value: 'All'
    }
  ];

  @Input() ignoreGroupLabel = false;
  @Input() disabled = false;
  @Output() valueChanges: EventEmitter<{ selectedItemKeys: string[]; groupKey: string }> = new EventEmitter();
  @Output() checkChanges = new EventEmitter<boolean>();

  @Input() set action(action: CustomActionConfig) {
    this.originAction = action;
    if (action) {
      this.autocompleteItems = action.groupedResources.map(resource => {
        return {
          key: resource.name,
          value: this.sentenceCaseTransform(resource.desc)
        };
      });
      this.autocompleteItems = [...this.selectAllOption, ...this.autocompleteItems];
      this.selectedItems = action.selectedResources;
      this.isParentAllowed = !!this.selectedItems.length;
    }
  }

  @Input() set clearAll(isClearAll) {
    if (isClearAll) {
      this.selectedItems = [];
      this.isParentAllowed = false;
      this.emitValueChanges();
    }
  }

  removeTagInput(selectedTagInput) {
    const selectedIndex = this.selectedItems.findIndex(item => item.key === selectedTagInput.key);
    this.selectedItems.splice(selectedIndex, 1);
    this.emitValueChanges();
  }

  addTagInput(selectedTagInput) {
    if (selectedTagInput.key === 'all') {
      this.selectedItems = this.originAction.groupedResources.map(resource => ({
        key: resource.name,
        value: resource.desc
      }));
    } else {
      this.selectedItems.push(selectedTagInput);
    }

    this.emitValueChanges();
  }

  checkNoResult() {
    if (this.selectedItems.length === this.autocompleteItems.length - 1) {
      this.autocompleteItems[0].value = 'No more result';
    } else {
      this.autocompleteItems[0].value = 'All';
    }
  }

  removeChildrenOnUncheckParent(value: boolean) {
    if (!value) {
      this.selectedItems = [];
      this.emitValueChanges();
    }
    this.checkChanges.emit(value);
  }

  private emitValueChanges() {
    this.valueChanges.emit({
      selectedItemKeys: this.selectedItems.map(item => item.key),
      groupKey: this.originAction.name
    });
  }

  private sentenceCaseTransform(value: string): string {
    const first = value.substr(0, 1).toUpperCase();
    return first + value.substr(1).toLowerCase();
  }
}
