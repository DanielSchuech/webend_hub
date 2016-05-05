import TinyDiInjectable from '../tinydiinjectable';
import * as express from 'express';
import * as path from 'path';

let config = require('../../config');

export default class Static extends TinyDiInjectable {
  constructor(server: express.Application, config: any) {
    super();
    
    let indexHTML: string = path.resolve(__dirname + '/../../app/index.html');
    let jsBundle: string = path.resolve(__dirname + '/../../app/bundle.js');
    let bundleSourceMap: string = path.resolve(__dirname + '/../../app/bundle.js.map');
    let vendorBundle: string = path.resolve(__dirname + '/../../app/vendor.js');
    let vendorSourceMap: string = path.resolve(__dirname + '/../../app/vendor.js.map');
    
    //deliver app scripts
    /*server.get('/app/:component', (req, res) => {
      let cmp = path.resolve(__dirname + '/../../app/' + req.params.component);
      res.sendFile(cmp);
    });
    
    
    //deliver requires in node modules
    server.get('/:bundle*', (req, res) => {
      let bundle = req.params.bundle + req.params['0'];
      let file = path.resolve(__dirname + '/../../' + config.pathToNodeModules + bundle);
      if (path.extname(file) !== '.js' && path.extname(file) !== '.ts') {
        res.sendStatus(403);
        return;
      }
      res.sendFile(file);
    });*/
    
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
    server.get('*', (req, res) => {
      res.sendFile(indexHTML);
    });
    
  }
}
Static.$inject = {
  deps: ['server', 'config'],
  callAs: 'class'
};
