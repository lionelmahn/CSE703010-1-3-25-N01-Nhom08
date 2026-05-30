import React, { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Activity, FileEdit, CheckCircle2 } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import useMedicalRecordWorklist from '@/features/medical-records/hooks/useMedicalRecordWorklist';
import WorklistTable from '@/features/medical-records/components/WorklistTable';
import WorklistFilters from '@/features/medical-records/components/WorklistFilters';

/**
 * UC12 - Trang Quan ly ho so benh an (worklist).
 *
 * 3 tab chinh theo de xuat UI cua plan:
 *  - Dang kham (in_progress): bac si dang ghi nhan.
 *  - Ban nhap (draft): da luu nhap, cho tiep tuc.
 *  - Da hoan tat (completed): cho thanh toan / hoan tat / da khoa.
 *
 * Mo mot dong dieu huong sang /medical-records/{id}/workspace.
 */
const TAB_DEFS = [
  { key: 'in_progress', label: 'Đang khám', icon: Activity },
  { key: 'draft', label: 'Bản nháp', icon: FileEdit },
  { key: 'completed', label: 'Đã hoàn tất', icon: CheckCircle2 },
];

export default function MedicalRecords() {
  const navigate = useNavigate();
  const worklist = useMedicalRecordWorklist({ pollMs: 0 });
  const { filters, setFilter, counts, items, loading, error, refresh, resetFilters, meta, page, setPage } = worklist;

  const handleOpen = useCallback(
    (row) => {
      if (!row?.id) return;
      navigate(`/medical-records/${row.id}/workspace`);
    },
    [navigate],
  );

  const tabBadge = useMemo(
    () => ({
      in_progress: counts.in_progress ?? 0,
      draft: counts.draft ?? 0,
      completed: (counts.pending_payment ?? 0) + (counts.completed ?? 0),
    }),
    [counts],
  );

  return (
    <div className="space-y-4 animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
              <ClipboardList size={20} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800">Quản lý hồ sơ bệnh án</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Worklist phiên khám của bạn — lọc, theo dõi và mở hồ sơ chi tiết.
              </p>
            </div>
          </div>
        </div>

        <Tabs value={filters.tab} onValueChange={(v) => setFilter('tab', v)}>
          <TabsList className="bg-slate-100 p-1 rounded-xl">
            {TAB_DEFS.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger key={tab.key} value={tab.key} className="gap-1.5 data-[state=active]:bg-white">
                  <Icon className="h-4 w-4" />
                  {tab.label}
                  <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-200 px-1.5 text-xs">
                    {tabBadge[tab.key] ?? 0}
                  </span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          <div className="my-4">
            <WorklistFilters
              filters={filters}
              setFilter={setFilter}
              onRefresh={refresh}
              onReset={resetFilters}
              loading={loading}
            />
          </div>

          {error ? (
            <div className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-xl p-3 mb-3">
              {error}
            </div>
          ) : null}

          <TabsContent value="in_progress" className="mt-0">
            <WorklistTable items={items} loading={loading} onOpen={handleOpen} />
          </TabsContent>
          <TabsContent value="draft" className="mt-0">
            <WorklistTable items={items} loading={loading} onOpen={handleOpen} />
          </TabsContent>
          <TabsContent value="completed" className="mt-0">
            <WorklistTable items={items} loading={loading} onOpen={handleOpen} />
          </TabsContent>
        </Tabs>

        {meta?.last_page > 1 ? (
          <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
            <div>
              Tổng <strong>{meta.total}</strong> bản ghi · Trang <strong>{meta.current_page}</strong>/{meta.last_page}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 rounded-md border border-slate-200 hover:bg-slate-50 disabled:opacity-50"
              >
                ← Trước
              </button>
              <button
                type="button"
                disabled={page >= (meta.last_page || 1)}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 rounded-md border border-slate-200 hover:bg-slate-50 disabled:opacity-50"
              >
                Tiếp →
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
