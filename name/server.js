const http = require('http');
const https = require('https');
const url = require('url');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // 处理跨域请求
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // 处理静态文件
  if (req.method === 'GET') {
    let filePath = '.' + pathname;
    if (filePath === './') {
      filePath = './index.html';
    }

    const extname = String(path.extname(filePath)).toLowerCase();
    const mimeTypes = {
      '.html': 'text/html',
      '.js': 'text/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.wav': 'audio/wav',
      '.mp4': 'video/mp4',
      '.woff': 'application/font-woff',
      '.ttf': 'application/font-ttf',
      '.eot': 'application/vnd.ms-fontobject',
      '.otf': 'application/font-otf',
      '.wasm': 'application/wasm'
    };

    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
      if (error) {
        if (error.code == 'ENOENT') {
          res.writeHead(404);
          res.end('File not found');
        } else {
          res.writeHead(500);
          res.end('Sorry, check with the site admin for error: ' + error.code);
        }
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content, 'utf-8');
      }
    });
    return;
  }

  if (pathname === '/api/generate-name' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const { englishName } = data;

        // 调用DeepSeek R1 API
        const apiKey = '19956327-738b-4660-b361-090ece5d6539';
        const apiUrl = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';

        const requestData = JSON.stringify({
          model: 'deepseek-r1-250528',
          messages: [
            {
              role: 'system',
              content: '你是一个专业的中文名字生成器，擅长为外国人起有趣、有文化底蕴且带有幽默元素的中文名字。请根据英文名字的含义，生成三个中文名字，并为每个名字提供中英文的寓意解释，包含中国文化元素和适当的梗。'
            },
            {
              role: 'user',
              content: `请为英文名字"${englishName}"生成三个中文名字，每个名字都要体现中国文化，并给出中英文分别的寓意解释，包含幽默成分和适当的梗。`
            }
          ]
        });

        const options = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'Content-Length': Buffer.byteLength(requestData)
          },
          timeout: 60000 // 60秒超时
        };

        const apiRequest = https.request(apiUrl, options, (apiRes) => {
          let apiBody = '';
          apiRes.on('data', chunk => {
            apiBody += chunk;
          });
          apiRes.on('end', () => {
            try {
              const apiResult = JSON.parse(apiBody);
              if (apiResult.choices && apiResult.choices.length > 0) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                  success: true,
                  data: apiResult.choices[0].message.content
                }));
              } else {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                  success: false,
                  error: 'API response format error'
                }));
              }
            } catch (error) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                success: false,
                error: 'Failed to parse API response'
              }));
            }
          });
        });

        apiRequest.on('error', (error) => {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: error.message
          }));
        });

        apiRequest.on('timeout', () => {
          apiRequest.destroy();
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: 'API request timeout'
          }));
        });

        apiRequest.write(requestData);
        apiRequest.end();

      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'Invalid request data'
        }));
      }
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: false,
      error: 'Not found'
    }));
  }
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});