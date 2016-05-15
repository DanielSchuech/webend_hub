import 'zone.js/dist/zone';
import 'reflect-metadata';
import 'angular';
import {ngAdapter} from 'ngadapter/build/ngAdapter';

declare var window: any;
window.webend = {};
declare var webend: any;
webend.adapter = new ngAdapter(angular.module('webendApp', []));

import './app.component';

webend.adapter.bootstrap(document.body, ['webendApp']);
