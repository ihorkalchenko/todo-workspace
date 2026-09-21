import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { TasksService } from '../../core/tasks/tasks.service';
import { CommandPaletteService} from './command-palette.service';

describe('CommandPaletteService', () => {
  let service: CommandPaletteService;

  const mockTasksService = {
    tasks: vi.fn().mockReturnValue([
      { id: 1, title: 'Test Task', status: 'To Do', priority: 'High' },
    ]),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CommandPaletteService,
        provideRouter([]),
        { provide: TasksService, useValue: mockTasksService },
      ],
    });

    service = TestBed.inject(CommandPaletteService);
  });

  afterEach(() => {
    service.close();
    TestBed.resetTestingModule();
  });

  it('should be created with isOpen = false by default', () => {
    expect(service).toBeTruthy();
    expect(service.isOpen()).toBe(false);
  });

  describe('OS Platform Detection & Shortcut label', () => {
    it('should provide a shortcut label ("⌘K" or "Ctrl+K")', () => {
      const label = service.shortcutLabel();
      expect(label === '⌘K' || label === 'Ctrl+K').toBe(true);
    });
  });

  describe('open/close lifecycle', () => {
    it('should set isOpen to true and append modal to DOM on open()', () => {
      service.open();
      expect(service.isOpen()).toBe(true);
      expect(document.querySelector('app-command-palette')).not.toBeNull();
    });

    it('should set isOpen to false and remove modal from DOM on close()', () => {
      service.close();
      expect(service.isOpen()).toBe(false);
      expect(document.querySelector('app-command-palette')).toBeNull();
    });

    it('should not create duplicate components if open() is called several times', () => {
      service.open();
      service.open();
      expect(document.querySelectorAll('app-command-palette').length).toBe(1);
    });
  });

  describe('toggle()', () => {
    it('should open when closed and close when opened', () => {
      expect(service.isOpen()).toBe(false);

      service.toggle();
      expect(service.isOpen()).toBe(true);

      service.toggle();
      expect(service.isOpen()).toBe(false);
    });
  });

  describe('Global Keyboard Shortcut Listener', () => {
    it('should toggle when Cmd + K (metaKey) is pressed', () => {
      expect(service.isOpen()).toBe(false);

      const event = new KeyboardEvent('keydown', {
        key: 'k',
        metaKey: true,
        bubbles: true
      });

      window.dispatchEvent(event);
      expect(service.isOpen()).toBe(true);
    });

    it('should toggle when Ctrl + K (ctrlKey) is pressed', () => {
      expect(service.isOpen()).toBe(false);

      const event = new KeyboardEvent('keydown', {
        key: 'k',
        ctrlKey: true,
        bubbles: true
      });

      window.dispatchEvent(event);
      expect(service.isOpen()).toBe(true);
    });

    it('should ignore unrelated key events (e.g. Cmd + S)', () => {
      expect(service.isOpen()).toBe(false);

      const event = new KeyboardEvent('keydown', {
        key: 's',
        metaKey: true,
        bubbles: true
      });

      window.dispatchEvent(event);
      expect(service.isOpen()).toBe(false);
    });
  });
});
