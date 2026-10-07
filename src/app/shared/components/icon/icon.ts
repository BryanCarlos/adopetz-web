import { Component, input } from '@angular/core';
const paths: Record<string, string> = {
  paw: 'M12 12c-3 0-7 4-7 7 0 4 4 3 7 2 3 1 7 2 7-2 0-3-4-7-7-7ZM5 5c-3 0-3 6 0 6s3-6 0-6Zm5-4c-3 0-3 7 0 7s3-7 0-7Zm6 0c-3 0-3 7 0 7s3-7 0-7Zm5 4c-3 0-3 6 0 6s3-6 0-6Z',
  heart:
    'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z',
  arrow: 'M5 12h14m-6-6 6 6-6 6',
  user: 'M20 21v-2a7 7 0 0 0-14 0v2M17 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z',
  search: 'm21 21-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z',
  chevron: 'm9 5 7 7-7 7',
  calendar:
    'M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z',
  mail: 'M3 5h18v14H3ZM3 5l9 7 9-7',
  chat: 'M21 11.5a9 9 0 0 1-9 9c-1.5 0-3-.3-4.3-1L3 21l1.5-4.7A9 9 0 1 1 21 11.5ZM8 8c0 4 4 8 8 8',
  shield: 'm12 2 9 4v6c0 6-9 10-9 10S3 18 3 12V6ZM8 12l3 3 5-6',
};
@Component({
  selector: 'app-icon',
  template:
    '<svg viewBox="0 0 24 24" aria-hidden="true" [attr.fill]="name() === \'paw\' ? \'currentColor\' : \'none\'" stroke="currentColor" [attr.stroke-width]="name() === \'paw\' ? 0 : 1.8" stroke-linecap="round" stroke-linejoin="round"><path [attr.d]="path" /></svg>',
  styles: [
    ':host { display: inline-flex; width: 1.25em; height: 1.25em; flex-shrink: 0; } svg { width: 100%; height: 100%; }',
  ],
})
export class Icon {
  readonly name = input('paw');
  protected get path() {
    return paths[this.name()] ?? paths['paw'];
  }
}
