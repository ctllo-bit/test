const output = document.getElementById('output');
console.log("AAAAAAAAAA111wwwaaaaaaaaaaaaaaaaaaaaaaaaaaaAAAAAAAAAAA");

// 按照 fnOS 网关规范拼接地址
const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
const wsUrl = `${wsProtocol}//${window.location.host}/app/test-app/ws`;

const socket = new WebSocket(wsUrl);

socket.onopen = () => {
    output.innerText = "连接成功！";
    socket.send(JSON.stringify({ type: "ping" }));
};

socket.onmessage = (event) => {
    output.innerHTML += `<p>收到消息: ${event.data}</p>`;
};

socket.onerror = (error) => {
    output.innerText = "连接发生错误";
    console.error(error);
};