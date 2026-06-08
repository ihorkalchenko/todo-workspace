import {
  ApplicationRef,
  ComponentRef,
  createComponent,
  EnvironmentInjector,
  inject,
  Injectable,
} from '@angular/core';
import { ConfirmDialog } from './confirm-dialog';
import { ConfirmDialogOptions } from './confirm-dialog-options';

@Injectable({
  providedIn: 'root'
})
export class ConfirmDialogService {
  private readonly appRef = inject(ApplicationRef);
  private readonly injector = inject(EnvironmentInjector);

  private componentRef?: ComponentRef<ConfirmDialog>;

  confirm(options: ConfirmDialogOptions = {}) {
    return new Promise((resolve) => {
      // 1. create component dynamically
      this.componentRef = createComponent(ConfirmDialog, {
        environmentInjector: this.injector,
      });

      // 2. set options with default
      this.componentRef.instance.options.set({
        title: options.title || 'Confirm Action',
        message: options.message || 'Are you sure?',
        cancelLabel: options.cancelLabel || 'Cancel',
        confirmLabel: options.confirmLabel || 'Confirm',
      });

      // 3. set the result callback
      this.componentRef.instance.result = (value: boolean) => {
        resolve(value);
        this.destroy()
      }

      // 4. attach and append
      this.appRef.attachView(this.componentRef.hostView);
      const elem = this.componentRef.location.nativeElement as HTMLElement;
      document.body.appendChild(elem);
    });
  }

  private destroy() {
    if (this.componentRef) {
      this.appRef.detachView(this.componentRef.hostView);
      this.componentRef.destroy();
      this.componentRef = undefined;
    }
  }
}

