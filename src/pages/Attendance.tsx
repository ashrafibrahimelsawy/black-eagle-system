import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { Clock, MapPin, History, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export default function Attendance({ user }: { user: any }) {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [todayRecord, setTodayRecord] = useState<any>(null);

  const fetchData = async () => {
    try {
      const data = await api.get("/attendance");
      setRecords(data);
      const today = new Date().toISOString().split('T')[0];
      const todayRec = data.find((r: any) => r.date === today && r.user_id === user.id);
      setTodayRecord(todayRec);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCheckIn = async () => {
    setActionLoading(true);
    try {
      await api.post("/attendance/check-in", {});
      await fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    try {
      await api.post("/attendance/check-out", {});
      await fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Action Card */}
        <div className="lg:col-span-1">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden"
          >
            <div className="p-8 bg-slate-900 text-white text-center">
              <div className="w-20 h-20 bg-emerald-500 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <Clock className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold">تسجيل الحضور</h3>
              <p className="text-slate-400 mt-2">{format(new Date(), "EEEE، d MMMM", { locale: ar })}</p>
            </div>

            <div className="p-8 space-y-6">
              <div className="flex flex-col gap-4">
                <button
                  onClick={handleCheckIn}
                  disabled={!!todayRecord?.check_in || actionLoading}
                  className={`w-full py-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-3 shadow-lg ${
                    todayRecord?.check_in 
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
                      : "bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-500/20"
                  }`}
                >
                  {todayRecord?.check_in ? <CheckCircle2 className="w-6 h-6" /> : <MapPin className="w-6 h-6" />}
                  {todayRecord?.check_in ? "تم تسجيل الحضور" : "تسجيل حضور (Check-in)"}
                </button>

                <button
                  onClick={handleCheckOut}
                  disabled={!todayRecord?.check_in || !!todayRecord?.check_out || actionLoading}
                  className={`w-full py-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-3 shadow-lg ${
                    !todayRecord?.check_in || todayRecord?.check_out
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
                      : "bg-orange-500 text-white hover:bg-orange-600 shadow-orange-500/20"
                  }`}
                >
                  {todayRecord?.check_out ? <CheckCircle2 className="w-6 h-6" /> : <History className="w-6 h-6" />}
                  {todayRecord?.check_out ? "تم تسجيل الانصراف" : "تسجيل انصراف (Check-out)"}
                </button>
              </div>

              {todayRecord && (
                <div className="pt-6 border-t border-slate-100 space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">وقت الحضور:</span>
                    <span className="font-bold text-slate-900">
                      {todayRecord.check_in ? format(new Date(todayRecord.check_in), "hh:mm a") : "--:--"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">وقت الانصراف:</span>
                    <span className="font-bold text-slate-900">
                      {todayRecord.check_out ? format(new Date(todayRecord.check_out), "hh:mm a") : "--:--"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* History Table */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">سجل الحضور</h3>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <History className="w-4 h-4" />
                <span>آخر 30 يوم</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-bold">
                    <th className="px-6 py-4">الموظف</th>
                    <th className="px-6 py-4">التاريخ</th>
                    <th className="px-6 py-4">الحضور</th>
                    <th className="px-6 py-4">الانصراف</th>
                    <th className="px-6 py-4">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {records.map((record) => (
                    <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-xs font-bold">
                            {record.user_name ? record.user_name[0] : user.name[0]}
                          </div>
                          <span className="font-medium text-slate-900">{record.user_name || user.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {format(new Date(record.date), "d MMM yyyy", { locale: ar })}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-emerald-600">
                        {record.check_in ? format(new Date(record.check_in), "hh:mm a") : "-"}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-orange-600">
                        {record.check_out ? format(new Date(record.check_out), "hh:mm a") : "-"}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          record.check_out ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'
                        }`}>
                          {record.check_out ? 'مكتمل' : 'نشط'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {records.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">
                        لا يوجد سجلات حضور حتى الآن.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
