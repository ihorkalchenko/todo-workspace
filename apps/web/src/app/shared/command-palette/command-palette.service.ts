import {
  ApplicationRef,
  ComponentRef,
  computed,
  createComponent,
  DestroyRef,
  EnvironmentInjector,
  inject,
  Injectable,
  signal,
} from '@angular/core';
import { CommandPaletteComponent } from './command-palette';

interface NavigatorWithData extends Navigator {
  userAgentData?: {
    platform?: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class CommandPaletteService {
  private readonly appRef = inject(ApplicationRef);
  private readonly injector = inject(EnvironmentInjector);
  private readonly destroyRef = inject(DestroyRef);

  private componentRef?: ComponentRef<CommandPaletteComponent>;

  readonly isOpen = signal<boolean>(false);
  readonly isMac = signal(this.detectIsMac());
  readonly shortcutLabel = computed(() => (this.isMac() ? '⌘K' : 'Ctrl+K'));

  constructor() {
    this.handlePaletteChange();
  }

  open() {
    if (this.componentRef) return;

    this.componentRef = createComponent(CommandPaletteComponent, {
      environmentInjector: this.injector,
    });

    this.appRef.attachView(this.componentRef.hostView);

    const elem = this.componentRef.location.nativeElement as HTMLElement;
    document.body.appendChild(elem);

    this.isOpen.set(true);
  }

  close() {
    if (this.componentRef) {
      this.appRef.detachView(this.componentRef.hostView);
      this.componentRef.destroy();
      this.componentRef = undefined;
      this.isOpen.set(false);
    }
  }

  toggle() {
    if (this.isOpen()) {
      this.close();
    } else {
      this.open();
    }
  }

  private handlePaletteChange() {
    if (typeof window === 'undefined') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        this.toggle();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    this.destroyRef.onDestroy(() => {
      window.removeEventListener('keydown', handleKeyDown);
      this.close();
    });
  }

  private detectIsMac(): boolean {
    if (typeof navigator === 'undefined') return false;

    const nav = navigator as NavigatorWithData;
    
    if (nav.userAgentData?.platform) {
      return nav.userAgentData.platform.toLowerCase().includes('mac');
    }

    return /mac|iphone|ipad|ipod/i.test(navigator.userAgent);
  }
}
