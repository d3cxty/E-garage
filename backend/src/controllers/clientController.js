// controllers/clientController.js
import { body } from 'express-validator';
import Client from '../models/Client.js';
import { validate } from '../utils/validate.js';
import { clientSummaryPDF } from '../utils/pdf.js';

const isStaff = (u) => ['admin', 'staff', 'manager'].includes((u?.role || '').toLowerCase());
const isClientOnly = (u) => (u?.role || '').toLowerCase() === 'client';

const ownerFilter = (u) => ({
  $or: [{ ownerId: u?._id }, { ownerEmail: (u?.email || '').toLowerCase() }],
});

const textFilter = (q) =>
  q
    ? {
        $or: [
          { names: new RegExp(q, 'i') },
          { plateNumber: new RegExp(q, 'i') },
          { carMake: new RegExp(q, 'i') },
          { carType: new RegExp(q, 'i') },
        ],
      }
    : {};

export const validateCreateClient = [
  body('names').trim().notEmpty(),
  body('carType').trim().notEmpty(),
  body('carMake').trim().notEmpty(),
  body('plateNumber').trim().notEmpty(),
  validate,
];

function requireAuth(req, res) {
  if (!req.user) { res.status(401).json({ message: 'Unauthenticated' }); return false; }
  return true;
}

export async function createClient(req, res) {
  if (!requireAuth(req, res)) return;

  const isCloud = process.env.STORAGE_DRIVER === 'cloudinary';
  const photos = (req.files?.photos || []).map((f) =>
    isCloud ? f.path : `/${f.path.replace(/\\+/g, '/')}`
  );
  const proformaFile = req.files?.proforma?.[0];
  const proformaPath = proformaFile
    ? (isCloud ? proformaFile.path : `/${proformaFile.path.replace(/\\+/g, '/')}`)
    : null;

  const client = await Client.create({
    ...req.body,
    photos,
    proformaPath,
    ownerId: req.user?._id,
    ownerEmail: (req.user?.email || '').toLowerCase(),
  });

  res.status(201).json(client);
}

// Admin/staff: all; non-staff: only theirs
export async function listClients(req, res) {
  if (!requireAuth(req, res)) return;
  const { q, status, payment } = req.query;

  const filter = { ...textFilter((q || '').trim()) };
  if (!isStaff(req.user)) Object.assign(filter, ownerFilter(req.user));
  else if (String(req.query.mine).toLowerCase() === 'true') Object.assign(filter, ownerFilter(req.user));

  if (status) filter.status = status;
  if (payment) filter.payment = payment;

  const docs = await Client.find(filter).sort({ createdAt: -1 }).lean();
  res.json(docs); // keep array shape
}

// Strictly current user’s clients, always
export async function listMyClients(req, res) {
  if (!requireAuth(req, res)) return;
  const { q, status, payment } = req.query;

  const filter = { ...ownerFilter(req.user), ...textFilter((q || '').trim()) };
  if (status) filter.status = status;
  if (payment) filter.payment = payment;

  const docs = await Client.find(filter).sort({ createdAt: -1 }).lean();
  res.json(docs);
}

export async function getClient(req, res) {
  if (!requireAuth(req, res)) return;
  const doc = await Client.findById(req.params.id);
  if (!doc) return res.status(404).json({ message: 'Not found' });

  if (!isStaff(req.user)) {
    const owns =
      String(doc.ownerId || '') === String(req.user._id || '') ||
      String((doc.ownerEmail || '')).toLowerCase() === String((req.user.email || '')).toLowerCase();
    if (!owns) return res.status(403).json({ message: 'Forbidden' });
  }
  res.json(doc);
}

export async function updateClient(req, res) {
  if (!requireAuth(req, res)) return;
  const current = await Client.findById(req.params.id);
  if (!current) return res.status(404).json({ message: 'Not found' });

  if (!isStaff(req.user)) {
    const owns =
      String(current.ownerId || '') === String(req.user._id || '') ||
      String((current.ownerEmail || '')).toLowerCase() === String((req.user.email || '')).toLowerCase();
    if (!owns) return res.status(403).json({ message: 'Forbidden' });
  }

  const doc = await Client.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(doc);
}

export async function patchClient(req, res) {
  if (!requireAuth(req, res)) return;
  const current = await Client.findById(req.params.id);
  if (!current) return res.status(404).json({ message: 'Not found' });

  if (!isStaff(req.user)) {
    const owns =
      String(current.ownerId || '') === String(req.user._id || '') ||
      String((current.ownerEmail || '')).toLowerCase() === String((req.user.email || '')).toLowerCase();
    if (!owns) return res.status(403).json({ message: 'Forbidden' });
  }

  const { status, payment } = req.body;
  const patch = {};
  if (status) patch.status = status;
  if (payment) patch.payment = payment;

  const doc = await Client.findByIdAndUpdate(req.params.id, patch, { new: true });
  res.json(doc);
}

export async function deleteClient(req, res) {
  if (!requireAuth(req, res)) return;
  const current = await Client.findById(req.params.id);
  if (!current) return res.status(404).json({ message: 'Not found' });

  if (!isStaff(req.user)) {
    const owns =
      String(current.ownerId || '') === String(req.user._id || '') ||
      String((current.ownerEmail || '')).toLowerCase() === String((req.user.email || '')).toLowerCase();
    if (!owns) return res.status(403).json({ message: 'Forbidden' });
  }

  await Client.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
}

export async function exportClientPDF(req, res) {
  if (!requireAuth(req, res)) return;

  // HARD BLOCK: client role cannot export
  if (isClientOnly(req.user)) {
    return res.status(403).json({ message: 'Export is restricted for client role' });
  }

  const c = await Client.findById(req.params.id);
  if (!c) return res.status(404).json({ message: 'Not found' });

  if (!isStaff(req.user)) {
    const owns =
      String(c.ownerId || '') === String(req.user._id || '') ||
      String((c.ownerEmail || '')).toLowerCase() === String((req.user.email || '')).toLowerCase();
    if (!owns) return res.status(403).json({ message: 'Forbidden' });
  }

  clientSummaryPDF(res, c);
}
