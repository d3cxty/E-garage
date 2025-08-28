import Account from '../models/Account.js';

export async function ensureAccount() {
  const c = await Account.countDocuments();
  if (c === 0) await Account.create({});
}

export async function getAccount(_req, res) {
  const doc = await Account.findOne();
  res.json(doc);
}

export async function updateAccount(req, res) {
  const { name, email, phone, address } = req.body;
  const patch = { name, email, phone, address };

  if (req.file) {
    const isCloud = process.env.STORAGE_DRIVER === 'cloudinary';
    // Cloudinary: req.file.path is absolute URL
    patch.logoPath = isCloud ? req.file.path : `/${req.file.path.replace(/\\+/g, '/')}`;
  }

  const doc = await Account.findOneAndUpdate({}, patch, { new: true });
  res.json(doc);
}
