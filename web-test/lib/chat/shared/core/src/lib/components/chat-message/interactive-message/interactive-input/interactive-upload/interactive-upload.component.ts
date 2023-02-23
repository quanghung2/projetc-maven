import { Component, HostListener, Input, OnChanges, SimpleChanges } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ApprovalWorkspaceService } from '@b3networks/api/approval';
import { IMessComponent } from '@b3networks/api/workspace';
import { getFileExtension, humanFileSize } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { HashMap } from '@datorama/akita';
import { getFileType } from '../../../../../core/helper/helper';

@Component({
  selector: 'csh-interactive-upload',
  templateUrl: './interactive-upload.component.html',
  styleUrls: ['./interactive-upload.component.scss']
})
export class InteractiveUploadComponent implements OnChanges {
  @Input() backgroundUploading: boolean;
  @Input() component: IMessComponent;
  @Input() control: FormControl;
  @Input() uploadPercentage: number;
  @Input() uploadStatusMap: HashMap<boolean>;
  @Input() isSubmiting: boolean;

  errorText: string;
  isProgressing: boolean;
  nameFile: string;
  sizeFile: string;
  logoFileType: string;

  @HostListener('dragover', ['$event']) onDragOver(evt: DragEvent | any) {
    evt.preventDefault();
    evt.stopPropagation();
  }

  @HostListener('drop', ['$event']) onDrop(event: DragEvent | any) {
    event.preventDefault();
    event.stopPropagation();
    const files = Array.from(event.dataTransfer.files) as File[];
    if (files.length > 0) {
      this.control.setValue(files[0]);
      this.setInfoFile();
    }
  }

  constructor(private approvalWorkspaceService: ApprovalWorkspaceService, private toastService: ToastService) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['component']) {
      this.errorText = !this.component?.element.folder ? 'Unrenderable upload input!' : null;
    }

    if (changes['control'] && this.control?.value) {
      this.setInfoFile();
    }
  }

  onBackgroundFileChange(event) {
    let uploadedFile = null;
    if (event.target.files.length > 0) {
      uploadedFile = event.target.files[0];
      this.control.setValue(uploadedFile);
      this.setInfoFile();
    }
  }

  setInfoFile() {
    this.uploadStatusMap[this.component?.element?.id] = undefined;

    if (this.control.value?.name) {
      this.nameFile = this.control.value.name;
      this.logoFileType = getFileType(getFileExtension(this.control.value?.name));
    }
    if (this.control.value?.size) {
      const size = humanFileSize((this.control.value as File).size);
      this.sizeFile = size === 'NaN undefined' ? null : size;
    }
  }
}
