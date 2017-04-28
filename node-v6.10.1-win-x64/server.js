const zlib = require('zlib');
const http = require('http'),
    fs = require('fs'),
    mime = require('mime'),
    path = require('path'),
    url = require('url');

const base = './public_html';
const samplesPath = './bd/samples';
let oldListener;

http.createServer(function(req, res) {
    let parsedURL = url.parse(req.url, true);
    if (parsedURL.pathname == "/subscribe") {
        res.writeHead(200, {
            'Connection': 'keep-alive',
            'Content-Type': 'text/event-stream; charset=utf-8',
            'Cache-Control': 'no-cache'
        });
        function listener() {
            let input = process.stdin.read();
            if (input !== null) {
                res.write('data: ' + input + '\n\n');
                console.log(input);
            }
        }
        if (process.stdin.listenerCount('readable') !== 0) {
            process.stdin.removeListener('readable', oldListener);
        }
        process.stdin.setEncoding('utf-8');
        process.stdin.on('readable', listener);
        oldListener = listener;
    } else if (parsedURL.pathname == "/getsample") {
        let pathname = path.normalize(samplesPath + '/' + //  Метод normalize() возвращает форму нормализации Юникода данной строки (если значение не является строкой, сначала оно будет в неё преобразовано).
                                      parsedURL.query.id +
                                      '.json');
        sendFile(pathname, req, res);
    } else if (parsedURL.pathname == "/setsample") {
        // console.log(req.headers);
        let body = '';
        req.setEncoding('utf-8');
        req.on('data', (chunk) => {
            body += chunk;
        });
        req.on('end', () => {
            // console.log(body);
            body = body.toUpperCase(); // все символы строки переводит в верхний регистр
            res.writeHead(200, { 'content-type': 'text/plain;charset=utf-8',
             });
            res.end(body);
        })
    } else {
        let pathname = path.normalize(base + parsedURL.pathname);
        sendFile(pathname, req, res);
    };
}).listen(3000);
console.log('Server running at 3000');

function sendFile(pathname, req, res) {
    fs.stat(pathname, function(err, stats) {
        if (err) {
            res.writeHead(404);
            console.log('Resource missing 404\n');
            res.write('Resource missing 404\n');
            res.end();
        } else if (stats.isFile()) {
            // Создание и перенаправление потока для чтения
            createStream(pathname, res);
        } else if (req.headers['x-requested-with'] === undefined) {
            pathname = path.normalize(pathname + '/index.html');
            createStream(pathname, res);
        }
    })
}

function createStream(pathname, res) {
    let file = fs.createReadStream(pathname);
    file.on("open", function() {
        const gzip = zlib.createGzip();
        // Код 200 - файл найден, ошибок нет
        let type = mime.lookup(pathname);
        console.log("PATHNAME: " + pathname);
        res.setHeader('Content-Type', `${type}; charset=utf-8`);
        res.setHeader('Content-Encoding', 'gzip');
        res.statusCode = 200;
        file.pipe(gzip).pipe(res);
    });
    file.on("error", function(err) {
        console.log(err);
        res.statusCode = 403;
        res.write('file permission');
        res.end();
    });
}
