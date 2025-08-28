import Message from '../models/Message.js';

/**
 * Real-time chat with persistence.
 * Events:
 *  - "chat:join"    { room }                    -> join a room
 *  - "chat:message" { room, sender, text, ... } -> save to DB, then broadcast
 */
export function registerChat(io) {
  io.on('connection', (socket) => {
    // join default room
    socket.join('global');

    socket.on('chat:join', ({ room }) => {
      if (typeof room === 'string' && room.trim()) {
        // leave all joined rooms except the private socket room
        for (const r of socket.rooms) if (r !== socket.id) socket.leave(r);
        socket.join(room);
        socket.emit('chat:joined', { room });
      }
    });

    socket.on('chat:message', async (payload, ack) => {
      try {
        const room = typeof payload?.room === 'string' && payload.room.trim() ? payload.room : 'global';
        const sender = (payload?.sender || '').toString().slice(0, 128);
        const text = (payload?.text || '').toString();

        if (!sender || !text) {
          const err = { ok: false, error: 'sender and text are required' };
          if (ack) return ack(err);
          return;
        }

        // Persist
        const msg = await Message.create({
          room,
          sender,
          senderId: payload?.senderId || null,
          text,
          meta: payload?.meta || {}
        });

        const out = {
          _id: msg._id.toString(),
          room: msg.room,
          sender: msg.sender,
          senderId: msg.senderId,
          text: msg.text,
          meta: msg.meta,
          at: msg.createdAt
        };

        // Broadcast to room
        io.to(room).emit('chat:message', out);

        if (ack) ack({ ok: true, message: out });
      } catch (e) {
        if (ack) ack({ ok: false, error: e.message });
      }
    });
  });
}
