import { beforeEach, describe, expect, it } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserAvatar } from './user-avatar';

describe('UserAvatar', () => {
  let component: UserAvatar;
  let fixture: ComponentFixture<UserAvatar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserAvatar],
    }).compileComponents();

    fixture = TestBed.createComponent(UserAvatar);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Default Values', () => {
    it('should default size to 32', () => {
      expect(component.size()).toBe(32);
    });

    it('should fallback displayName to "User" when name is not provided', () => {
      expect(component.displayName()).toBe('User');
    });

    it('should fallback initials "U" when name is not provided', () => {
      expect(component.initials()).toBe('U');
    });

    it('should render fallback initials div with default size 32px', () => {
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const fallbackDiv = compiled.querySelector('div') as HTMLDivElement;

      expect(fallbackDiv).toBeTruthy();
      expect(fallbackDiv.textContent?.trim()).toBe('U');
      expect(fallbackDiv.style.width).toBe('32px');
      expect(fallbackDiv.style.height).toBe('32px');
      expect(fallbackDiv.style.fontSize).toBe('12.8px'); // 32 * 0.4
    });
  });

  describe('Avatar rendering', () => {
    const avatarUrl = '/uploads/avatars/user-1.png';

    it('should render <img> with src, alt and size styles when provided', () => {
      fixture.componentRef.setInput('avatarUrl', avatarUrl);
      fixture.componentRef.setInput('name', 'Alice Smith');
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const img = compiled.querySelector('img') as HTMLImageElement;
      const fallBackDiv = compiled.querySelector('div') as HTMLDivElement;

      expect(img).toBeTruthy();
      expect(img.getAttribute('src')).toBe(avatarUrl);
      expect(img.getAttribute('alt')).toBe('Alice Smith');
      expect(img.style.width).toBe('32px');
      expect(img.style.height).toBe('32px');
      expect(fallBackDiv).toBeNull();
    });

    it('should adjust <img> width and height when custom size provided', () => {
      fixture.componentRef.setInput('avatarUrl', avatarUrl);
      fixture.componentRef.setInput('size', 72);
      fixture.detectChanges();

      const img = fixture.nativeElement.querySelector('img') as HTMLImageElement;

      expect(img.style.width).toBe('72px');
      expect(img.style.height).toBe('72px');
    });
  });

  describe('Initials and Fallback rendering', () => {
    it('should render single initial for single-word name', () => {
      fixture.componentRef.setInput('name', 'Alice');
      fixture.detectChanges();

      expect(component.initials()).toBe('A');

      const fallBackDiv = fixture.nativeElement.querySelector('div') as HTMLDivElement;
      expect(fallBackDiv.textContent?.trim()).toBe('A');
    });

    it('should trim surrounding whitespace from name', () => {
      fixture.componentRef.setInput('name', ' Bob  ');
      fixture.detectChanges();

      expect(component.displayName()).toBe('Bob');
      expect(component.initials()).toBe('B');
    });

    it('should handle null or empty string name gracefully', () => {
      fixture.componentRef.setInput('name', null);
      fixture.detectChanges();

      expect(component.displayName()).toBe('User');
      expect(component.initials()).toBe('U');

      fixture.componentRef.setInput('name', '   ');
      fixture.detectChanges();

      expect(component.displayName()).toBe('User');
      expect(component.initials()).toBe('U');
    });
  });
});
