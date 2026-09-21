import '@angular/compiler';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { provideRouter, Router } from '@angular/router';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommandPaletteComponent } from './command-palette';
import { CommandPaletteService } from './command-palette.service';
import { TasksService } from '../../core/tasks/tasks.service';

describe('CommandPaletteComponent', () => {
  let component: CommandPaletteComponent;
  let fixture: ComponentFixture<CommandPaletteComponent>;
  let paletteService: CommandPaletteService;
  let router: Router;

  const mockTasks = [
    {
      id: 1,
      title: 'Fix Auth Bug',
      description: 'JWT issue',
      status: 'To Do',
      priority: 'High'
    },
    {
      id: 2,
      title: 'Deploy App',
      description: 'Production release',
      status: 'Done',
      priority: 'Medium'
    },
  ];

  const mockTasksService = {
    tasks: vi.fn().mockReturnValue(mockTasks),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommandPaletteComponent],
      providers: [
        CommandPaletteService,
        provideRouter([]),
        { provide: TasksService, useValue: mockTasksService },
      ],
    }).compileComponents();

    paletteService = TestBed.inject(CommandPaletteService);
    router = TestBed.inject(Router);

    paletteService.open();

    fixture = TestBed.createComponent(CommandPaletteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    paletteService.close();
    TestBed.resetTestingModule();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  describe('Search and Filtering', () => {
    it('should display quick actions and tasks when search query is empty', () => {
      const items = component.items();
      expect(items.length).toBe(5);
    });

    it('should filter items based on user input query', () => {
      component.query.set('Fix Auth');
      fixture.detectChanges();

      const items = component.items();
      expect(items.length).toBe(1);
      expect(items[0].title).toBe('Fix Auth Bug');
    });

    it('should reset selectedIndex to 0 on new search input', () => {
      component.selectedIndex.set(2);

      const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
      expect(input).not.toBeNull();

      input.value = 'Deploy';
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      expect(component.selectedIndex()).toBe(0);
      expect(component.query()).toBe('Deploy');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should increment selectedIndex on ArrowDown', () => {
      expect(component.selectedIndex()).toBe(0);

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      fixture.detectChanges();

      expect(component.selectedIndex()).toBe(1);
    });

    it('should close palette on Escape key', () => {
      const closeSpy = vi.spyOn(paletteService, 'close');

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

      expect(closeSpy).toHaveBeenCalled();
    });

    it('should execute selected item action on Enter key', () => {
      const navigateSpy = vi
        .spyOn(router, 'navigateByUrl')
        .mockImplementation(() => Promise.resolve(true));

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

      expect(navigateSpy).toHaveBeenCalledWith('/tasks/new');
    });
  });

  describe('Item Selection', () => {
    it('should execute item action when clicked', () => {
      const navigateSpy = vi
        .spyOn(router, 'navigateByUrl')
        .mockImplementation(() => Promise.resolve(true));

      const firstItem = fixture.nativeElement.querySelector('li') as HTMLLIElement;
      expect(firstItem).not.toBeNull();

      firstItem.click();

      expect(navigateSpy).toHaveBeenCalledWith('/tasks/new');
    });
  });
});
