import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { Header } from './shared/components/header/header';

@Component({
  imports: [RouterOutlet, RouterLink, Header],
  selector: 'app-root',
  host: { class: 'block min-h-[100dvh]' },
  templateUrl: './app.html',
})
export class App {}
