import 'zone.js/dist/zone';
import 'reflect-metadata';
import 'angular';
import {ngAdapter} from 'ngadapter/build/ngAdapter';

declare var window: any;
window.adapter = new ngAdapter(angular.module('webendApp', []));

import './app.component';

window.adapter.bootstrap(document.body, ['webendApp']);
