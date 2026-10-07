import { Component } from '@angular/core';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { Icon } from '../../../../shared/components/icon/icon';
@Component({
  selector: 'app-showcase-hero',
  imports: [HlmButtonImports, Icon],
  templateUrl: './hero.html',
  styleUrl: './hero.css',
})
export class Hero {}
