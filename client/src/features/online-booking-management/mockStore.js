/**
 * UC6.2 - Shared mock store (localStorage-backed).
 *
 * Phuc vu 2 muc dich:
 * - UC6.1 (landing page) submit -> ghi vao day -> xuat hien o queue receptionist.
 * - UC6.2 (receptionist) doc + cap nhat -> persist qua reload trinh duyet.
 *
 * Khi backend Laravel san sang, axios services co the bo flag `USE_MOCK_FALLBACK`
 * va dung API that. Module nay co the deprecate hoac giu lam fixture cho test.
 */

import {
  ONLINE_BOOKING_REQUESTS,
  PATIENT_PROFILES,
  NEXT_REQUEST_SEQ,
  NEXT_APPOINTMENT_SEQ,
  NEXT_PATIENT_SEQ,
} from './mockData';
import {
  APPOINTMENT_STATUS,
  EMAIL_STATUS,
  REQUEST_STATUS,
} from './constants';
import {
  buildHistoryEntry,
  generateAppointmentCode,
  generatePatientCode,
  generateRequestCode,
  normalizePhone,
} from './utils';

const STORAGE_KEY = 'dental_pro_uc62_store_v1';

// Trang thai chi nho trong session khi localStorage khong san co (SSR, private mode).
let memoryStore = null;

const getInitialStore = () => ({
  requests: ONLINE_BOOKING_REQUESTS.map((r) => ({ ...r, history: [...r.history] })),
  patients: PATIENT_PROFILES.map((p) => ({ ...p })),
  appointments: [],
  counters: {
    requestSeq: NEXT_REQUEST_SEQ,
    appointmentSeq: NEXT_APPOINTMENT_SEQ,
    patientSeq: NEXT_PATIENT_SEQ,
  },
});

const isBrowser = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const loadStore = () => {
  if (memoryStore) return memoryStore;
  if (!isBrowser()) {
    memoryStore = getInitialStore();
    return memoryStore;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      memoryStore = getInitialStore();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryStore));
      return memoryStore;
    }
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.requests)) {
      memoryStore = getInitialStore();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryStore));
      return memoryStore;
    }
    memoryStore = parsed;
    return memoryStore;
  } catch {
    memoryStore = getInitialStore();
    return memoryStore;
  }
};

const persist = () => {
  if (!isBrowser() || !memoryStore) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryStore));
  } catch {
    // localStorage co the bi quota_exceeded - bo qua, store van song trong memory.
  }
};

const clone = (obj) => (obj == null ? obj : JSON.parse(JSON.stringify(obj)));

// ---- Reset (chu yeu cho dev tools, test) ----
export const resetMockStore = () => {
  memoryStore = getInitialStore();
  persist();
};

// ---- Requests ----

export const mockListRequests = (params = {}) => {
  const store = loadStore();
  const items = store.requests.slice();

  let result = items;
  if (params.status && params.status !== 'all') {
    result = result.filter((r) => r.status === params.status);
  }
  if (params.branch_id && params.branch_id !== 'all') {
    result = result.filter((r) => r.branch_id === params.branch_id);
  }
  if (params.service_id && params.service_id !== 'all') {
    result = result.filter((r) => Array.isArray(r.service_ids) && r.service_ids.includes(params.service_id));
  }
  if (params.date_from) {
    result = result.filter((r) => r.preferred_date && r.preferred_date >= params.date_from);
  }
  if (params.date_to) {
    result = result.filter((r) => r.preferred_date && r.preferred_date <= params.date_to);
  }
  if (params.q) {
    const q = String(params.q).trim().toLowerCase();
    const qPhone = normalizePhone(q);
    result = result.filter((r) => {
      const phone = normalizePhone(r.phone);
      return (
        (r.code || '').toLowerCase().includes(q)
        || (r.name || '').toLowerCase().includes(q)
        || (r.email || '').toLowerCase().includes(q)
        || phone.includes(qPhone)
      );
    });
  }

  // Sort: pending dau, sau submitted_at desc.
  const statusOrder = {
    [REQUEST_STATUS.PENDING]: 0,
    [REQUEST_STATUS.PROCESSING]: 1,
    [REQUEST_STATUS.PROPOSE_OTHER]: 2,
    [REQUEST_STATUS.APPOINTMENT_CREATED]: 3,
    [REQUEST_STATUS.REJECTED]: 4,
    [REQUEST_STATUS.CANCELED]: 5,
  };
  result = result.sort((a, b) => {
    const sa = statusOrder[a.status] ?? 99;
    const sb = statusOrder[b.status] ?? 99;
    if (sa !== sb) return sa - sb;
    return (b.submitted_at || '').localeCompare(a.submitted_at || '');
  });

  const total = result.length;
  const page = Math.max(1, parseInt(params.page || 1, 10) || 1);
  const perPage = Math.max(1, parseInt(params.per_page || 10, 10) || 10);
  const lastPage = Math.max(1, Math.ceil(total / perPage));
  const paged = result.slice((page - 1) * perPage, page * perPage);

  // Counters cho sidebar badge / quick stats.
  const counts = items.reduce(
    (acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    },
    {},
  );

  return clone({
    data: paged,
    total,
    current_page: page,
    last_page: lastPage,
    per_page: perPage,
    counts,
  });
};

