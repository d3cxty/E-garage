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

/**
 * POST /chat/:room/upload  (multipart/form-data with field "file")
 * Saves an image message and broadcasts via socket.io
 * Requires your multer upload and static / cloud config.
 */
export async function uploadChatImage(req, res) {
  try {
    const room = req.params.room || 'global';
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    if (!req.file.mimetype?.startsWith?.('image/')) {
      return res.status(400).json({ message: 'Only image files allowed' });
    }

    // Build a public URL for the saved image
    let url = '';
    if (process.env.STORAGE_DRIVER === 'cloudinary') {
      // multer-storage-cloudinary puts the URL in file.path
      url = req.file.path;
    } else {
      // local: ensure you serve app.use('/uploads', express.static(...))
      url = `/${(req.file.path || '').replace(/\\/g, '/')}`;
    }

    const sender =
      (req.user && req.user.email) ||
      req.headers['x-user']?.toString() ||
      'anon';

    const msg = await Message.create({
      room,
      sender,
      type: 'image',
      images: [url],
    });

    // broadcast
    const io = req.app.get('io'); // make sure server.js does: app.set('io', io)
    if (io) {
      io.to(room).emit('chat:message', {
        _id: msg._id.toString(),
        room: msg.room,
        sender: msg.sender,
        type: 'image',
        images: msg.images,
        at: msg.createdAt,
      });
    }

    res.json({ ok: true, url, messageId: msg._id });
  } catch (e) {
    console.error('uploadChatImage error:', e);
    res.status(500).json({ message: 'Upload failed' });
  }
}
