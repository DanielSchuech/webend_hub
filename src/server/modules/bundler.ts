import TinyDiInjectable from '../tinydiinjectable';
import {Adapter} from '../../adapter/base';
import {getWebpackConfigPath} from '../helper';

import * as fs from 'fs';
import * as path from 'path';
import {exec} from 'child_process';

export default class FrontendBundler extends TinyDiInjectable {
  private adapters: {[framework: string]: Adapter};

  constructor(private deps: any, private autostart: any,
      addManualStartListener: Function, status: any, private config: any) {
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

    //load all required adapters
    this.createAdapters(startedPlugins);
    
    //create bundle entry content
    let file = this.createFileContent(startedPlugins);

    //auto mod aktivated -> create index.html with elements for plug-ins
    if (this.config.useCustomIndexHtml === 'false') {
      this.createAutoIndexHTML(startedPlugins);
    }
    
    let bundleFolder = path.normalize(__dirname + '/../../app/');
    let depFile = bundleFolder + 'app.component.ts';
    
    //write file
    fs.writeFile(depFile, file, (err) => {
      //bundle
      let configPath = getWebpackConfigPath();
      exec(`webpack --config ${configPath} ${depFile} ${bundleFolder}bundle.js`, 
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
    let file = `
      (<any>window).webend = {};
      declare var webend: any;
    `;

    //Adapter Phase 1: Initialisation
    Object.keys(this.adapters).forEach((adapterName) => {
      if (this.adapters[adapterName].initialise) {
        file += this.adapters[adapterName].initialise();
      }
    });
    
    //Adapter Phase 2: Load all Plug-in Components
    let loadedPlugins: string[] = [];
    startedPlugins.forEach((plugin) => {
      file += this.addPlugin(startedPlugins, plugin, loadedPlugins);
    });

    //Adapter Pase 3: Finalise
    Object.keys(this.adapters).forEach((adapterName) => {
      if (this.adapters[adapterName].initialise) {
        file += this.adapters[adapterName].finalise();
      }
    });
    
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
    let framework = this.deps[plugin].browser.framework;
    let pluginFile = this.deps[plugin].browser.entry;
    file += this.adapters[framework].load(plugin, pluginFile);
    
    loadedPlugins.push(plugin);
    return file;
  }

  createAdapters(plugins: string[]) {
    this.adapters = {};

    //determine frameworks
    let frameworks: string[] = [];
    plugins.forEach((plugin) => {
      if (this.deps[plugin] && this.deps[plugin].browser && 
        this.deps[plugin].browser.framework) {
          let framework = this.deps[plugin].browser.framework;
          if (frameworks.indexOf(framework) === -1) {
            frameworks.push(framework);
          }
        }
    });

    //create adapters
    frameworks.forEach((framework) => {
      try {
        let adapter = require(`../../adapter/${framework}`).default;
        this.adapters[framework] = new adapter(this.deps, frameworks, this.config);
      } catch (e) {
        console.log(e);
        throw new Error(`Cannot find adapter for framework: ${framework}`);
      }
    });
  }

  createAutoIndexHTML(startedPlugins: string[]) {
    let indexHTML = `
        <html>
          <head>
            <base href="/">
          
            <title>WebEnd Plugin System</title>
          </head>
          <body>
      `;
      Object.keys(this.adapters).forEach((adapter) => {
        if (this.adapters[adapter].autoIndexHTMLBodyContent) {
          indexHTML += this.adapters[adapter].autoIndexHTMLBodyContent();
        }
      });
      indexHTML += `
            <script src="bundle.js"></script>
          </body>
        </html>
      `;
      let indexPath = path.normalize(__dirname + '/../../app/index.html');
      if (!fs.existsSync(path.dirname(indexPath))){
        fs.mkdirSync(path.dirname(indexPath));
      }
      fs.writeFileSync(indexPath, indexHTML);
  }
  
}
FrontendBundler.$inject = {
  deps: ['dependencies', 'autostart', 'addManualStartListener', 'status', 'config'],
  callAs: 'class'
};
