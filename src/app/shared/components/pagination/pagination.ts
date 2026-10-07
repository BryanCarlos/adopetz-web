import { Component, computed, input, output } from '@angular/core';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { Icon } from '../icon/icon';
@Component({
  selector: 'app-pagination',
  imports: [HlmButtonImports, Icon],
  template: `@if (totalPages() > 1) {
    <nav class="pagination" aria-label="Paginação dos pets">
      <button
        hlmBtn
        variant="outline"
        class="page-button"
        aria-label="Página anterior"
        [disabled]="disabled() || page() <= 1"
        (click)="pageChange.emit(page() - 1)"
      >
        <app-icon name="chevron" class="previous" />
      </button>
      @for (number of numbers(); track number) {
        <button
          hlmBtn
          variant="ghost"
          class="page-button"
          [class.selected]="number === page()"
          [attr.aria-current]="number === page() ? 'page' : null"
          [attr.aria-label]="'Página ' + number"
          [disabled]="disabled()"
          (click)="pageChange.emit(number)"
        >
          {{ number }}
        </button>
      }
      <button
        hlmBtn
        variant="outline"
        class="page-button"
        aria-label="Próxima página"
        [disabled]="disabled() || page() >= totalPages()"
        (click)="pageChange.emit(page() + 1)"
      >
        <app-icon name="chevron" />
      </button>
    </nav>
    <p class="page-summary">Página {{ page() }} de {{ totalPages() }}</p>
  }`,
  styles: [
    `
      .pagination {
        display: flex;
        justify-content: center;
        gap: 8px;
        margin-top: 38px;
      }
      .page-button {
        width: 44px;
        height: 44px;
        border-radius: 50%;
        color: var(--navy);
        background: white;
      }
      .page-button.selected {
        background: var(--gold);
        font-weight: 700;
      }
      .previous {
        transform: rotate(180deg);
      }
      .page-summary {
        text-align: center;
        font-size: 12px;
        color: var(--muted-foreground);
        margin-top: 14px;
      }
    `,
  ],
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
