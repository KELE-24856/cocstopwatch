const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const hostname = '0.0.0.0';
const port = 3000;

// MIME类型映射
const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  console.log(`Request: ${req.url}`);
  
  let filePath = '.' + req.url;
  
  // 默认页面
  if (filePath === './') {
    filePath = './index.html';
  }
  
  const extname = String(path.extname(filePath)).toLowerCase();
  const contentType = mimeTypes[extname] || 'application/octet-stream';
  
  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        // 文件未找到
        fs.readFile('./404.html', (err, content404) => {
          res.writeHead(404, { 'Content-Type': 'text/html' });
          res.end(content404 || '404 Not Found', 'utf-8');
        });
      } else {
        // 其他服务器错误
        res.writeHead(500);
        res.end(`Server Error: ${error.code}`);
      }
    } else {
      // 成功读取文件
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(port, hostname, () => {
  const networkInterfaces = os.networkInterfaces();
  const addresses = [];
  
  // 获取所有网络接口地址
  Object.keys(networkInterfaces).forEach(interfaceName => {
    networkInterfaces[interfaceName].forEach(interface => {
      if (interface.family === 'IPv4' && !interface.internal) {
        addresses.push(interface.address);
      }
    });
  });
  
  console.log(`\n部落冲突建筑工人计时器服务器运行中...`);
  console.log(`本地访问: http://localhost:${port}`);
  
  if (addresses.length > 0) {
    console.log('\n网络访问地址 (请选择您的实际IP地址):');
    addresses.forEach(addr => {
      console.log(`  http://${addr}:${port}`);
    });
  } else {
    console.log(`\n网络访问: http://192.168.1.236:${port}`);
    console.log('(如果上述地址无法访问，请检查您的网络设置)');
  }
  
  console.log(`\n如果以上地址都无法访问，请尝试以下方法:`);
  console.log(`1. 确保您的手机与电脑在同一Wi-Fi网络中`);
  console.log(`2. 检查防火墙设置，确保端口 ${port} 未被阻止`);
  console.log(`3. 尝试访问: http://192.168.1.236:${port}\n`);
});