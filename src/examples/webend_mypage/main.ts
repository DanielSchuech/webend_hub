import { Component, OnInit, Inject } from '@angular/core';
declare var window: any;
let MyPageService = window.getService('MyPageService');

@Component({
  moduleId: module.id,
  selector: 'webend_mypage',
  template: 'this my page!!! <my-addon></my-addon> {{secret}}',
  directives: [window.getComponent('my-addon')],
  providers: [MyPageService]
})
export class webend_mypageComponent implements OnInit {
  public secret: string;
  constructor(@Inject(MyPageService) myService: any) {
    this.secret = myService.secret;
  }

  ngOnInit() { }

}
