import {
  HlmPagination,
  HlmPaginationContent,
  HlmPaginationItem,
  HlmPaginationLink,
} from '@spartan-ng/helm/pagination';
import { Component, computed, input, output } from '@angular/core';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { Icon } from '../icon/icon';
@Component({
  selector: 'app-pagination',
  imports: [
    HlmPagination,
    HlmPaginationContent,
    HlmPaginationItem,
    HlmPaginationLink,
    HlmButtonImports,
    Icon,
  ],
  template: `@if (totalPages() > 1) {
    <nav hlmPagination class="mt-8" aria-label="Paginação dos pets">
      <ul hlmPaginationContent class="flex-wrap">
        <li hlmPaginationItem>
          <button
            hlmBtn
            size="icon"
            variant="outline"
            aria-label="Página anterior"
            [disabled]="disabled() || page() <= 1"
            (click)="pageChange.emit(page() - 1)"
          >
            <app-icon name="chevron" class="rotate-180" />
          </button>
        </li>
        @for (number of numbers(); track number) {
          <li hlmPaginationItem>
            <button
              hlmPaginationLink
              [isActive]="number === page()"
              [attr.aria-label]="'Página ' + number"
              [disabled]="disabled()"
              (click)="pageChange.emit(number)"
            >
              {{ number }}
            </button>
          </li>
        }
        <li hlmPaginationItem>
          <button
            hlmBtn
            size="icon"
            variant="outline"
            aria-label="Próxima página"
            [disabled]="disabled() || page() >= totalPages()"
            (click)="pageChange.emit(page() + 1)"
          >
            <app-icon name="chevron" />
          </button>
        </li>
      </ul>
    </nav>
    <p class="mt-3 text-center text-xs text-muted-foreground">
      Página {{ page() }} de {{ totalPages() }}
    </p>
  }`,
})
export class Pagination {
  readonly page = input(1);
  readonly totalPages = input(1);
  readonly disabled = input(false);
  readonly pageChange = output<number>();
  readonly numbers = computed(() => {
    const start = Math.max(1, Math.min(this.page() - 2, this.totalPages() - 4));
    return Array.from({ length: Math.min(5, this.totalPages()) }, (_, index) => start + index);
  });
}
