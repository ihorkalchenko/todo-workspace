import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ConfirmDialogOptions } from './confirm-dialog-options';

@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.html',
  styleUrl: './confirm-dialog.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialog {
  readonly options = signal<ConfirmDialogOptions>({});

  result?: (value: boolean) => void;

  onCancel() {
    this.result?.(false);
  }

  onConfirm() {
    this.result?.(true);
  }
}
