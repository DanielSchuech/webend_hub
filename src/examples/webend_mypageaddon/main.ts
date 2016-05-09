import { Component, OnInit } from '@angular/core';

@Component({
  moduleId: module.id,
  selector: 'my-addon',
  template: ' !|->this is an addon!'
})
export class MyAddonComponent implements OnInit {
  constructor() { }

  ngOnInit() { }

}
