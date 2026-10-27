import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TagBadgeComponent } from '../../../../shared/tag-badge/tag-badge';
import { TaskFilterService } from '../task-filter.service';

@Component({
  selector: 'app-task-search',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-2">
      <div class="flex items-center gap-4">
        <div class="relative md:w-xs">
          <div class="absolute flex items-center pointer-events-none inset-y-0 inset-s-0 p-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="2"
              stroke="currentColor"
              class="size-5 text-gray-400"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
              />
            </svg>
          </div>
          <input
            #searchInput
            type="search"
            placeholder="Search"
            class="block w-full h-11 px-2 ps-11 py-1 border border-gray-400 rounded-md"
            [value]="taskFilterService.searchQuery()"
            (input)="taskFilterService.setSearchQuery(searchInput.value)"
          />
        </div>

        <label for="archivedCtrl" class="flex items-center gap-2 text-sm font-medium text-gray-600 cursor-pointer select-none shrink-0">
          <input
            id="archivedCtrl"
            type="checkbox"
            [checked]="taskFilterService.showArchived()"
            (change)="taskFilterService.toggleArchived()"
            class="w-4 h-4 text-indigo-600 bg-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
          />
          Show Archived
        </label>
      </div>

      @if (taskFilterService.availableTags().length > 0) {
        <div class="flex flex-wrap items-center gap-1.5 pt-1">
          <span class="text-xs font-medium text-gray-500 me-1">Filter tags:</span>

          @for (tag of taskFilterService.availableTags(); track tag.id) {
            <button
              type="button"
              (click)="taskFilterService.toggleTag(tag.id)"
              class="cursor-pointer transition-opacity"
              [class.opacity-40]="!taskFilterService.isTagSelected(tag.id)"
              [class.opacity-100]="taskFilterService.isTagSelected(tag.id)"
            >
              <app-tag-badge [tag]="tag" />
            </button>
          }

          @if (taskFilterService.selectedTagIds().length > 0) {
            <button
              type="button"
              (click)="taskFilterService.clearTagFilters()"
              class="text-xs text-indigo-600 hover:text-indigo-800 font-medium ms-1 cursor-pointer"
            >
              Clear
            </button>
          }
        </div>
      }
    </div>
  `,
  imports: [TagBadgeComponent],
})
export class TaskSearchComponent {
  readonly taskFilterService = inject(TaskFilterService);
}
