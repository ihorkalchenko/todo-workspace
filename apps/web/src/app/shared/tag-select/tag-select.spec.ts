import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';

import { Tag } from '@todo-workspace/tasks';
import { TagSelectComponent } from './tag-select';
import { TagsService } from '../../core/tags/tags.service';

describe('TagSelectComponent', () => {
  let component: TagSelectComponent;
  let fixture: ComponentFixture<TagSelectComponent>;

  const mockTags = signal<Tag[]>([
    { id: 1, name: 'Frontend', color: '#3b82f6', userId: 42 },
    { id: 2, name: 'Bug', color: '#ef4444', userId: 42 },
  ]);

  const mockTagsService = {
    tags: mockTags,
  };

  beforeEach(async () => {
    mockTags.set([
      { id: 1, name: 'Frontend', color: '#3b82f6', userId: 42 },
      { id: 2, name: 'Bug', color: '#ef4444', userId: 42 },
    ]);

    await TestBed.configureTestingModule({
      imports: [TagSelectComponent],
      providers: [{ provide: TagsService, useValue: mockTagsService }],
    }).compileComponents();

    fixture = TestBed.createComponent(TagSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component and render available tags', () => {
    expect(component).toBeTruthy();

    const tagButtons = fixture.nativeElement.querySelectorAll('button:not(:first-child)');
    expect(tagButtons.length).toBe(2);
  });

  it('should show empty state message when no tags are available', () => {
    mockTags.set([]);
    fixture.detectChanges();

    const emptyText = fixture.nativeElement.querySelector('.stub-text');
    expect(emptyText?.textContent).toContain('No tags available');
  });

  describe('ControlValueAccessor', () => {
    it('should set selected tags on writeValue', () => {
      component.writeValue([1]);
      fixture.detectChanges();

      expect(component.isTagSelected(1)).toBe(true);
      expect(component.isTagSelected(2)).toBe(false);
    });

    it('should handle null or invalid value in writeValue', () => {
      component.writeValue(null);
      expect(component.selectedTagIds()).toEqual([]);
    });

    it('should toggle selection and invoke onChange & onTouched when clicking a tag', () => {
      const onChange = vi.fn();
      const onTouched = vi.fn();

      component.registerOnChange(onChange);
      component.registerOnTouched(onTouched);

      component.toggleTag(1);
      expect(component.selectedTagIds()).toEqual([1]);
      expect(onChange).toHaveBeenCalledWith([1]);
      expect(onTouched).toHaveBeenCalled();

      component.toggleTag(1);
      expect(component.selectedTagIds()).toEqual([]);
      expect(onChange).toHaveBeenCalledWith([]);
    });

    it('should disable interaction when setDisabledState is called', () => {
      const onChange = vi.fn();
      component.registerOnChange(onChange);

      component.setDisabledState(true);
      fixture.detectChanges();

      expect(component.disabled()).toBe(true);

      component.toggleTag(1);
      expect(component.selectedTagIds()).toEqual([]);
      expect(onChange).not.toHaveBeenCalled();

      const toggleButton = fixture.nativeElement.querySelector('button');
      expect(toggleButton.disabled).toBe(true);
    });
  });

  describe('Tag Manager Toggle', () => {
    it('should toggle tag manager visibility when button is clicked', () => {
      expect(fixture.nativeElement.querySelector('app-tag-manager')).toBeNull();

      const toggleButton = fixture.nativeElement.querySelector('button');
      toggleButton.click();
      fixture.detectChanges();

      expect(component.isTagManagerOpen()).toBe(true);
      expect(fixture.nativeElement.querySelector('app-tag-manager')).toBeTruthy();
      expect(toggleButton.textContent?.trim()).toBe('Close Tag Manager');
    });
  });

  describe('Reactive Pruning Effect', () => {
    it('should automatically prune selected tag IDs if a tag is removed from the store', async () => {
      const onChange = vi.fn();
      component.registerOnChange(onChange);

      component.writeValue([1, 2]);
      fixture.detectChanges();

      mockTags.set([{ id: 1, name: 'Frontend', color: '#3b82f6', userId: 42 }]);
      fixture.detectChanges();
      await fixture.whenStable();

      expect(component.selectedTagIds()).toEqual([1]);
      expect(onChange).toHaveBeenCalledWith([1]);
    });
  });
});
