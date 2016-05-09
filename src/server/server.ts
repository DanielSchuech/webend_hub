import Injector = require('tiny-di');
import * as express from 'express';
import * as path from 'path';
import TinyDiInjectable from './tinydiinjectable';

let serverConfig = require('../config');

export default class HUB extends TinyDiInjectable {
  private injector: TinyDiInjector;
  private app: express.Application;
  
  constructor(_config: any, deps: any, status: any) {
    super();
    
    let config = _config['webend_hub'];
    
    this.injector = new Injector();
    this.injector.setResolver(this.dependencyResolver);
    this.injector.bind('config').to(config);
    this.injector.bind('dependencies').to(deps);
    this.injector.bind('status').to(status);
    
    this.app = express();
    this.injector.bind('server').to(this.app);
    
    this.loadModules();
    
    this.app.listen(config.port);
  }
  
  dependencyResolver(moduleId: string) {
    let modulePath = path.join(__dirname, moduleId);
    try {
      return require(modulePath).default;
    } catch (e) {
      try {
        return require(moduleId).default;
      } catch (e2) {
        console.log('Extension ' + moduleId + ' failed to load for webend_hub');
        console.log(modulePath);
        console.log('errors' + e + e2);
        console.log(new Error().stack);
        return false;
      }
    }
  }
  
  loadModules() {
    serverConfig.server.modules.forEach((module: any) => {
      let file: string = module.file || module.module;
      this.injector.bind(module.module).load(file);
    });
  }
}
HUB.$inject = {
  deps: ['config', 'dependencies', 'status'],
  callAs: 'class'
};
