import { createServer } from 'node:http';

const PORT = 3000;

const server = createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(
    JSON.stringify({
      data: 'Hello World!',
    }),
  );
});

server.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
