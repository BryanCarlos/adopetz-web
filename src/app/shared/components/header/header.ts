import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { AuthService } from '../../../core/services/auth.service';
import { Icon } from '../icon/icon';
@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive, HlmButtonImports, Icon],
  template: ` <a
      class="skip-link fixed [top:-100px] [left:16px] [z-index:9999] p-[12px_18px] bg-card text-foreground rounded-[8px] [&:focus]:[top:12px]"
      href="#conteudo"
      >Pular para o conteúdo</a
    >
    <header class="topbar bg-foreground text-card">
      <nav
        class="container w-[min(1100px,_calc(100%_-_64px))] mx-auto px-0 max-[701px]:w-[calc(100%_-_36px)] nav min-h-[98px] flex justify-between items-center gap-5 max-[541px]:min-h-[84px] max-[541px]:gap-3 max-[541px]:flex-wrap max-[541px]:py-[14px]"
        aria-label="Navegação principal"
      >
        <a
          routerLink="/"
          class="brand flex items-center gap-3 text-[36px] font-[850] tracking-[-1.5px] leading-[1] [&_small]:block [&_small]:text-[11px] [&_small]:font-normal [&_small]:tracking-[0.5px] [&_small]:text-secondary [&_small]:mt-[9px] max-[541px]:text-[28px] max-[541px]:[&_small]:text-[9px]"
          aria-label="Adopetz — início"
          ><span
            class="brand-mark text-[43px] text-adoption [transform:rotate(-12deg)] max-[541px]:text-[31px]"
            ><app-icon /></span
          ><span
            >Adopet<span class="brand-z text-adoption">z</span
            ><small>Mais que um pet, uma família.</small></span
          ></a
        >
        <div
          class="nav-links flex items-center gap-[34px] text-[14px] font-semibold [&_>_a.active]:text-adoption max-[541px]:gap-[15px] max-[541px]:[&_>_a:first-child]:hidden"
        >
          <a
            routerLink="/"
            routerLinkActive="active"
            [routerLinkActiveOptions]="{ exact: true }"
            ariaCurrentWhenActive="page"
            >Início</a
          >
          @if (auth.accessToken()) {
            <a routerLink="/ong" routerLinkActive="active" ariaCurrentWhenActive="page"
              >Meus pets</a
            >
            <button
              hlmBtn
              variant="navigation"
              class="gap-[9px]"
              [disabled]="leaving()"
              (click)="logout()"
            >
              {{ leaving() ? 'Saindo...' : 'Sair' }}
            </button>
          } @else {
            <a hlmBtn routerLink="/login" variant="navigation" class="gap-[9px]"
              ><app-icon name="user" /> <span>Login</span></a
            >
          }
        </div>
      </nav>
    </header>
    @if (auth.sessionUnavailable()) {
      <p
        class="session-note p-[12px_18px] bg-adoption-surface text-foreground text-center text-[13px]"
        role="status"
      >
        Não foi possível renovar a sessão. Tentaremos novamente em instantes.
      </p>
    }
    @if (logoutError()) {
      <p
        class="session-note p-[12px_18px] bg-adoption-surface text-foreground text-center text-[13px]"
        role="alert"
      >
        {{ logoutError() }}
      </p>
    }`,
})
export class Header {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly leaving = signal(false);
  protected readonly logoutError = signal('');
  protected logout() {
    if (this.leaving()) return;
    this.leaving.set(true);
    this.logoutError.set('');
    this.auth.logout().subscribe({
      next: () => this.finishLogout(),
      error: () => {
        this.leaving.set(false);
        this.logoutError.set('Não foi possível encerrar a sessão. Tente sair novamente.');
      },
    });
  }
  private finishLogout() {
    this.leaving.set(false);
    void this.router.navigate(['/']);
  }
}
