import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { AuthService } from '../../../../core/services/auth.service';
import { Icon } from '../../../../shared/components/icon/icon';
import { Subject, exhaustMap, catchError, of } from 'rxjs';
@Component({
  imports: [FormsModule, RouterLink, HlmButtonImports, Icon],
  template: `<section class="auth-page container">
    <div class="auth-intro">
      <span class="eyebrow">ÁREA DA ONG</span>
      <h1>Você cuida deles.<br /><span>A gente ajuda a encontrar um lar.</span></h1>
      <p>Entre com o acesso da sua organização para acompanhar os pets cadastrados.</p>
      <a routerLink="/">← Voltar para a vitrine</a>
    </div>
    <form #form="ngForm" class="form-panel" (ngSubmit)="submit(form)">
      <span class="panel-icon"><app-icon name="user" /></span>
      <h2>Que bom ter você aqui.</h2>
      <p>Use o e-mail e a senha da sua ONG.</p>
      @if (passwordChanged) {
        <p role="status">Senha alterada! Entre com sua nova senha.</p>
      }
      @if (expired) {
        <p role="status">Sua sessão expirou. Entre novamente para continuar.</p>
      }
      @if (unavailable) {
        <p role="status">
          Não foi possível recuperar a sessão. Confira sua conexão e tente novamente.
        </p>
      }
      <label for="email">E-mail</label
      ><input
        id="email"
        type="email"
        name="email"
        [(ngModel)]="email"
        required
        email
        autocomplete="username"
        placeholder="contato@ong.org.br"
        [disabled]="busy()"
      />
      <label for="password">Senha</label
      ><input
        id="password"
        type="password"
        name="password"
        [(ngModel)]="password"
        required
        autocomplete="current-password"
        placeholder="Sua senha"
        [disabled]="busy()"
      />
      @if (error()) {
        <p class="form-error" role="alert">{{ error() }}</p>
      }
      <button hlmBtn type="submit" class="action-button" [disabled]="busy() || form.invalid">
        {{ busy() ? 'Entrando...' : 'Entrar' }}<app-icon name="arrow" />
      </button>
      <p class="form-hint">
        O acesso é exclusivo para organizações cadastradas. As contas são criadas pelo responsável
        pelo Adopetz.
      </p>
    </form>
  </section>`,
})
export class Login {
  private readonly route = inject(ActivatedRoute);
  protected readonly expired = this.route.snapshot.queryParamMap.has('expired');
  protected readonly unavailable = this.route.snapshot.queryParamMap.has('unavailable');
  protected readonly passwordChanged =
    inject(ActivatedRoute).snapshot.queryParamMap.has('passwordChanged');
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly submissions = new Subject<void>();
  protected email = '';
  protected password = '';
  protected readonly busy = signal(false);
  protected readonly error = signal('');
  constructor() {
    this.submissions
      .pipe(
        exhaustMap(() => {
          this.busy.set(true);
          this.error.set('');
          return this.auth.login(this.email.trim(), this.password).pipe(
            catchError((error) => {
              this.error.set(
                error.status === 401
                  ? 'E-mail ou senha incorretos.'
                  : error.status === 429
                    ? 'Muitas tentativas. Aguarde um momento antes de tentar novamente.'
                    : 'Não foi possível entrar. Tente novamente em instantes.',
              );
              return of(null);
            }),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((response) => {
        this.busy.set(false);
        if (response) {
          this.password = '';
          void this.router.navigate(['/ong']);
        }
      });
  }
  protected submit(form: NgForm) {
    if (form.valid) this.submissions.next();
  }
}
