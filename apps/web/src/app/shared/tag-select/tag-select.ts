import {
  ChangeDetectionStrategy,
  Component,
  effect,
  forwardRef,
  inject,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TagsService } from '../../core/tags/tags.service';
import { TagManagerComponent } from '../tag-manager/tag-manager';
import { TagBadgeComponent } from '../tag-badge/tag-badge';

@Component({
  selector: 'app-tag-select',
  imports: [TagManagerComponent, TagBadgeComponent],
  template: `
    <div>
      <div class="flex items-center justify-between mb-1">
        <label
          class="block text-sm font-semibold text-gray-700 italic uppercase tracking-wider"
        >
          Tags
        </label>
        <button
          type="button"
          [disabled]="disabled()"
          (click)="isTagManagerOpen.set(!isTagManagerOpen())"
          class="text-xs text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ isTagManagerOpen() ? 'Close Tag Manager' : 'Add / Manage Tags' }}
        </button>
      </div>

      @if (isTagManagerOpen()) {
        <div class="mb-3">
          <app-tag-manager />
        </div>
      }

      <div class="flex flex-wrap items-center gap-2">
        @for (tag of tags(); track tag.id) {
          <button
            type="button"
            [disabled]="disabled()"
            (click)="toggleTag(tag.id)"
            class="cursor-pointer transition-opacity disabled:cursor-not-allowed"
            [class.opacity-40]="!isTagSelected(tag.id)"
            [class.opacity-100]="isTagSelected(tag.id)"
          >
            <app-tag-badge [tag]="tag" />
          </button>
        } @empty {
          <span class="text-xs text-gray-400 italic">
            No tags available. Click "+ Add / Manage Tags" to create one.
          </span>
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TagSelectComponent),
      multi: true,
    },
  ],
})
export class TagSelectComponent implements ControlValueAccessor {
  private readonly tagsService = inject(TagsService);

  readonly tags = this.tagsService.tags;
  readonly isTagManagerOpen = signal<boolean>(false);
  readonly selectedTagIds = signal<number[]>([]);
  readonly disabled = signal<boolean>(false);

  private onChange: (value: number[]) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {
    effect(() => {
      const availableTagIds = new Set(this.tags().map((t) => t.id));
      const current = this.selectedTagIds();
      const pruned = current.filter((id) => availableTagIds.has(id));

      if (pruned.length !== current.length) {
        this.selectedTagIds.set(pruned);
        this.onChange(pruned);
      }
    });
  }

  writeValue(value: number[] | null) {
    this.selectedTagIds.set(Array.isArray(value) ? value : []);
  }

  registerOnChange(fn: (value: number[]) => void) {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void) {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean) {
    this.disabled.set(isDisabled);
  }

  isTagSelected(tagId: number): boolean {
    return this.selectedTagIds().includes(tagId);
  }

  toggleTag(tagId: number) {
    if (this.disabled()) return;

    const current = this.selectedTagIds();
    const updated = current.includes(tagId)
      ? current.filter((id) => id !== tagId)
      : [...current, tagId];

    this.selectedTagIds.set(updated);
    this.onChange(updated);
    this.onTouched();
  }
}
