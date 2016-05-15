import { Component, OnInit, Inject } from '@angular/core';
declare var webend: any;
let MyPageService = webend.getService('MyPageService');

@Component({
  moduleId: module.id,
  selector: 'webend_mypage',
  template: '<span my-highlight>this my page!!!</span> <my-addon></my-addon> {{secret}}',
  directives: [webend.getComponent('my-addon'), webend.getDirective('[my-highlight]')],
  providers: [MyPageService]
})
export class webend_mypageComponent implements OnInit {
  public secret: string;
  constructor(@Inject(MyPageService) myService: any) {
    this.secret = myService.secret;
  }

  ngOnInit() { }

}
