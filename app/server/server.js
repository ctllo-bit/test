const http = require('http');//创建 HTTP 服务器
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

const socketPath = '/var/apps/test/target/gateway.sock';
const BASE_PATH = '/app/test';
const WEB_ROOT = path.join(__dirname, '../www'); // 统一静态资源根目录

// 启动前清理旧的 Socket 文件
if (fs.existsSync(socketPath)) {
    fs.unlinkSync(socketPath);
}

// 从网关获取用户信息
function getGatewayUser(req) {
    const user = {
        uid: req.headers["x-trim-uid"] || '',             // 用户唯一 ID
        username: req.headers["x-trim-username"] || '',   // 用户名
        isAdmin: req.headers["x-trim-isadmin"] === "true" // 是否是管理员
    };
    return user;
}

// 路径安全检查
function isPathSafe(filePath, baseDir) {
    const relative = path.relative(baseDir, filePath);
    // 确保解析后的路径仍在 baseDir 目录下，防止 ../../ 攻击
    return relative && !relative.startsWith('..') && !path.isAbsolute(relative);
}


const server = http.createServer((req, res) => {
    // 解析 URL
    const parsedUrl = new URL(req.url, 'http://localhost');
    let pathname;
    try {
        pathname = decodeURIComponent(parsedUrl.pathname);
    } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'URL解码失败' }));
        return;
    }

    // 路径规范化
    if (pathname === BASE_PATH) {
        console.log(`[issampro] 重定向: ${pathname} -> ${BASE_PATH}/`);
        res.writeHead(301, { 'Location': BASE_PATH + '/' });
        res.end();
        return;
    }
    

    console.log(`[issampro] 收到请求: ${pathname}`);

    // 2. 识别并处理静态资源请求
    if (pathname.startsWith(BASE_PATH)) {
        // 裁剪路径：/app/test/js/client.js -> /js/client.js
        let relativePath = pathname.substring(BASE_PATH.length);
        
        // 默认指向 index.html
        if (relativePath === '/' || relativePath === '') {
            relativePath = '/index.html';
        }

        // 调用通用处理函数
        serveStaticFile(res, relativePath);
    } else {
        res.writeHead(404);
        res.end('Not Found');
    }

    
});




/**
 * ============================================================
 * 模块六：静态文件服务
 * ============================================================
 * 说明：
 * - URL 解码（支持中文文件名）
 * - 根路径 / 返回 index.html
 * - 调用 isPathSafe 检查路径安全
 */
const MIME_TYPES = {
	".html": "text/html; charset=UTF-8",
	".htm":  "text/html; charset=UTF-8",
	".css":  "text/css; charset=UTF-8",
	".js":   "application/javascript; charset=UTF-8",
    '.json': 'application/json; charset=UTF-8',
	".png":  "image/png",
	".jpg":  "image/jpeg",
	".jpeg": "image/jpeg",
	".gif":  "image/gif",
    '.svg': 'image/svg+xml',
	".ico":  "image/x-icon",
	".txt":  "text/plain; charset=UTF-8",
}


function serveStaticFile(res, relativePath) {
    const filePath = path.join(WEB_ROOT, relativePath);

    // 检查安全性和存在性，防止 ../ 越权访问
    if (!isPathSafe(filePath, WEB_ROOT)) {
        console.error(`[issampro] 安全拦截: 尝试访问范围外路径 ${filePath}`);
        response.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
        response.end('禁止访问');
        return;
    }

    console.log(`[issampro] 尝试读取文件: ${filePath}`);

    // 读取并返回
    fs.readFile(filePath, (err, data) => {
        if (err) {
            console.error(`[Error] 无法读取文件: ${filePath}`);
            res.writeHead(404);
            return res.end('File Not Found');
        }

        // 自动识别 Content-Type
        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
    });
}

//处理 WebSocket (可选)
const wss = new WebSocket.Server({ noServer: true });
server.on('upgrade', (request, socket, head) => {
    const upPath = new URL(request.url, 'http://localhost').pathname;

    // 只有路径是以 /ws 结尾的才处理
    if (upPath.endsWith('/ws')) {
        wss.handleUpgrade(request, socket, head, (ws) => {
            // 这里可以顺便把用户信息绑定了
            ws.uid = request.headers['x-trim-uid'] || 'unknown';
            wss.emit('connection', ws, request);
        });
    } else {
        console.log("[WebSocket] 路径不匹配，销毁连接");
        socket.destroy();
    }
});




// 5. 监听 Socket 文件
server.listen(socketPath, () => {
    console.log(`服务已通过 Socket 启动: ${socketPath}`);
    // 必须修改权限，否则网关（Nginx等）可能没权限读写这个 sock
    fs.chmodSync(socketPath, '0666'); 
});
