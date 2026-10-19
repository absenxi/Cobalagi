import React, { useState } from 'react';
import { Student, AttendanceStatus, SchoolSettings, UserRole } from '../types';
import {
  Calendar,
  CheckCircle2,
  Search,
  X,
} from 'lucide-react';
import { PasswordPromptModal } from './PasswordPromptModal';
import { ConfirmationConfig } from './ConfirmationModal';

interface DailyAttendanceProps {
  students: Student[];
  schoolSettings: SchoolSettings;
  selectedYear: number;
  selectedMonthIndex: number;
  selectedDay: number;
  setSelectedDay: (day: number) => void;
  attendanceData: Record<string, Record<number, AttendanceStatus>>;
  onUpdateStatus: (studentId: string, day: number, status: AttendanceStatus) => void;
  onQuickMarkDay?: (day: number, status: AttendanceStatus) => void;
  onResetMonthAttendance?: () => void;
  onResetDayAttendance?: (day: number) => void;
  isUnlocked: boolean;
  isAdminUnlocked?: boolean;
  onUnlockSession: (role?: UserRole) => void;
  onLockSession: () => void;
  onPrevMonth?: () => void;
  onNextMonth?: () => void;
  onGoToCurrentMonth?: () => void;
  onRequestConfirmation?: (config: ConfirmationConfig) => void;
}

