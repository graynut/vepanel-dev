const fs = require('fs');
const url = require('url');
const path = require('path');
const http = require('http');

const port = process.argv[2] || 3333;
const map = {
    '.ico': 'image/x-icon',
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.css': 'text/css',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.wav': 'audio/wav',
    '.mp3': 'audio/mpeg',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword'
};
function HttpNotFound(res, file){
    res.statusCode = 404;
    res.end(`File ${file} not found!`);
}
function router(req, res) {
    let urls = url.parse(req.url),
        file = path.resolve(__dirname, './../') + urls.pathname,
        lstat;
    try {
        lstat = fs.lstatSync(file);
    } catch(e) {
        return HttpNotFound(res, file);
    }
    let isDirectory = lstat.isDirectory();
    if (isDirectory) {
        if (urls.pathname.substr(-1) !== '/') {
            res.statusCode = 301;
            res.setHeader('Location',  urls.pathname + '/');
            res.end();
            return;
        }
        file += 'index.html';
        if (!fs.existsSync(file)) {
            return HttpNotFound(res, file);
        }
        lstat = fs.lstatSync(file);
    }
    if (!lstat.isFile()) {
        return HttpNotFound(res, file);
    }
    const ext = isDirectory ? '.html' : path.parse(urls.pathname).ext;
    fs.readFile(file, function(err, data){
        if(err){
            res.statusCode = 500;
            res.end(`Error getting the file: ${err}.`);
        } else {
            res.setHeader('Content-type', map[ext] || 'application/octet-stream' );
            res.end(data);
        }
    });   
}

// start server
http.createServer(router).listen(parseInt(port));
console.log(`Server is running: http://localhost:${port}`);