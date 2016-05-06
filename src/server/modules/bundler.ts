import TinyDiInjectable from '../tinydiinjectable';

import * as fs from 'fs';
import * as path from 'path';
import {exec} from 'child_process';

export default class FrontendBundler extends TinyDiInjectable {
  constructor(private deps: any) {
    super();
    this.determineDependencies();
  }
  
  /**
   * determine all dependencies which need to be bundled for the frontend
   */
  determineDependencies(): void {
    if (!this.deps) {
      return;
    }
    let requires: any = {};
    let keys = Object.keys(this.deps);
    keys.forEach((key) => {
      let dependencies = this.deps[key].frontendDependencies;
      if (!dependencies) {
        return;
      }
      
      Object.keys(dependencies).forEach((pack) => {
        requires[pack] = dependencies[pack];
      });
    });
    
    this.createBundle(requires);
    
  }
  
  createBundle(requires: any) {
    //create file to be bundled
    let file = `declare var window: any;\n`;
    file += `declare var require: any;\n`;
    file += `import 'zone.js/dist/zone';\n`;
    file += `import 'reflect-metadata';\n`;
    file += `if (!window.webend) {window.webend = {};}\n`;
    if (requires) {
      Object.keys(requires).forEach((dep) => {
        file += `window.webend['${dep}'] = require('${dep}');\n`;
      });
    }
    
    let bundleFolder = path.normalize(__dirname + '/../../app/');
    let depFile = bundleFolder + 'vendor.ts';
    
    //write file
    fs.writeFile(depFile, file, (err) => {
      //bundle
      let webPackConfig = path.normalize(__dirname + '/../../../webpack.vendor.config.js');
      exec(`webpack --config ${webPackConfig} ${depFile} ${bundleFolder}/vendor.js`, 
        (error, stdout, stderr) => {
          if (error) {
            console.log(`Error on creating vendor bundle: ${error}`);
          }
        });
    });
  }
}
FrontendBundler.$inject = {
  deps: ['dependencies'],
  callAs: 'class'
};
