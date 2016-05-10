import TinyDiInjectable from '../tinydiinjectable';

import * as fs from 'fs';
import * as path from 'path';
import {exec} from 'child_process';

export default class FrontendBundler extends TinyDiInjectable {
  constructor(private deps: any, private autostart: any,
      addManualStartListener: Function, status: any) {
    super();
    this.createBundle(this.autostart);
    addManualStartListener(() => {
      this.createBundle(status);
    });
  }
  
  createBundle(pluginStatus: any) {
    let startedPlugins: string[] = [];
    if (pluginStatus) {
      Object.keys(pluginStatus).forEach((plugin) => {
        if (pluginStatus[plugin] && this.deps[plugin] && this.deps[plugin].browser) {
          startedPlugins.push(plugin);
        }
      });
    }
    
    let file = this.createFileContent(startedPlugins);
    
    let bundleFolder = path.normalize(__dirname + '/../../app/');
    let depFile = bundleFolder + 'app.component.ts';
    
    //write file
    fs.writeFile(depFile, file, (err) => {
      //bundle
      let configPath = path.normalize(__dirname + '/../../../webpack.config.js');
      exec(`webpack --config ${configPath} ${bundleFolder}main.ts ${bundleFolder}bundle.js`, 
        (error, stdout, stderr) => {
          if (error) {
            console.log(`Error on creating bundle: ${error}`);
          }
          if (stderr) {
            console.log(stderr);
          }
          console.log(stdout);
        });
    });
  }
  
  createFileContent(startedPlugins: string[]) {
    let file = `import {Component, Directive, Injectable} from '@angular/core';\n`;
    file += `import {dashToCamel} from 'ngAdapter/build/helper';`;
    file += `let module = angular.module('webendApp');`;
    file += `declare var Reflect: any;\n`;
    file += `let components: any[] = [];\n`;
    file += `let directives: any[] = [];\n`;
    file += `let services: any[] = [];\n`;
    file += `let meta: any;\n`;
    file += `declare var window: any;\n`;
    file += `window.components = components;\n`;
    file += `window.directives = directives;\n`;
    file += `window.services = services;\n`;
    file += this.getComponentFn();
    file += this.getDirectiveFn();
    file += this.getServiceFn();
    file += this.getOptNg1Service();
    file += this.getOptNg1Directive();
    
    //import plugin components
    let loadedPlugins: string[] = [];
    startedPlugins.forEach((plugin) => {
      file += this.addPlugin(startedPlugins, plugin, loadedPlugins);
    });
    
    //create component
    // file += `@Component({\n`;
    // file += `  selector: 'webend-hub',\n`;
    // file += `  template: '`;
    // startedPlugins.forEach((plugin) => {
    //   file += `<${plugin}></${plugin}>`;
    // });
    // file += `',\n`;
    // file += `  directives: [...components]\n`;
    // file += `})\n`;
    // file += `export class HubComponent {}`;
    
    file += `
      module.component('webendHub', {
          template: \`
    `;
    startedPlugins.forEach((plugin) => {
      file += `<${plugin}></${plugin}>`;
    });
    file += `\`
        });
    `;
    
    return file;
  }
  
  addPlugin(startedPlugins: string[], plugin: string, loadedPlugins: string[]) {
    //plugin already loaded or not started
    if (loadedPlugins.indexOf(plugin) > -1 || startedPlugins.indexOf(plugin) === -1) {
      return '';
    }
    
    let file = '';
    
    //load optional deps & deps
    let opt = this.deps[plugin].optionalDependencies;
    if (opt) {
      Object.keys(opt).forEach((dependency) => {
        if (this.deps[dependency]) {
          file += this.addPlugin(startedPlugins, dependency, loadedPlugins);
        }
      });
    }
    let deps = this.deps[plugin].dependencies;
    if (deps) {
      Object.keys(deps).forEach((dependency) => {
        file += this.addPlugin(startedPlugins, dependency, loadedPlugins);
      });
    }

    //load plugin
    // file += `import * as ${plugin} from '${plugin}/${this.deps[plugin].browser.entry}';\n`;
    let frameworks: any = {
      angular: this.loadAngularJSPlugin.bind(this),
      angular2: this.loadAngular2Plugin.bind(this)
    };
    file += frameworks[this.deps[plugin].browser.framework](plugin);
    
    loadedPlugins.push(plugin);
    return file;
  }
  
  getComponentFn() {
    return `window.getComponent = (name: string) => {
      let found: any;
      window.components.forEach((cmp: any) => {
        meta = Reflect.getOwnMetadata('annotations', cmp);
        if (meta && meta[0] && meta[0].selector === name) {
          found = cmp;
        }
      });
      if (found) {
        return found;
      }
      
      @Component({
        template: '',
        selector: 'webend-empty'
      })
      class WebendEmpty {}
      return WebendEmpty;
    };\n`;
  }
  
