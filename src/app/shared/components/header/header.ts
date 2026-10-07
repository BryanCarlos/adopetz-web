import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { AuthService } from '../../../core/services/auth.service';
import { Icon } from '../icon/icon';
@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive, HlmButtonImports, Icon],
  template: ` <a class="skip-link" href="#conteudo">Pular para o conteúdo</a>
    <header class="topbar">
      <nav class="container nav" aria-label="Navegação principal">
        <a routerLink="/" class="brand" aria-label="Adopetz — início"
          ><span class="brand-mark"><app-icon /></span
          ><span
            >Adopet<span class="brand-z">z</span><small>Mais que um pet, uma família.</small></span
          ></a
        >
        <div class="nav-links">
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
              variant="ghost"
              class="login-link"
              [disabled]="leaving()"
              (click)="logout()"
            >
              {{ leaving() ? 'Saindo...' : 'Sair' }}
            </button>
          } @else {
            <a hlmBtn routerLink="/login" variant="outline" class="login-link"
              ><app-icon name="user" /> <span>Login</span></a
            >
          }
        </div>
      </nav>
    </header>
    @if (auth.sessionUnavailable()) {
      <p class="session-note" role="status">
        Não foi possível renovar a sessão. Tentaremos novamente em instantes.
      </p>
    }
    @if (logoutError()) {
      <p class="session-note" role="alert">{{ logoutError() }}</p>
    }`,
  styleUrl: './header.css',
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
