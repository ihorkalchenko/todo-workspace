import { describe, it } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PriorityBadgeComponent } from './priority-badge';
import { TaskPriority } from '@todo-workspace/tasks';

describe('PriorityBadgeComponent', () => {
  let component: PriorityBadgeComponent;
  let fixture: ComponentFixture<PriorityBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PriorityBadgeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PriorityBadgeComponent);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  describe('Priority Styling & Classes', () => {
    const testCases: { priority: TaskPriority, expectedClasses: string }[] = [
      { priority: 'Highest', expectedClasses: 'bg-red-50 text-red-700 border-red-200' },
      { priority: 'High', expectedClasses: 'bg-orange-50 text-orange-700 border-orange-200' },
      { priority: 'Medium', expectedClasses: 'bg-amber-50 text-amber-700 border-amber-200' },
      { priority: 'Low', expectedClasses: 'bg-slate-100 text-slate-600 border-slate-200' },
      { priority: 'Lowest', expectedClasses: 'bg-blue-50 text-blue-600 border-blue-200' },
    ];

    testCases.forEach(({ priority, expectedClasses }) => {
      it(`should apply correct badge classes for priority "${priority}"`, () => {
        fixture.componentRef.setInput('priority', priority);
        fixture.detectChanges();

        expect(component.badgeClass()).toBe(expectedClasses);

        const badgeEl = fixture.nativeElement.querySelector('div') as HTMLElement;

        expectedClasses.split(' ').forEach(cls => {
          expect(badgeEl.classList.contains(cls)).toBe(true);
        });
      });
    });

    it('should default to "Medium" styling when priority is undefined', () => {
      fixture.componentRef.setInput('priority', undefined);
      fixture.detectChanges();

      expect(component.badgeClass()).toBe('bg-amber-50 text-amber-700 border-amber-200');
    });
  });

  describe('Label Display & Tooltip', () => {
    it('should render priority text label when showLabel is true', () => {
      fixture.componentRef.setInput('priority', 'Highest');
      fixture.componentRef.setInput('showLabel', true);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const labelSpan = compiled.querySelector('span');

      expect(labelSpan).toBeTruthy();
      expect(labelSpan?.textContent.trim()).toBe('Highest');
    });

    it('should hide priority text label when showLabel is false', () => {
      fixture.componentRef.setInput('priority', 'Highest');
      fixture.componentRef.setInput('showLabel', false);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const labelSpan = compiled.querySelector('span');

      expect(labelSpan).toBeNull();
    });

    it('should render correct title attribute for accessibility tooltip', () => {
      fixture.componentRef.setInput('priority', 'High');
      fixture.detectChanges();

      const badgeEl = fixture.nativeElement.querySelector('div') as HTMLElement;
      expect(badgeEl.getAttribute('title')).toBe('Priority: High');
    });
  });
});