export const DailyAttendance: React.FC<DailyAttendanceProps> = ({
  students,
  schoolSettings,
  selectedYear,
  selectedMonthIndex,
  selectedDay,
  setSelectedDay,
  attendanceData,
  onUpdateStatus,
  onQuickMarkDay,
  onResetMonthAttendance,
  onResetDayAttendance,
  isUnlocked,
  isAdminUnlocked = false,
  onUnlockSession,
  onLockSession,
  onPrevMonth,
  onNextMonth,
  onGoToCurrentMonth,
  onRequestConfirmation,
}) => {
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  const dateObj = new Date(selectedYear, selectedMonthIndex, selectedDay);
  const formattedFullDate = dateObj.toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const isPasswordRequired = schoolSettings.requirePassword !== false;

  // Execute action or demand password if locked
  const handleProtectedAction = (action: () => void) => {
    if (isPasswordRequired && !isUnlocked) {
      setPendingAction(() => action);
      setShowPasswordModal(true);
    } else {
      action();
    }
  };

  const handlePasswordSuccess = (role: UserRole) => {
    onUnlockSession(role);
    setShowPasswordModal(false);
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  };

  // Calculate filtered students based on search
  const filteredStudents = students.filter((s) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      s.name.toLowerCase().includes(q) ||
      s.no.toString() === q ||
      s.no.toString().includes(q) ||
      (s.nisn && s.nisn.toLowerCase().includes(q))
    );
  });

  return (
    <div className="bg-white rounded-2xl shadow-xl border-2 border-emerald-200 p-4 sm:p-6 mb-6">
      {/* Top Header: Title & Date */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-md">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-800 flex items-center gap-2">
              Absensi Harian Kelas {schoolSettings.className}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 font-medium">{formattedFullDate}</p>
          </div>
        </div>
      </div>

      {/* Real-time Toast Feedback */}
      {toastMessage && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-black flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold ml-2 text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Search Input Bar */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 sm:p-4 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama siswa, nomor urut, atau NISN..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden transition-all placeholder:text-slate-400 shadow-xs"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                title="Hapus kata kunci pencarian"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="text-xs font-bold text-slate-500 shrink-0 px-1 flex items-center justify-between sm:justify-end gap-2">
            <span>
              Menampilkan <strong className="text-slate-800 font-extrabold">{filteredStudents.length}</strong> dari{' '}
              <strong className="text-slate-800 font-extrabold">{students.length}</strong> siswa
            </span>
            {search && (
              <button
                onClick={() => setSearch('')}
                className="px-2.5 py-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
              >
                Reset Pencarian
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Student List Daily Toggle Cards Grid */}
      {filteredStudents.length === 0 ? (
        <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-extrabold text-slate-800">
            Tidak ditemukan siswa dengan kata kunci &ldquo;{search}&rdquo;
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Silakan periksa ejaan nama atau nomor urut siswa, atau reset pencarian untuk menampilkan seluruh daftar siswa.
          </p>
          <button
            onClick={() => setSearch('')}
            className="mt-3 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-sm transition-all cursor-pointer"
          >
            Tampilkan Semua Siswa
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[480px] overflow-y-auto pr-1">
          {filteredStudents.map((student) => {
            const currentStatus = attendanceData[student.id]?.[selectedDay] || '-';

            return (
              <div
                key={student.id}
                className="bg-slate-50 hover:bg-white border-2 border-slate-200 hover:border-emerald-300 rounded-xl p-3 shadow-sm hover:shadow-md transition-all flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 bg-emerald-700 text-white rounded-full font-black text-xs flex items-center justify-center shrink-0">
                    {student.no}
                  </div>
                  <div className="truncate">
                    <div className="font-extrabold text-xs text-slate-800 uppercase truncate">
                      {student.name}
                    </div>
                    <div className="text-[10px] text-slate-500 font-bold">
                      Kelamin: <span className="text-emerald-700">{student.gender}</span>
                    </div>
                  </div>
                </div>

                {/* Status Radio / Selector Buttons */}
                <div className="flex items-center gap-1 shrink-0 font-extrabold text-xs">
                  <button
                    onClick={() =>
                      handleProtectedAction(() =>
                        onUpdateStatus(student.id, selectedDay, 'H')
                      )
                    }
                    className={`w-7 h-7 rounded-lg transition-all ${
                      currentStatus === 'H'
                        ? 'bg-emerald-600 text-white ring-2 ring-emerald-400 shadow-md'
                        : 'bg-slate-200 text-slate-600 hover:bg-emerald-100'
                    }`}
                    title="Hadir"
                  >
                    H
                  </button>
                  <button
                    onClick={() =>
                      handleProtectedAction(() =>
                        onUpdateStatus(student.id, selectedDay, 'S')
                      )
                    }
                    className={`w-7 h-7 rounded-lg transition-all ${
                      currentStatus === 'S'
                        ? 'bg-sky-600 text-white ring-2 ring-sky-400 shadow-md'
                        : 'bg-slate-200 text-slate-600 hover:bg-sky-100'
                    }`}
                    title="Sakit"
                  >
                    S
                  </button>
                  <button
                    onClick={() =>
                      handleProtectedAction(() =>
                        onUpdateStatus(student.id, selectedDay, 'I')
                      )
                    }
                    className={`w-7 h-7 rounded-lg transition-all ${
                      currentStatus === 'I'
                        ? 'bg-amber-500 text-white ring-2 ring-amber-300 shadow-md'
                        : 'bg-slate-200 text-slate-600 hover:bg-amber-100'
                    }`}
                    title="Izin"
                  >
                    I
                  </button>
                  <button
                    onClick={() =>
                      handleProtectedAction(() =>
                        onUpdateStatus(student.id, selectedDay, 'A')
                      )
                    }
                    className={`w-7 h-7 rounded-lg transition-all ${
                      currentStatus === 'A'
                        ? 'bg-red-600 text-white ring-2 ring-red-400 shadow-md'
                        : 'bg-slate-200 text-slate-600 hover:bg-red-100'
                    }`}
                    title="Alpa"
                  >
                    A
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Password Prompt Modal */}
      <PasswordPromptModal
        isOpen={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false);
          setPendingAction(null);
        }}
        onSuccess={handlePasswordSuccess}
        guruPassword={schoolSettings.attendancePassword || '1234'}
        adminPassword={schoolSettings.adminPassword || 'admin'}
        superAdminPassword={schoolSettings.superAdminPassword || 'superadmin'}
        requiredLevel="guru"
      />
    </div>
  );
};
