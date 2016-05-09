import { Directive, ElementRef } from '@angular/core';

@Directive({
  selector: '[my-highlight]'
})
export class MyHighlightDirective {
  constructor(el: ElementRef) {
    el.nativeElement.style.backgroundColor = '#FFFF00';
  }
}