  getDirectiveFn() {
    return `window.getDirective = (name: string) => {
      let found: any;
      window.directives.forEach((cmp: any) => {
        meta = Reflect.getOwnMetadata('annotations', cmp);
        if (meta && meta[0] && meta[0].selector === name) {
          found = cmp;
        }
      });
      if (found) {
        return found;
      }
      
      @Directive({
        selector: 'webend-empty-directive'
      })
      class WebendEmptyDirective {}
      return WebendEmptyDirective;
    };\n`;
  }
  
  getServiceFn() {
    return `window.getService = (name: string) => {
      let found: any;
      window.services.forEach((srv: any) => {
        if (srv.name === name) {
          found = srv;
        }
      });
      if (found) {
        return found;
      }
      
      @Injectable()
      class WebendEmptyService {}
      return WebendEmptyService;
    };\n`;
  }
  
  loadAngular2Plugin(plugin: string) {
    return `
      import * as ${plugin} from '${plugin}/${this.deps[plugin].browser.entry}';
      if (${plugin}) {
        Object.keys(${plugin}).forEach((exp) => {
          meta = Reflect.getOwnMetadata('annotations', (<any>${plugin})[exp]);
          if (meta && meta[0] && meta[0]) {
            if (meta[0].constructor.name === 'ComponentMetadata' ||
                meta[0].constructor.name === 'DirectiveMetadata') {
              //bind to angular module
              if (meta[0].selector) {
                if (meta[0].template) {
                  components.push((<any>${plugin})[exp]);
                  module.directive(dashToCamel(meta[0].selector), 
                    <any>window.adapter.downgradeNg2Component((<any>${plugin})[exp]));
                } else {
                  directives.push((<any>${plugin})[exp]);
                  let selector = meta[0].selector;
                  module.directive(dashToCamel(selector.substring(1, selector.length - 1)), 
                    <any>window.adapter.downgradeNg2Directive((<any>${plugin})[exp]));
                }
                
              }
            }
            if (meta[0].constructor.name === 'InjectableMetadata') {
              window.adapter.addProvider((<any>${plugin})[exp]);
              module.factory(exp, 
                window.adapter.downgradeNg2Provider((<any>${plugin})[exp]));
              services.push((<any>${plugin})[exp]);
            }
          }
        });
      }
    `;
  }
  
  loadAngularJSPlugin(plugin: string) {
    return `
      import '${plugin}/${this.deps[plugin].browser.entry}';
      module.requires.push('${plugin}');
    `;
  }
  
  getOptNg1Service() {
    return `
      function existsNg1Service(service: string, module: angular.IModule) {
        let queue: any[] = (<any>module)._invokeQueue;
        let exists = false; 
        queue.forEach((action: any[]) => {
          if (action.length >= 3) {
            /**
             * action[0] i.e. $controllerProvider | $provide
             * action[1] i.e. register | factory | directive
             * action[2][0] name
             * action[2][1] function
             */
            if ((action[1] === 'factory' ||
              action[1] === 'service' ||
              action[1] === 'provider')
              && action[2][0] === service) {
              exists = true;
            }
          }
        });
        
        if (!exists && module.requires) {
          //not found in current module -> search in required modules
          for (let i = 0; i < module.requires.length; i++) {
            exists = existsNg1Service(service, 
              angular.module(module.requires[i]));
            if (exists) {break; }
          }
        }
        
        return exists;
      }
      
      window.getOptNg1Service = (service: string) => {
        //check if service exists
        if (!existsNg1Service(service, module)) {
          //create empty service
          module.service(service, () => {return {}; });
        }
        
        return service;
      };
    `;
  }
  
  getOptNg1Directive() {
    return `
      function existsNg1Directive(directive: string, module: angular.IModule) {
        let queue: any[] = (<any>module)._invokeQueue;
        let exists = false; 
        queue.forEach((action: any[]) => {
          if (action.length >= 3) {
            /**
             * action[0] i.e. $controllerProvider | $provide
             * action[1] i.e. register | factory | directive
             * action[2][0] name
             * action[2][1] function
             */
            if (action[1] === 'directive' && action[2][0] === directive) {
              exists = true;
            }
          }
        });
        
        if (!exists && module.requires) {
          //not found in current module -> search in required modules
          for (let i = 0; i < module.requires.length; i++) {
            exists = existsNg1Directive(directive, 
              angular.module(module.requires[i]));
            if (exists) {break; }
          }
        }
        
        return exists;
      }
      
      window.getOptNg1Directive = (directive: string) => {
        //check if directive exists
        if (!existsNg1Directive(directive, module)) {
          //create empty directive
          module.directive(directive, () => {return {link: () => {}}; });
        }
        
        return directive;
      };
    `;
  }
  
  
  
}
FrontendBundler.$inject = {
  deps: ['dependencies', 'autostart', 'addManualStartListener', 'status'],
  callAs: 'class'
};
