import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { catchError, of, Subject, switchMap, tap } from 'rxjs';
import { Page, PublicPet } from '../../../../core/models/pet';
import { PetsService } from '../../../../core/services/pets.service';
import { Icon } from '../../../../shared/components/icon/icon';
import { Pagination } from '../../../../shared/components/pagination/pagination';
import { PetCard } from '../../components/pet-card/pet-card';
import { Hero } from '../../components/hero/hero';

@Component({
  imports: [FormsModule, HlmButtonImports, Icon, Pagination, PetCard, Hero],
  templateUrl: './showcase.html',
  styleUrl: './showcase.css',
})
export class Showcase {
  private readonly pets = inject(PetsService);
  private readonly requests = new Subject<number>();
  protected readonly result = signal<Page<PublicPet> | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected searchTerm = '';
  private appliedSearch = '';
  constructor() {
    this.requests
      .pipe(
        tap(() => {
          this.loading.set(true);
          this.error.set('');
        }),
        switchMap((page) =>
          this.pets.search(page, this.appliedSearch).pipe(
            catchError((error) => {
              this.error.set(
                error.status === 429
                  ? 'Muitas consultas em pouco tempo. Aguarde um momento e tente novamente.'
                  : 'Não foi possível carregar os pets. Tente novamente em instantes.',
              );
              return of(null);
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((result) => {
        this.result.set(result);
        this.loading.set(false);
      });
    this.load(1);
  }
  protected load(page: number) {
    this.requests.next(page);
  }
  protected search() {
    this.appliedSearch = this.searchTerm.trim();
    this.load(1);
  }
}
