import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Check,
  ChevronLeft,
  ChevronRight,
  FileText,
  Plus,
  Save,
  Search,
  Send,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {
  CERTIFICATE_TYPE_OPTIONS,
  createEmptyCertificate,
  createEmptyProfileForm,
  createEmptySpecialty,
} from '@/features/professional-profiles/utils';

const STEPS = [
  { id: 1, label: 'Chon nhan su' },
  { id: 2, label: 'Thong tin chuyen mon' },
  { id: 3, label: 'Chung chi va tai lieu' },
  { id: 4, label: 'Xac nhan' },
];

const ALLOWED_MIME = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
const MAX_BYTES = 10 * 1024 * 1024;

const initialOf = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(-2)
    .join('')
    .toUpperCase();

const formatBytes = (bytes) => {
  if (!bytes && bytes !== 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const roleLabel = (role) => (role === 'bac_si' ? 'Bac si' : role === 'ke_toan' ? 'Ke toan' : '--');

const normalizeScopeValue = (value) => {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'object') {
    return value.id ?? value.service_code ?? value.code ?? value.name ?? value.value ?? value.label ?? null;
  }
  return value;
};

const normalizeScope = (scope = []) =>
  Array.from(
    new Set(
      (Array.isArray(scope) ? scope : [])
        .map(normalizeScopeValue)
        .filter((value) => value !== null && value !== undefined && value !== '')
        .map((value) => String(value))
    )
  );

const serviceAliases = (service) =>
  [service.id, service.service_code, service.code, service.name]
    .filter((value) => value !== null && value !== undefined && value !== '')
    .map((value) => String(value).toLowerCase());

const serviceValue = (service) => String(service.id);

const scopeHasService = (scope, service) => {
  const aliases = serviceAliases(service);
  return normalizeScope(scope).some((item) => aliases.includes(String(item).toLowerCase()));
};

const toggleService = (scope, service, checked) => {
  const aliases = serviceAliases(service);
  const withoutService = normalizeScope(scope).filter(
    (item) => !aliases.includes(String(item).toLowerCase())
  );
  return checked ? [...withoutService, serviceValue(service)] : withoutService;
};

const createCertificateForRole = (role) => ({
  ...createEmptyCertificate(),
  certificate_type: CERTIFICATE_TYPE_OPTIONS[role]?.[0] || '',
});

const buildInitialForm = (initialForm) => {
  const base = {
    ...createEmptyProfileForm(),
    ...(initialForm || {}),
  };

  const specialties = (base.specialties || []).map((specialty) => ({
    ...createEmptySpecialty(),
    ...specialty,
    client_key:
      specialty.client_key || (specialty.id ? `sp_${specialty.id}` : createEmptySpecialty().client_key),
    specialty_name: specialty.specialty_name || '',
    service_scope: normalizeScope(specialty.service_scope),
  }));

  const specialtyScope = specialties.flatMap((specialty) => specialty.service_scope || []);
  const serviceScope = normalizeScope(
    base.service_scope?.length ? base.service_scope : specialtyScope
  );

  return {
    ...base,
    staff_id: base.staff_id ? String(base.staff_id) : '',
    branch_id: base.branch_id ? String(base.branch_id) : '',
    years_experience:
      base.years_experience !== null && base.years_experience !== undefined
        ? String(base.years_experience)
        : '',
    service_scope: serviceScope,
    specialties,
    certificates: (base.certificates || []).map((certificate) => ({
      ...createEmptyCertificate(),
      ...certificate,
      specialty_client_key: certificate.specialty_client_key || '',
      file: certificate.file || null,
      existing_file_name: certificate.existing_file_name || certificate.file_name || '',
    })),
  };
};

const reviewSignature = (candidate) =>
  JSON.stringify({
    degree: candidate.degree || '',
    years_experience: String(candidate.years_experience || ''),
    branch_id: String(candidate.branch_id || ''),
    service_scope: normalizeScope(candidate.service_scope).sort(),
    specialties: (candidate.specialties || []).map((specialty) => ({
      id: specialty.id || null,
      specialty_name: specialty.specialty_name || '',
      service_scope: normalizeScope(specialty.service_scope).sort(),
      branch_or_room: specialty.branch_or_room || '',
    })),
    certificates: (candidate.certificates || []).map((certificate) => ({
      id: certificate.id || null,
      certificate_type: certificate.certificate_type || '',
      certificate_name: certificate.certificate_name || '',
      certificate_number: certificate.certificate_number || '',
      issuer: certificate.issuer || '',
      issued_date: certificate.issued_date || '',
      expiry_date: certificate.expiry_date || '',
      scope_label: certificate.scope_label || '',
      specialty_client_key: certificate.specialty_client_key || '',
      professional_profile_specialty_id: certificate.professional_profile_specialty_id || null,
      is_primary: Boolean(certificate.is_primary),
      file_name: certificate.file?.name || certificate.existing_file_name || '',
    })),
  });

function StaffCard({ staff, selected = false, readOnly = false, onSelect }) {
  const branchLabel = staff?.branch?.name || staff?.branch?.city || 'Chua gan chi nhanh';

  return (
    <button
      type="button"
      disabled={readOnly}
      onClick={() => onSelect?.(staff)}
      className={`w-full text-left flex items-center gap-3 p-3 border rounded-lg transition-colors ${selected ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'
        } ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}
    >
      <div className="w-10 h-10 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center text-xs font-medium text-slate-600 flex-shrink-0 overflow-hidden">
        {staff?.avatar ? (
          <img src={staff.avatar} alt={staff.full_name} className="w-full h-full object-cover" />
        ) : (
          initialOf(staff?.full_name)
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-slate-900 truncate">{staff?.full_name || '--'}</div>
        <div className="text-xs text-slate-500 truncate">
          {roleLabel(staff?.role_slug)} - {branchLabel} - {staff?.employee_code || '--'}
        </div>
      </div>
      {selected && <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />}
    </button>
  );
}

function FieldError({ children }) {
  if (!children) return null;
  return (
    <div className="text-xs text-red-600 mt-1 flex items-center gap-1">
      <AlertCircle className="w-3 h-3" /> {children}
    </div>
  );
}

function ServiceChecklist({ services, value, onChange, error }) {
  return (
    <div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 rounded-lg border border-slate-200 bg-white p-3 max-h-56 overflow-y-auto">
        {services.length === 0 ? (
          <div className="text-sm text-slate-400 sm:col-span-2 lg:col-span-3">
            Chua co danh muc dich vu.
          </div>
        ) : (
          services.map((service) => {
            const checked = scopeHasService(value, service);
            return (
              <label
                key={service.id}
                className="flex items-start gap-2 rounded border border-slate-100 p-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  className="mt-1 accent-blue-600"
                  checked={checked}
                  onChange={(event) => onChange(toggleService(value, service, event.target.checked))}
                />
                <span>{service.name}</span>
              </label>
            );
          })
        )}
      </div>
      <FieldError>{error}</FieldError>
    </div>
  );
}

export default function ProfessionalProfileWizardModal({
  open,
  staffOptions = [],
  branches = [],
  services = [],
  degrees = [],
  isEdit = false,
  initialForm = null,
  submitting = false,
  onClose,
  onSubmit,
}) {
  const [step, setStep] = useState(1);
  const [staffSearch, setStaffSearch] = useState('');
  const [form, setForm] = useState(createEmptyProfileForm());
  const [errors, setErrors] = useState({});

  const initialWizardForm = useMemo(() => buildInitialForm(initialForm), [initialForm]);

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm(buildInitialForm(initialForm));
    setStep(1);
    setStaffSearch('');
    setErrors({});
  }, [open, initialForm]);

  const availableStaff = useMemo(() => {
    const staffFromProfile = initialForm?.staff;
    if (!staffFromProfile) return staffOptions;
    const exists = staffOptions.some((staff) => String(staff.id) === String(staffFromProfile.id));
    return exists ? staffOptions : [staffFromProfile, ...staffOptions];
  }, [initialForm?.staff, staffOptions]);

  const filteredStaff = useMemo(() => {
    const q = staffSearch.trim().toLowerCase();
    return availableStaff.filter((staff) => {
      if (!q) return true;
      return (
        staff.full_name?.toLowerCase().includes(q) ||
        staff.employee_code?.toLowerCase().includes(q) ||
        staff.email?.toLowerCase().includes(q)
      );
    });
  }, [availableStaff, staffSearch]);

  const selectedStaff = useMemo(
    () => availableStaff.find((staff) => String(staff.id) === String(form.staff_id)) || null,
    [availableStaff, form.staff_id]
  );

  const selectedBranch = useMemo(
    () => branches.find((branch) => String(branch.id) === String(form.branch_id)) || null,
    [branches, form.branch_id]
  );

  const isDoctor = form.profile_role === 'bac_si';
  const certificateTypeOptions = useMemo(
    () => CERTIFICATE_TYPE_OPTIONS[form.profile_role] || [],
    [form.profile_role]
  );

  const normalizedSpecialties = useMemo(() => {
    if (!isDoctor) return [];
    const serviceScope = normalizeScope(form.service_scope);
    return (form.specialties || [])
      .filter((specialty) => specialty.specialty_name?.trim())
      .map((specialty) => ({
        ...specialty,
        specialty_name: specialty.specialty_name.trim(),
        degree: form.degree || specialty.degree || '',
        years_experience: Number(form.years_experience || specialty.years_experience || 0),
        service_scope: serviceScope,
        branch_or_room: specialty.branch_or_room || selectedBranch?.name || '',
        notes: specialty.notes || '',
      }));
  }, [form.degree, form.service_scope, form.specialties, form.years_experience, isDoctor, selectedBranch?.name]);

  const normalizedCertificates = useMemo(
    () =>
      (form.certificates || [])
        .filter(
          (certificate) =>
            certificate.id ||
            certificate.file ||
            certificate.existing_file_name ||
            certificate.certificate_name ||
            certificate.certificate_number
        )
        .map((certificate) => ({
          ...certificate,
          certificate_type: certificate.certificate_type || certificateTypeOptions[0] || '',
          certificate_name: certificate.certificate_name || '',
          certificate_number: certificate.certificate_number || '',
          issued_date: certificate.issued_date || '',
          expiry_date: certificate.expiry_date || '',
          issuer: certificate.issuer || '',
          scope_label: certificate.scope_label || '',
          notes: certificate.notes || '',
          is_primary: Boolean(certificate.is_primary),
          specialty_client_key: certificate.specialty_client_key || '',
        })),
    [certificateTypeOptions, form.certificates]
  );

  const preparedForm = useMemo(
    () => ({
      ...form,
      service_scope: normalizeScope(form.service_scope),
      specialties: normalizedSpecialties,
      certificates: normalizedCertificates,
    }),
    [form, normalizedCertificates, normalizedSpecialties]
  );

  const hasReviewChanges = useMemo(() => {
    if (!isEdit) return false;
    return reviewSignature(preparedForm) !== reviewSignature(initialWizardForm);
  }, [initialWizardForm, isEdit, preparedForm]);
  const approvedReviewChanges = isEdit && initialWizardForm.status === 'approved' && hasReviewChanges;

  const changeItems = useMemo(() => {
    if (!isEdit) return [];
    const items = [];
    if ((form.degree || '') !== (initialWizardForm.degree || '')) items.push('Hoc vi');
    if (String(form.years_experience || '') !== String(initialWizardForm.years_experience || '')) {
      items.push('Kinh nghiem');
    }
    if (String(form.branch_id || '') !== String(initialWizardForm.branch_id || '')) {
      items.push('Chi nhanh');
    }
    if (
      JSON.stringify(normalizeScope(form.service_scope).sort()) !==
      JSON.stringify(normalizeScope(initialWizardForm.service_scope).sort())
    ) {
      items.push('Dich vu duoc phep');
    }
    if (reviewSignature(preparedForm) !== reviewSignature({ ...initialWizardForm, certificates: preparedForm.certificates })) {
      items.push('Chuyen mon');
    }
    if (
      JSON.stringify(
        preparedForm.certificates.map((certificate) => ({
          id: certificate.id || null,
          certificate_name: certificate.certificate_name || '',
          certificate_number: certificate.certificate_number || '',
          expiry_date: certificate.expiry_date || '',
          file_name: certificate.file?.name || certificate.existing_file_name || '',
        }))
      ) !==
      JSON.stringify(
        (initialWizardForm.certificates || []).map((certificate) => ({
          id: certificate.id || null,
          certificate_name: certificate.certificate_name || '',
          certificate_number: certificate.certificate_number || '',
          expiry_date: certificate.expiry_date || '',
          file_name: certificate.file?.name || certificate.existing_file_name || '',
        }))
      )
    ) {
      items.push('Chung chi / tai lieu');
    }
    return Array.from(new Set(items));
  }, [form, initialWizardForm, isEdit, preparedForm]);

  const handleSelectStaff = (staff) => {
    setForm((prev) => ({
      ...prev,
      staff,
      staff_id: String(staff.id),
      profile_role: staff.role_slug,
      branch_id: prev.branch_id || (staff.branch_id ? String(staff.branch_id) : ''),
      specialties:
        staff.role_slug === 'bac_si' && prev.specialties.length === 0
          ? [createEmptySpecialty()]
          : prev.specialties,
      certificates:
        prev.certificates.length === 0
          ? [createCertificateForRole(staff.role_slug)]
          : prev.certificates,
    }));
    setErrors((prev) => ({ ...prev, staff_id: undefined }));
  };

  const addSpecialty = () => {
    setForm((prev) => ({
      ...prev,
      specialties: [...prev.specialties, createEmptySpecialty()],
    }));
  };

  const removeSpecialty = (index) => {
    setForm((prev) => ({
      ...prev,
      specialties: prev.specialties.filter((_, itemIndex) => itemIndex !== index),
      certificates: prev.certificates.map((certificate) =>
        certificate.specialty_client_key === prev.specialties[index]?.client_key
          ? { ...certificate, specialty_client_key: '', professional_profile_specialty_id: null }
          : certificate
      ),
    }));
  };

  const updateSpecialty = (index, field, value) => {
    setForm((prev) => ({
      ...prev,
      specialties: prev.specialties.map((specialty, itemIndex) =>
        itemIndex === index ? { ...specialty, [field]: value } : specialty
      ),
    }));
  };

  const addCertificate = () => {
    setForm((prev) => ({
      ...prev,
      certificates: [...prev.certificates, createCertificateForRole(prev.profile_role)],
    }));
  };

  const removeCertificate = (index) => {
    setForm((prev) => ({
      ...prev,
      certificates: prev.certificates.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const updateCertificate = (index, field, value) => {
    setForm((prev) => ({
      ...prev,
      certificates: prev.certificates.map((certificate, itemIndex) =>
        itemIndex === index
          ? {
            ...certificate,
            [field]: value === 'general' ? '' : value,
            professional_profile_specialty_id:
              field === 'specialty_client_key'
                ? null
                : certificate.professional_profile_specialty_id,
          }
          : certificate
      ),
    }));
  };

  const handleFileChange = (index, file) => {
    if (!file) {
      updateCertificate(index, 'file', null);
      return;
    }
    if (file.size > MAX_BYTES) {
      setErrors((prev) => ({ ...prev, [`certificate_file_${index}`]: `File vuot qua 10MB.` }));
      return;
    }
    if (!ALLOWED_MIME.includes(file.type) && !file.name.match(/\.(pdf|jpg|jpeg|png)$/i)) {
      setErrors((prev) => ({
        ...prev,
        [`certificate_file_${index}`]: 'Chi chap nhan PDF, JPG hoac PNG.',
      }));
      return;
    }
    updateCertificate(index, 'file', file);
    setErrors((prev) => ({ ...prev, [`certificate_file_${index}`]: undefined }));
  };

  const validateStep = (targetStep) => {
    const nextErrors = {};
    if (targetStep === 1) {
      if (!form.staff_id) nextErrors.staff_id = 'Vui long chon nhan su.';
    }

    if (targetStep === 2) {
      if (!form.branch_id) nextErrors.branch_id = 'Vui long chon chi nhanh.';
      if (isDoctor) {
        if (!form.degree) nextErrors.degree = 'Vui long chon hoc vi.';
        if (normalizedSpecialties.length === 0) {
          nextErrors.specialties = 'Bac si can it nhat mot chuyen mon.';
        }
        if (normalizeScope(form.service_scope).length === 0) {
          nextErrors.service_scope = 'Vui long chon it nhat mot dich vu.';
        }
        form.specialties.forEach((specialty, index) => {
          if (!specialty.specialty_name?.trim()) {
            nextErrors[`specialty_${index}`] = 'Vui long nhap ten chuyen mon.';
          }
        });
      }
    }

    if (targetStep === 3) {
      if (normalizedCertificates.length === 0) {
        nextErrors.certificates = 'Can it nhat mot chung chi hoac tai lieu.';
      }
      const seen = new Set();
      normalizedCertificates.forEach((certificate, index) => {
        if (!certificate.certificate_type) {
          nextErrors[`certificate_type_${index}`] = 'Vui long chon loai chung chi.';
        }
        if (!certificate.certificate_name?.trim()) {
          nextErrors[`certificate_name_${index}`] = 'Vui long nhap ten chung chi.';
        }
        if (!certificate.certificate_number?.trim()) {
          nextErrors[`certificate_number_${index}`] = 'Vui long nhap so chung chi.';
        } else {
          const key = `${certificate.certificate_type}|${certificate.certificate_number}`.toLowerCase();
          if (seen.has(key)) {
            nextErrors[`certificate_number_${index}`] = 'So chung chi bi trung trong ho so.';
          }
          seen.add(key);
        }
        if (!certificate.id && !certificate.existing_file_name && !certificate.file) {
          nextErrors[`certificate_file_${index}`] = 'Vui long dinh kem file.';
        }
      });
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validateAll = () => {
    for (const targetStep of [1, 2, 3]) {
      if (!validateStep(targetStep)) {
        setStep(targetStep);
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep(step)) return;
    setStep((current) => Math.min(4, current + 1));
  };

  const handlePrev = () => setStep((current) => Math.max(1, current - 1));

  const handleSave = async (submitForApproval) => {
    if (!validateAll()) return;

    let status = submitForApproval ? 'pending' : 'draft';
    if (isEdit) {
      if (submitForApproval) {
        status = 'pending';
      } else if (approvedReviewChanges) {
        status = 'pending';
      } else if (initialWizardForm.status === 'approved' || initialWizardForm.status === 'inactive') {
        status = '';
      }
    }

    await onSubmit?.({
      ...preparedForm,
      id: initialForm?.id,
      status,
      notes: form.notes || '',
    }, { submitForApproval, hasReviewChanges });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[92vh] flex flex-col">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {isEdit ? 'Cap nhat ho so chuyen mon' : 'Them ho so chuyen mon'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Buoc {step}/4 - {STEPS[step - 1].label}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded hover:bg-slate-100 text-slate-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-3 border-b border-slate-200">
          <ol className="flex items-center gap-2 text-xs overflow-x-auto">
            {STEPS.map((item, index) => {
              const isCurrent = item.id === step;
              const isDone = item.id < step;
              return (
                <li key={item.id} className="flex items-center gap-2 whitespace-nowrap">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-semibold ${isCurrent
                        ? 'bg-blue-600 text-white'
                        : isDone
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                  >
                    {isDone ? <Check className="w-3.5 h-3.5" /> : item.id}
                  </div>
                  <span className={isCurrent ? 'text-blue-700 font-medium' : 'text-slate-500'}>
                    {item.label}
                  </span>
                  {index < STEPS.length - 1 && <span className="w-6 h-px bg-slate-300 mx-1" />}
                </li>
              );
            })}
          </ol>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {step === 1 && (
            <div className="space-y-3">
              {isEdit ? (
                <>
                  <div className="rounded-md bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
                    Nhan su va vai tro ho so duoc khoa khi chinh sua. Neu can doi vai tro,
                    hay xu ly tai module ho so nhan su truoc.
                  </div>
                  <StaffCard staff={selectedStaff || initialForm?.staff} selected readOnly />
                </>
              ) : (
                <>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={staffSearch}
                      onChange={(event) => setStaffSearch(event.target.value)}
                      placeholder="Tim theo ten, ma nhan su hoac email..."
                      className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <FieldError>{errors.staff_id}</FieldError>
                  <div className="space-y-2 max-h-[430px] overflow-y-auto pr-1">
                    {filteredStaff.length === 0 ? (
                      <div className="text-sm text-slate-500 text-center py-8">
                        Khong tim thay nhan su du dieu kien tao ho so.
                      </div>
                    ) : (
                      filteredStaff.map((staff) => (
                        <StaffCard
                          key={staff.id}
                          staff={staff}
                          selected={String(staff.id) === String(form.staff_id)}
                          onSelect={handleSelectStaff}
                        />
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              {selectedStaff && (
                <div className="rounded-md bg-blue-50 border border-blue-100 p-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-white border flex items-center justify-center text-xs font-medium text-slate-600">
                    {initialOf(selectedStaff.full_name)}
                  </div>
                  <div className="text-xs">
                    <div className="font-medium text-slate-800">{selectedStaff.full_name}</div>
                    <div className="text-slate-500">
                      {roleLabel(form.profile_role)} - {selectedStaff.employee_code}
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Hoc vi {isDoctor && <span className="text-red-500">*</span>}
                  </label>
                  <select
                    value={form.degree || ''}
                    onChange={(event) => setForm((prev) => ({ ...prev, degree: event.target.value }))}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">-- Chon --</option>
                    {degrees.map((degree) => (
                      <option key={degree.value} value={degree.value}>
                        {degree.label}
                      </option>
                    ))}
                  </select>
                  <FieldError>{errors.degree}</FieldError>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Kinh nghiem (nam)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={80}
                    value={form.years_experience || ''}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, years_experience: event.target.value }))
                    }
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Chi nhanh <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.branch_id || ''}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, branch_id: event.target.value }))
                    }
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">-- Chon chi nhanh --</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                  <FieldError>{errors.branch_id}</FieldError>
                </div>
              </div>

              {isDoctor ? (
                <>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-800">Chuyen mon</h3>
                        <p className="text-xs text-slate-500">
                          Bac si can it nhat mot chuyen mon truoc khi gui duyet.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={addSpecialty}
                        className="px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 text-sm flex items-center gap-1"
                      >
                        <Plus className="w-4 h-4" /> Them
                      </button>
                    </div>
                    <FieldError>{errors.specialties}</FieldError>

                    {form.specialties.map((specialty, index) => (
                      <div key={specialty.client_key || index} className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium text-slate-800">Chuyen mon #{index + 1}</div>
                          <button
                            type="button"
                            onClick={() => removeSpecialty(index)}
                            className="p-1 rounded hover:bg-red-50 text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">
                              Ten chuyen mon <span className="text-red-500">*</span>
                            </label>
                            <input
                              value={specialty.specialty_name || ''}
                              onChange={(event) => updateSpecialty(index, 'specialty_name', event.target.value)}
                              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                              placeholder="VD: Implant, Nha chu..."
                            />
                            <FieldError>{errors[`specialty_${index}`]}</FieldError>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">
                              Phong / chi nhanh ap dung
                            </label>
                            <input
                              value={specialty.branch_or_room || ''}
                              onChange={(event) => updateSpecialty(index, 'branch_or_room', event.target.value)}
                              className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                              placeholder={selectedBranch?.name || 'De trong neu dung chi nhanh chung'}
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Ghi chu</label>
                          <textarea
                            rows={2}
                            value={specialty.notes || ''}
                            onChange={(event) => updateSpecialty(index, 'notes', event.target.value)}
                            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Dich vu duoc phep thuc hien <span className="text-red-500">*</span>
                    </label>
                    <ServiceChecklist
                      services={services}
                      value={form.service_scope}
                      onChange={(value) => setForm((prev) => ({ ...prev, service_scope: value }))}
                      error={errors.service_scope}
                    />
                  </div>
                </>
              ) : (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                  Ho so ke toan khong can danh sach chuyen mon con. Hay khai bao pham vi
                  phu trach trong chung chi/tai lieu va ghi chu.
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Ghi chu</label>
                <textarea
                  rows={3}
                  value={form.notes || ''}
                  onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Ghi chu noi bo..."
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">Chung chi va tai lieu</h3>
                  <p className="text-xs text-slate-500">PDF/JPG/PNG, toi da 10MB moi file.</p>
                </div>
                <button
                  type="button"
                  onClick={addCertificate}
                  className="px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 text-sm flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Them tai lieu
                </button>
              </div>
              <FieldError>{errors.certificates}</FieldError>

              {form.certificates.length === 0 ? (
                <div className="text-sm text-slate-400 text-center py-8 border border-dashed border-slate-200 rounded-lg">
                  Chua co chung chi hoac tai lieu.
                </div>
              ) : (
                form.certificates.map((certificate, index) => (
                  <div key={certificate.id || index} className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-slate-800 flex items-center gap-2 text-sm">
                        <FileText className="w-4 h-4 text-blue-600" /> Tai lieu #{index + 1}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeCertificate(index)}
                        className="p-1 rounded hover:bg-red-50 text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Loai chung chi <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={certificate.certificate_type || ''}
                          onChange={(event) => updateCertificate(index, 'certificate_type', event.target.value)}
                          className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="">-- Chon loai --</option>
                          {certificateTypeOptions.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                        <FieldError>{errors[`certificate_type_${index}`]}</FieldError>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Ten chung chi <span className="text-red-500">*</span>
                        </label>
                        <input
                          value={certificate.certificate_name || ''}
                          onChange={(event) => updateCertificate(index, 'certificate_name', event.target.value)}
                          className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <FieldError>{errors[`certificate_name_${index}`]}</FieldError>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          So chung chi <span className="text-red-500">*</span>
                        </label>
                        <input
                          value={certificate.certificate_number || ''}
                          onChange={(event) => updateCertificate(index, 'certificate_number', event.target.value)}
                          className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <FieldError>{errors[`certificate_number_${index}`]}</FieldError>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Don vi cap</label>
                        <input
                          value={certificate.issuer || ''}
                          onChange={(event) => updateCertificate(index, 'issuer', event.target.value)}
                          className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Ngay cap</label>
                        <input
                          type="date"
                          value={certificate.issued_date || ''}
                          onChange={(event) => updateCertificate(index, 'issued_date', event.target.value)}
                          className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Ngay het han</label>
                        <input
                          type="date"
                          value={certificate.expiry_date || ''}
                          onChange={(event) => updateCertificate(index, 'expiry_date', event.target.value)}
                          className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          {isDoctor ? 'Pham vi / dich vu ap dung' : 'Mang phu trach'}
                        </label>
                        <input
                          value={certificate.scope_label || ''}
                          onChange={(event) => updateCertificate(index, 'scope_label', event.target.value)}
                          className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      {isDoctor && (
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">
                            Gan voi chuyen mon
                          </label>
                          <select
                            value={certificate.specialty_client_key || ''}
                            onChange={(event) => updateCertificate(index, 'specialty_client_key', event.target.value)}
                            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="general">Khong gan chuyen mon cu the</option>
                            {form.specialties.map((specialty) => (
                              <option key={specialty.client_key} value={specialty.client_key}>
                                {specialty.specialty_name || 'Chuyen mon chua dat ten'}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>

                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Tep dinh kem {!certificate.id && <span className="text-red-500">*</span>}
                        </label>
                        <label className="flex items-center gap-2 border border-dashed border-slate-300 rounded-md p-3 bg-white cursor-pointer hover:border-blue-400">
                          <Upload className="w-4 h-4 text-slate-400" />
                          <span className="text-sm text-slate-600 truncate">
                            {certificate.file
                              ? `${certificate.file.name} (${formatBytes(certificate.file.size)})`
                              : certificate.existing_file_name || 'Chon file'}
                          </span>
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                            className="hidden"
                            onChange={(event) => handleFileChange(index, event.target.files?.[0] || null)}
                          />
                        </label>
                        <FieldError>{errors[`certificate_file_${index}`]}</FieldError>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Ghi chu</label>
                        <textarea
                          rows={3}
                          value={certificate.notes || ''}
                          onChange={(event) => updateCertificate(index, 'notes', event.target.value)}
                          className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        className="accent-blue-600"
                        checked={Boolean(certificate.is_primary)}
                        onChange={(event) => updateCertificate(index, 'is_primary', event.target.checked)}
                      />
                      Danh dau la chung chi chinh
                    </label>
                  </div>
                ))
              )}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              {approvedReviewChanges && (
                <div className="rounded-md bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800 flex gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  Ho so da duyet co thay doi nghiep vu se duoc chuyen ve trang thai Cho duyet.
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div className="rounded-lg border border-slate-200 p-3">
                  <div className="text-xs text-slate-500">Nhan su</div>
                  <div className="font-medium text-slate-900">{selectedStaff?.full_name || '--'}</div>
                  <div className="text-xs text-slate-500">{selectedStaff?.employee_code || '--'}</div>
                </div>
                <div className="rounded-lg border border-slate-200 p-3">
                  <div className="text-xs text-slate-500">Loai ho so</div>
                  <div className="font-medium text-slate-900">{roleLabel(form.profile_role)}</div>
                  <div className="text-xs text-slate-500">{selectedBranch?.name || 'Chua chon chi nhanh'}</div>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 p-3 space-y-2 text-sm">
                <div className="font-semibold text-slate-800">Tom tat chuyen mon</div>
                <div className="text-slate-600">
                  Hoc vi: <span className="font-medium text-slate-900">{form.degree || '--'}</span>
                  {' - '}Kinh nghiem:{' '}
                  <span className="font-medium text-slate-900">
                    {form.years_experience ? `${form.years_experience} nam` : '--'}
                  </span>
                </div>
                {isDoctor && (
                  <>
                    <div className="text-slate-600">
                      Chuyen mon:{' '}
                      <span className="font-medium text-slate-900">
                        {normalizedSpecialties.map((specialty) => specialty.specialty_name).join(', ') || '--'}
                      </span>
                    </div>
                    <div className="text-slate-600">
                      Dich vu:{' '}
                      <span className="font-medium text-slate-900">
                        {services
                          .filter((service) => scopeHasService(form.service_scope, service))
                          .map((service) => service.name)
                          .join(', ') || '--'}
                      </span>
                    </div>
                  </>
                )}
                <div className="text-slate-600">
                  Tai lieu: <span className="font-medium text-slate-900">{normalizedCertificates.length}</span>
                </div>
              </div>

              {isEdit && (
                <div className="rounded-lg border border-slate-200 p-3">
                  <div className="font-semibold text-slate-800 text-sm mb-2">Thay doi se luu</div>
                  {changeItems.length === 0 ? (
                    <div className="text-sm text-slate-500">Khong phat hien thay doi nghiep vu lon.</div>
                  ) : (
                    <ul className="list-disc pl-5 text-sm text-slate-700 space-y-1">
                      {changeItems.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex justify-between items-center gap-2">
          <button
            type="button"
            onClick={handlePrev}
            disabled={step === 1 || submitting}
            className="px-3 py-1.5 rounded-md text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-sm flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" /> Quay lai
          </button>
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-3 py-1.5 rounded-md text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 text-sm"
            >
              Huy
            </button>
            {step < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 text-sm flex items-center gap-1"
              >
                Tiep theo <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => handleSave(false)}
                  disabled={submitting}
                  className="px-3 py-1.5 rounded-md bg-white text-slate-700 border border-slate-300 hover:bg-slate-100 text-sm flex items-center gap-1 disabled:opacity-60"
                >
                  <Save className="w-4 h-4" /> {submitting ? 'Dang luu...' : 'Luu nhap'}
                </button>
                <button
                  type="button"
                  onClick={() => handleSave(true)}
                  disabled={submitting}
                  className="px-4 py-1.5 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 text-sm flex items-center gap-1 disabled:opacity-60"
                >
                  <Send className="w-4 h-4" /> {submitting ? 'Dang gui...' : 'Gui duyet'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
