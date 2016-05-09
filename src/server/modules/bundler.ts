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
    let file = `import {Component, Injectable} from '@angular/core';\n`;
    file += `declare var Reflect: any;\n`;
    file += `let components: any[] = [];\n`;
    file += `let services: any[] = [];\n`;
    file += `let meta: any;\n`;
    file += `declare var window: any;\n`;
    file += `window.components = components;\n`;
    file += `window.services = services;\n`;
    file += this.getComponentFn();
    file += this.getServiceFn();
    
    //import plugin components
    let loadedPlugins: string[] = [];
    startedPlugins.forEach((plugin) => {
      file += this.addPlugin(startedPlugins, plugin, loadedPlugins);
    });
    
    //create component
    file += `@Component({\n`;
    file += `  selector: 'webend-hub',\n`;
    file += `  template: '`;
    startedPlugins.forEach((plugin) => {
      file += `<${plugin}></${plugin}>`;
    });
    file += `',\n`;
    file += `  directives: [...components]\n`;
    file += `})\n`;
    file += `export class HubComponent {}`;
    
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
    file += `import * as ${plugin} from '${plugin}/${this.deps[plugin].browser}';\n`;
    file += `
      if (${plugin}) {
        Object.keys(${plugin}).forEach((exp) => {
          meta = Reflect.getOwnMetadata('annotations', (<any>${plugin})[exp]);
          if (meta && meta[0] && meta[0]) {
            if (meta[0].constructor.name === 'ComponentMetadata') {
              components.push((<any>${plugin})[exp]);
            }
            if (meta[0].constructor.name === 'InjectableMetadata') {
              services.push((<any>${plugin})[exp]);
            }
          }
        });
      }
    `;
    
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
}
FrontendBundler.$inject = {
  deps: ['dependencies', 'autostart', 'addManualStartListener', 'status'],
  callAs: 'class'
};
