import Message from '../models/Message.js';

/**
 * GET /chat/:room/messages?before=<ISO|ms>&limit=50
 * Returns latest messages (newest first). Paginate with `before`.
 */
export async function getRoomMessages(req, res) {
  const room = req.params.room || 'global';
  const limit = Math.min(Math.max(parseInt(req.query.limit || '50', 10), 1), 200);
  const before = req.query.before ? new Date(req.query.before) : new Date();

  const items = await Message
    .find({ room, createdAt: { $lt: before } })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  res.json({ room, count: items.length, messages: items });
}
