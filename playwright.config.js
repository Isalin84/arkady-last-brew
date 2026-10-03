const {defineConfig}=require('@playwright/test');
// PORT lets parallel worktrees run browser tests without reusing each other's server.
const port=Number(process.env.PORT)||4173;

module.exports=defineConfig({
 testDir:'./tests/browser',
 timeout:30000,
 workers:1,
 use:{trace:'retain-on-failure',screenshot:'only-on-failure',baseURL:`http://127.0.0.1:${port}`,headless:true,viewport:{width:1280,height:900}},
 // http.server's listen backlog is 5: with a streaming <audio> connection open, the burst of clip fetches overflows it and macOS resets sockets.
 webServer:{command:`python3 -c "import http.server as s;s.ThreadingHTTPServer.request_queue_size=64;s.test(HandlerClass=s.SimpleHTTPRequestHandler,ServerClass=s.ThreadingHTTPServer,port=${port},bind='127.0.0.1')"`,url:`http://127.0.0.1:${port}`,reuseExistingServer:true,timeout:15000}
});
