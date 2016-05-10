import { Component, OnInit } from '@angular/core';

declare var window: any;

@Component({
  moduleId: module.id,
  selector: 'webend_mypageuseng1',
  template: `
    <div red-light>This Plugin uses an ng1 directive</div>
  `,
  /**
   * for optional directive use the following directive
   * window.adapter.upgradeNg1Directive(window.getOptNg1Directive('redLight'))
   */
  directives: [window.adapter.upgradeNg1Directive('redLight')]
})
export class MyPageUseNg1Component implements OnInit {
  constructor() { }

  ngOnInit() { }

}
