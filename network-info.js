const os = require('os');

console.log('网络接口信息:');
console.log('================');

const networkInterfaces = os.networkInterfaces();

Object.keys(networkInterfaces).forEach(interfaceName => {
  console.log(`\n接口: ${interfaceName}`);
  networkInterfaces[interfaceName].forEach(interface => {
    console.log(`  地址: ${interface.address}`);
    console.log(`  掩码: ${interface.netmask}`);
    console.log(`  类型: ${interface.family}`);
    console.log(`  内部接口: ${interface.internal ? '是' : '否'}`);
  });
});

console.log('\n推荐的访问地址:');
console.log('================');

let foundTargetIP = false;

Object.keys(networkInterfaces).forEach(interfaceName => {
  networkInterfaces[interfaceName].forEach(interface => {
    if (interface.family === 'IPv4' && !interface.internal) {
      console.log(`http://${interface.address}:8080`);
      if (interface.address === '192.168.1.236') {
        foundTargetIP = true;
      }
    }
  });
});

if (!foundTargetIP) {
  console.log('\n注意: 未找到IP地址 192.168.1.236');
  console.log('但您可以尝试使用以下地址访问:');
  console.log('http://192.168.1.236:8080');
  console.log('\n如果仍然无法访问，请检查:');
  console.log('1. 确保手机和电脑连接在同一个Wi-Fi网络');
  console.log('2. 检查Windows防火墙设置');
  console.log('3. 确保端口8080未被其他程序占用');
}