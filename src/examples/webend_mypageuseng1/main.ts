import { Component, OnInit } from '@angular/core';

declare var webend: any;

@Component({
  moduleId: module.id,
  selector: 'webend_mypageuseng1',
  template: `
    <div red-light>This Plugin uses an ng1 directive</div>
  `,
  /**
   * for optional directive use the following directive
   * webend.adapter.upgradeNg1Directive(webend.getOptNg1Directive('redLight'))
   */
  directives: [webend.adapter.upgradeNg1Directive('redLight')]
})
export class MyPageUseNg1Component implements OnInit {
  constructor() { }

  ngOnInit() { }

}