export const mockGetRequest = (idOrCode) => {
  const store = loadStore();
  const req = store.requests.find((r) => r.id === idOrCode || r.code === idOrCode);
  return req ? clone(req) : null;
};

export const mockCreateRequest = (payload = {}) => {
  const store = loadStore();
  const seq = store.counters.requestSeq;
  store.counters.requestSeq = seq + 1;
  const now = new Date().toISOString();
  const code = generateRequestCode(seq);

  const request = {
    id: store.requests.length + 1000,
    code,
    status: REQUEST_STATUS.PENDING,
    name: payload.name || '',
    phone: normalizePhone(payload.phone || ''),
    email: payload.email || '',
    service_ids: Array.isArray(payload.service_ids) ? payload.service_ids : payload.service_ids ? [payload.service_ids] : [],
    branch_id: payload.branch_id || '',
    preferred_date: payload.preferred_date || '',
    preferred_time_slot_id: payload.preferred_time_slot_id || '',
    customer_note: payload.customer_note || payload.note || '',
    internal_note: '',
    patient_id: null,
    appointment_id: null,
    appointment_code: null,
    email_status: EMAIL_STATUS.NONE,
    processed_by: null,
    processed_at: null,
    source: payload.source || 'landing_page',
    submitted_at: now,
    device: payload.device || 'Unknown · Browser',
    ip: payload.ip || '0.0.0.0',
    proposed_slots: [],
    reject_reason: null,
    history: [
      buildHistoryEntry('request_created', { at: now, actor: 'He thong', note: 'Yeu cau duoc gui tu landing page' }),
      buildHistoryEntry('request_received', { at: now, actor: 'He thong' }),
    ],
  };

  store.requests.push(request);
  persist();
  return clone(request);
};

const mutateRequest = (id, mutator) => {
  const store = loadStore();
  const idx = store.requests.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  mutator(store.requests[idx]);
  persist();
  return clone(store.requests[idx]);
};

export const mockUpdateInternalNote = (id, note) => mutateRequest(id, (r) => {
  r.internal_note = note;
  r.history.push(buildHistoryEntry('internal_note_updated', { actor: 'le_tan' }));
});

export const mockStartProcessing = (id, actor = 'le_tan') => mutateRequest(id, (r) => {
  if (r.status !== REQUEST_STATUS.PENDING) return;
  r.status = REQUEST_STATUS.PROCESSING;
  r.processed_by = actor;
  r.processed_at = new Date().toISOString();
  r.history.push(buildHistoryEntry('processing_started', { actor }));
});

export const mockLinkPatient = (id, patientId, actor = 'le_tan') => mutateRequest(id, (r) => {
  r.patient_id = patientId;
  r.processed_by = actor;
  r.processed_at = new Date().toISOString();
  const store = loadStore();
  const patient = store.patients.find((p) => p.id === patientId);
  r.history.push(buildHistoryEntry('patient_linked', {
    actor,
    note: patient ? `Lien ket voi ${patient.code} - ${patient.name}` : `Lien ket benh nhan #${patientId}`,
  }));
});

export const mockCreatePatient = (id, patientData, actor = 'le_tan') => {
  const store = loadStore();
  const seq = store.counters.patientSeq;
  store.counters.patientSeq = seq + 1;
  const newPatient = {
    id: store.patients.length + 1000,
    code: generatePatientCode(seq),
    name: patientData.name || '',
    gender: patientData.gender || 'unknown',
    birthdate: patientData.birthdate || null,
    age: patientData.age || null,
    address: patientData.address || '',
    phone: normalizePhone(patientData.phone || ''),
    email: patientData.email || '',
    active: true,
    last_visit_at: null,
    matched_via: [],
  };
  store.patients.push(newPatient);
  persist();
  // Auto link.
  const updated = mutateRequest(id, (r) => {
    r.patient_id = newPatient.id;
    r.processed_by = actor;
    r.processed_at = new Date().toISOString();
    r.history.push(buildHistoryEntry('patient_created', {
      actor,
      note: `Tao moi ho so ${newPatient.code} - ${newPatient.name}`,
    }));
  });
  return { patient: clone(newPatient), request: updated };
};

