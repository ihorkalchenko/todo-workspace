import { beforeEach, describe, expect, it } from "vitest";
import { ComponentFixture, TestBed } from '@angular/core/testing';

import {TagBadgeComponent} from "./tag-badge";
import {Tag} from "@todo-workspace/tasks";

describe('TagBadgeComponent', () => {
  let component: TagBadgeComponent;
  let fixture: ComponentFixture<TagBadgeComponent>;

  const mockTag: Tag = {
    id: 1,
    name: 'Frontend',
    color: '#3b82f6',
    userId: 1,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TagBadgeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TagBadgeComponent);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    fixture.componentRef.setInput('tag', mockTag);
    fixture.detectChanges();

    expect(component).toBeTruthy();
  });

  it('should render the tag name', () => {
    fixture.componentRef.setInput('tag', mockTag);
    fixture.detectChanges();

    const spanEl = fixture.nativeElement.querySelector('span') as HTMLSpanElement;
    expect(spanEl).toBeTruthy();
    expect(spanEl.textContent?.trim()).toBe('Frontend');
  });

  it('should apply the background color from the tag input', () => {
    fixture.componentRef.setInput('tag', mockTag);
    fixture.detectChanges();

    const spanEl = fixture.nativeElement.querySelector('span') as HTMLSpanElement;
    expect(spanEl.style.backgroundColor).toMatch(/(#3b82f6|rgb\(59,\s*130,\s*246\))/i);
  });

  it('should reactively update text and background when tag input changes', () => {
    fixture.componentRef.setInput('tag', mockTag);
    fixture.detectChanges();

    const updatedTag: Tag = {
      id: 2,
      name: 'Bug',
      color: '#ef4444',
      userId: 1,
    };

    fixture.componentRef.setInput('tag', updatedTag);
    fixture.detectChanges();

    const spanEl = fixture.nativeElement.querySelector('span') as HTMLSpanElement;
    expect(spanEl.textContent?.trim()).toBe('Bug');
    expect(spanEl.style.backgroundColor).toMatch(/(#ef4444|rgb\(239,\s*68,\s*68\))/i);
  });

  it('should not render close button by default', () => {
    fixture.componentRef.setInput('tag', mockTag);
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(button).toBeNull();
  });

  it('should render close button when removable is true', () => {
    fixture.componentRef.setInput('tag', mockTag);
    fixture.componentRef.setInput('removable', true);
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(button).toBeTruthy();
  });

  it('should emit close output when close button is clicked', () => {
    fixture.componentRef.setInput('tag', mockTag);
    fixture.componentRef.setInput('removable', true);
    fixture.detectChanges();

    let emitted: Tag | undefined;
    component.removed.subscribe(tag => (emitted = tag));

    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    button.click();
    expect(emitted).toEqual(mockTag);
  });
});
