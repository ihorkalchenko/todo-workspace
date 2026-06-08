import {ChangeDetectionStrategy, Component, model} from '@angular/core';

@Component({
  selector: 'app-task-search',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative">
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
        [value]="query()"
        (input)="onInput(searchInput.value)"
      />
    </div>
  `,
})
export class TaskSearchComponent {
  readonly query = model.required<string>();

  onInput(value: string) {
    this.query.set(value);
  }
}
