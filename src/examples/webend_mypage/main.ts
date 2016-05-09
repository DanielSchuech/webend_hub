import { Component, OnInit } from '@angular/core';
declare var window: any;
@Component({
  moduleId: module.id,
  selector: 'webend_mypage',
  template: 'this my page!!! <my-addon></my-addon>',
  directives: [window.getComponent('my-addon')]
})
export class webend_mypageComponent implements OnInit {
  constructor() { }

  ngOnInit() { }

}
