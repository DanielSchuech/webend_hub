import * as path from 'path';
import * as fs from 'fs';

export function getWebpackConfigPath() {
  let p = path.resolve(process.cwd() + '/webpack.config.js');
  if (fs.existsSync(p)) {
    return p;
  } else {
    return path.normalize(__dirname + '/../../webpack.config.js');
  }
}
