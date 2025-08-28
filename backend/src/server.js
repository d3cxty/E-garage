import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import app from './app.js';
import env from './config/env.js';
import { connectDB } from './config/db.js';
import { registerChat } from './services/chat.js';

async function bootstrap() {
  await connectDB();

  const server = http.createServer(app);
  const io = new SocketIOServer(server, { cors: { origin: '*' } });

  registerChat(io);

  server.listen(env.PORT, () => {
    console.log(`API listening on http://localhost:${env.PORT}`);
  });
}

bootstrap();
