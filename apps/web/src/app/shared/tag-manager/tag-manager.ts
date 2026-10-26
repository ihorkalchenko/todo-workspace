import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { form, FormField, FormRoot, required} from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';

import { TagsService } from '../../core/tags/tags.service';
import { TagBadgeComponent } from '../tag-badge/tag-badge';

const DEFAULT_COLOR = '#3B82F6';

@Component({
  selector: 'app-tag-manager',
  imports: [TagBadgeComponent, FormField, FormRoot],
  template: `
    <div class="p-4 bg-white rounded-lg shadow border border-gray-200">
      <h3 class="text-sm font-semibold text-gray-700 mb-3">Manage Tags</h3>

      <div class="flex flex-wrap gap-2 mb-4">
        @for (tag of tags(); track tag.id) {
          <div class="inline-flex items-center gap-1 bg-gray-100 p-1 rounded-full">
            <app-tag-badge
              [tag]="tag"
              [removable]="true"
              (removed)="deleteTag(tag.id)"
            />
          </div>
        }
      </div>

      <form [formRoot]="tagForm">
        <div class="flex items-center gap-2">
          <input
            type="text"
            placeholder="New Tag Name..."
            [formField]="tagForm.name"
            class="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            [class.border-red-500]="tagForm.name().touched() && tagForm.name().invalid()"
          />

          <input
            type="color"
            [formField]="tagForm.color"
            class="w-8 h-8 rounded cursor-pointer border border-gray-300"
          />

          <button
            type="submit"
            [disabled]="tagForm().invalid() || tagForm().submitting()"
            class="px-3 py-1.5 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ tagForm().submitting() ? 'Adding...' : 'Add' }}
          </button>
        </div>

        @if (tagForm.name().touched() && tagForm.name().invalid()) {
          <div class="error-enter mt-0.75">
            @for (error of tagForm.name().errors(); track error) {
              <p class="text-xs text-red-500">{{ error.message }}</p>
            }
          </div>
        }
      </form>
    </div>
  `,
  styleUrl: './tag-manager.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TagManagerComponent {
  readonly tagsService = inject(TagsService);

  readonly formModel = signal({
    name: '',
    color: DEFAULT_COLOR,
  });

  readonly tagForm = form(
    this.formModel,
    (path) => {
      required(path.name, { message: 'Tag name is required' });
    },
    {
      submission: {
        action: async () => {
          const { name, color } = this.formModel();
          const trimmed = name.trim();
          if (!trimmed) return;

          await firstValueFrom(
            this.tagsService.createTag({ name: trimmed, color }),
          );
          this.formModel.set({ name: '', color: DEFAULT_COLOR });
        },
      },
    },
  );

  readonly tags = this.tagsService.tags;

  deleteTag(tagId: number) {
    this.tagsService.deleteTag(tagId).subscribe();
  }
}
