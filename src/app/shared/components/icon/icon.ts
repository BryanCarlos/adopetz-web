import { Component, computed, input } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucidePawPrint,
  lucideHeart,
  lucideArrowRight,
  lucideUser,
  lucideSearch,
  lucideChevronRight,
  lucideCalendar,
  lucideMail,
  lucideMessageCircle,
  lucideShieldCheck,
} from '@ng-icons/lucide';
const icons: Record<string, string> = {
  paw: 'lucidePawPrint',
  heart: 'lucideHeart',
  arrow: 'lucideArrowRight',
  user: 'lucideUser',
  search: 'lucideSearch',
  chevron: 'lucideChevronRight',
  calendar: 'lucideCalendar',
  mail: 'lucideMail',
  chat: 'lucideMessageCircle',
  shield: 'lucideShieldCheck',
};
@Component({
  selector: 'app-icon',
  imports: [NgIcon],
  providers: [
    provideIcons({
      lucidePawPrint,
      lucideHeart,
      lucideArrowRight,
      lucideUser,
      lucideSearch,
      lucideChevronRight,
      lucideCalendar,
      lucideMail,
      lucideMessageCircle,
      lucideShieldCheck,
    }),
  ],
  host: { class: 'inline-flex size-[1.25em] shrink-0', 'aria-hidden': 'true' },
  template: '<ng-icon [name]="icon()" size="1.25em" />',
})
export class Icon {
  readonly name = input('paw');
  protected readonly icon = computed(() => icons[this.name()] ?? icons['paw']);
}
