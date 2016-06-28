import TinyDiInjectable from '../tinydiinjectable';
import * as express from 'express';
import * as path from 'path';

export default class Static extends TinyDiInjectable {
  constructor(server: express.Application, config: any) {
    super();
    
    let indexHTML: string = path.resolve(__dirname + '/../../app/index.html');
    let jsBundle: string = path.resolve(__dirname + '/../../app/bundle.js');
    let bundleSourceMap: string = path.resolve(__dirname + '/../../app/bundle.js.map');
    let vendorBundle: string = path.resolve(__dirname + '/../../app/vendor.js');
    let vendorSourceMap: string = path.resolve(__dirname + '/../../app/vendor.js.map');
    
    //deliver bundle + sourcemap
    server.get('/bundle.js', (req, res) => {
      res.sendFile(jsBundle);
    });
    server.get('/bundle.js.map', (req, res) => {
      res.sendFile(bundleSourceMap);
    });
    server.get('/vendor.js', (req, res) => {
      res.sendFile(vendorBundle);
    });
    server.get('/vendor.js.map', (req, res) => {
      res.sendFile(vendorSourceMap);
    });
    
    //deliver index.html
    server.get('/', (req, res) => {
      if (config.useCustomIndexHtml === 'true') {
        res.send(config['index.html']);
      } else {
        res.sendFile(indexHTML);
      }
    });
    
  }
}
Static.$inject = {
  deps: ['hub_server', 'config'],
  callAs: 'class'
};
