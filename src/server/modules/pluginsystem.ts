import TinyDiInjectable from '../tinydiinjectable';
import * as express from 'express';

export default class PluginSystem extends TinyDiInjectable {
  constructor(status: any, server: express.Application) {
    super();
    
    server.get('/status', (req, res) => {
      res.send(status);
    });
  }
}
PluginSystem.$inject = {
  deps: ['status', 'hub_server'],
  callAs: 'class'
};
