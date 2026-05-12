const http = require('http');//创建 HTTP 服务器
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

const socketPath = '/var/apps/test/target/gateway.sock';

// 启动前清理旧的 Socket 文件
if (fs.existsSync(socketPath)) {
    fs.unlinkSync(socketPath);
}



const server = http.createServer((req, res) => {
    // 解析 URL
    const parsedUrl = new URL(request.url, 'http://localhost');
    let pathname;
    try {
        pathname = decodeURIComponent(parsedUrl.pathname);
    } catch (e) {
        response.writeHead(400, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ error: 'URL解码失败' }));
        return;
    }

    console.log(`[issampro] 收到请求: ${pathname}`);


    // // 如果访问的是根路径，返回 HTML 文件
    // if (req.url === '/app/test' || req.url === '/app/test/') {
    //     fs.readFile(path.join(__dirname, '../www/index.html'), (err, data) => {
    //         res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    //         res.end(data);
    //     });
    // } 
    // // 如果访问的是 JS 文件
    // else if (req.url === '/app/test/js/client.js') {
    //     fs.readFile(path.join(__dirname, '../www/js/client.js'), (err, data) => {
    //         res.writeHead(200, { 'Content-Type': 'application/javascript' });
    //         res.end(data);
    //     });
    // }
});





// const server = http.createServer((req, res) => {
//     // 3. 获取网关透传的用户信息
//     const user = {
//         uid: req.headers["x-trim-uid"],
//         isAdmin: req.headers["x-trim-isadmin"] === "true",
//         username: req.headers["x-trim-username"]
//     };

//     res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
//     res.end(`你好 ${user.username}，你的 UID 是 ${user.uid}`);
// });

// 4. 处理 WebSocket (可选)
const wss = new WebSocket.Server({ noServer: true });
server.on('upgrade', (request, socket, head) => {
    // 可以在这里根据 request.url 判断是否是 /ws 路径
    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
    });
});

// 5. 监听 Socket 文件
server.listen(socketPath, () => {
    console.log(`服务已通过 Socket 启动: ${socketPath}`);
    // 必须修改权限，否则网关（Nginx等）可能没权限读写这个 sock
    fs.chmodSync(socketPath, '0666'); 
});