export const mockConfirmAppointment = (id, payload, actor = 'le_tan') => {
  const store = loadStore();
  const idx = store.requests.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  const req = store.requests[idx];
  if (req.appointment_id) return clone(req); // VR8 - khong tao thua.
  if (!req.patient_id) return null; // VR2 - phai co patient.

  const seq = store.counters.appointmentSeq;
  store.counters.appointmentSeq = seq + 1;
  const code = generateAppointmentCode(seq);

  const appointment = {
    id: store.appointments.length + 1000,
    code,
    online_booking_request_id: req.id,
    online_booking_request_code: req.code,
    patient_id: req.patient_id,
    date: payload.date || req.preferred_date,
    time_slot_id: payload.time_slot_id || req.preferred_time_slot_id,
    service_ids: payload.service_ids || req.service_ids,
    branch_id: payload.branch_id || req.branch_id,
    status: APPOINTMENT_STATUS.WAITING_DOCTOR_ASSIGNMENT,
    created_by: actor,
    created_at: new Date().toISOString(),
  };
  store.appointments.push(appointment);

  req.status = REQUEST_STATUS.APPOINTMENT_CREATED;
  req.appointment_id = appointment.id;
  req.appointment_code = code;
  req.appointment_status = APPOINTMENT_STATUS.WAITING_DOCTOR_ASSIGNMENT;
  req.processed_by = actor;
  req.processed_at = new Date().toISOString();
  req.history.push(buildHistoryEntry('appointment_created', {
    actor,
    note: `Tao lich hen ${code} (cho phan cong bac si)`,
  }));

  persist();
  return clone(req);
};

export const mockProposeAlternative = (id, slots, reason, actor = 'le_tan') => mutateRequest(id, (r) => {
  r.status = REQUEST_STATUS.PROPOSE_OTHER;
  r.proposed_slots = Array.isArray(slots) ? slots : [];
  r.processed_by = actor;
  r.processed_at = new Date().toISOString();
  r.history.push(buildHistoryEntry('alternative_proposed', {
    actor,
    note: reason || 'De xuat khung gio thay the cho khach',
  }));
});

export const mockRejectRequest = (id, reason, actor = 'le_tan') => mutateRequest(id, (r) => {
  r.status = REQUEST_STATUS.REJECTED;
  r.reject_reason = reason;
  r.processed_by = actor;
  r.processed_at = new Date().toISOString();
  r.history.push(buildHistoryEntry('request_rejected', { actor, note: reason }));
});

export const mockReopenRequest = (id, reason, actor = 'admin') => mutateRequest(id, (r) => {
  if (r.status !== REQUEST_STATUS.REJECTED && r.status !== REQUEST_STATUS.CANCELED) return;
  r.status = REQUEST_STATUS.PROCESSING;
  r.processed_by = actor;
  r.processed_at = new Date().toISOString();
  r.history.push(buildHistoryEntry('request_reopened', { actor, note: reason || 'Mo lai yeu cau' }));
});

export const mockSendEmail = (id, kind, actor = 'He thong') => mutateRequest(id, (r) => {
  // Mock 5% failure rate de demo flow A5.
  const failed = Math.random() < 0.05;
  if (failed) {
    r.email_status = EMAIL_STATUS.FAILED;
    r.history.push(buildHistoryEntry('email_failed', { actor, note: `${kind} - SMTP loi 5.5.0` }));
  } else {
    r.email_status = EMAIL_STATUS.SENT;
    r.history.push(buildHistoryEntry('email_sent', { actor, note: `${kind} da gui den ${r.email}` }));
  }
});

export const mockResendEmail = (id, kind, actor = 'le_tan') => mutateRequest(id, (r) => {
  r.email_status = EMAIL_STATUS.SENT;
  r.history.push(buildHistoryEntry('email_sent', { actor, note: `Gui lai email phan hoi: ${kind}` }));
});

// ---- Patients ----

export const mockLookupPatients = ({ phone, email, name } = {}) => {
  const store = loadStore();
  const items = store.patients.slice();
  const phoneN = normalizePhone(phone);
  return clone(items.filter((p) => {
    const pn = normalizePhone(p.phone);
    if (phoneN && pn === phoneN) return true;
    if (email && p.email && String(p.email).toLowerCase() === String(email).toLowerCase()) return true;
    if (name && p.name && p.name.toLowerCase().includes(String(name).toLowerCase())) return true;
    return false;
  }));
};

export const mockGetPatient = (id) => {
  const store = loadStore();
  const p = store.patients.find((x) => x.id === id);
  return p ? clone(p) : null;
};

// ---- Appointments ----

export const mockGetAppointment = (id) => {
  const store = loadStore();
  const a = store.appointments.find((x) => x.id === id);
  return a ? clone(a) : null;
};
