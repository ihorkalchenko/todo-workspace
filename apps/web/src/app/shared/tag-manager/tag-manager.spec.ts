import { beforeEach, describe, expect, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';

import { Tag } from '@todo-workspace/tasks';
import { TagManagerComponent } from './tag-manager';
import { TagsService } from '../../core/tags/tags.service';

describe('TagManagerComponent', () => {
  let component: TagManagerComponent;
  let fixture: ComponentFixture<TagManagerComponent>;

  const mockTagsSignal = signal<Tag[]>([
    { id: 1, name: 'Frontend', color: '#3b82f6', userId: 42 },
    { id: 2, name: 'Bug', color: '#ef4444', userId: 42 },
  ]);

  const mockTagsService = {
    tags: mockTagsSignal,
    createTag: vi.fn(),
    deleteTag: vi.fn(),
  };

  beforeEach(async () => {
    mockTagsSignal.set([
      { id: 1, name: 'Frontend', color: '#3b82f6', userId: 42 },
      { id: 2, name: 'Bug', color: '#ef4444', userId: 42 },
    ]);
    mockTagsService.createTag.mockReset();
    mockTagsService.deleteTag.mockReset();

    await TestBed.configureTestingModule({
      imports: [TagManagerComponent],
      providers: [{ provide: TagsService, useValue: mockTagsService }],
    }).compileComponents();

    fixture = TestBed.createComponent(TagManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component and render existing tags', () => {
    expect(component).toBeTruthy();

    const badges = fixture.nativeElement.querySelectorAll('app-tag-badge');
    expect(badges.length).toBe(2);
  });

  it('should call tagsService.deleteTag when a tag badge is removed', () => {
    mockTagsService.deleteTag.mockReturnValue(of({ success: true }));

    component.deleteTag(1);
    expect(mockTagsService.deleteTag).toHaveBeenCalledWith(1);
  });

  describe('Form Validation & Creation', () => {
    it('should have submit disabled when name is empty', () => {
      const submit = fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;
      expect(submit.disabled).toBe(true);
    });

    it('should enable submit button and creaet tag on valid submission', async () => {
      const newTag: Tag = { id: 3, name: 'Urgent', color: '#f59e0b', userId: 42 };
      mockTagsService.createTag.mockReturnValue(of(newTag));

      component.formModel.set({ name: newTag.name, color: newTag.color });
      fixture.detectChanges();
      await fixture.whenStable();

      const submit = fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;
      expect(submit.disabled).toBe(false);

      const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
      form.dispatchEvent(new Event('submit'));
      await fixture.whenStable();

      expect(mockTagsService.createTag).toHaveBeenCalledWith({
        name: newTag.name,
        color: newTag.color,
      });

      expect(component.formModel()).toEqual({
        name: '',
        color: '#3B82F6',
      });
    });

    it('should not submit if tag name contains only whitespace', async () => {
      component.formModel.set({
        name: '   ',
        color: '#3B82F6',
      });
      fixture.detectChanges();
      await fixture.whenStable();

      const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
      form.dispatchEvent(new Event('submit'));
      await fixture.whenStable();

      expect(mockTagsService.createTag).not.toHaveBeenCalled();
    });
  });
});
