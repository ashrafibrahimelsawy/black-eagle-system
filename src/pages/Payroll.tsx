import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { CreditCard, Loader2, Calendar, User, DollarSign, Download, Plus } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export default function Payroll({ user }: { user: any }) {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

  const fetchData = async () => {
    try {
      const data = await api.get("/payroll");
      setRecords(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await api.post("/payroll/generate", { month });
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>;

  const isAdmin = user.role === 'admin' || user.role === 'super_admin';

  const filteredRecords = records.filter(r => r.month === month);
  const displayRecords = isAdmin ? filteredRecords : records;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">الرواتب والمسيرات</h1>
          <p className="text-slate-500 mt-1">إدارة الرواتب الشهرية، الاستقطاعات، والمكافآت.</p>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-4">
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 disabled:opacity-50"
            >
              {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
              <span>توليد مسير الرواتب</span>
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div className="bg-blue-100 w-12 h-12 rounded-2xl flex items-center justify-center text-blue-600 mb-4">
            <CreditCard className="w-6 h-6" />
          </div>
          <p className="text-slate-500 text-sm font-medium">إجمالي الرواتب الأساسية</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">
            {filteredRecords.reduce((acc, r) => acc + r.base_salary, 0).toLocaleString()} ج.م
          </h3>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div className="bg-red-100 w-12 h-12 rounded-2xl flex items-center justify-center text-red-600 mb-4">
            <DollarSign className="w-6 h-6" />
          </div>
          <p className="text-slate-500 text-sm font-medium">إجمالي الاستقطاعات</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">
            {filteredRecords.reduce((acc, r) => acc + r.deductions, 0).toLocaleString()} ج.م
          </h3>
        </div>
        <div className="bg-emerald-900 p-6 rounded-3xl shadow-xl text-white">
          <div className="bg-white/10 w-12 h-12 rounded-2xl flex items-center justify-center text-white mb-4">
            <DollarSign className="w-6 h-6" />
          </div>
          <p className="text-emerald-200 text-sm font-medium">صافي الرواتب المصروفة</p>
          <h3 className="text-2xl font-bold mt-1">
            {filteredRecords.reduce((acc, r) => acc + r.net_salary, 0).toLocaleString()} ج.م
          </h3>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-bold">
                <th className="px-6 py-4">الموظف</th>
                <th className="px-6 py-4">الشهر</th>
                <th className="px-6 py-4">الراتب الأساسي</th>
                <th className="px-6 py-4">الاستقطاعات</th>
                <th className="px-6 py-4">الصافي</th>
                <th className="px-6 py-4">الحالة</th>
                <th className="px-6 py-4">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayRecords.map((record) => (
                <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                        <User className="w-5 h-5" />
                      </div>
                      <span className="font-bold text-slate-900">{record.user_name || user.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Calendar className="w-4 h-4" />
                      <span>{record.month}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-900">{record.base_salary.toLocaleString()} ج.م</td>
                  <td className="px-6 py-4 text-red-600 font-medium">-{record.deductions.toLocaleString()} ج.م</td>
                  <td className="px-6 py-4 font-bold text-emerald-600">{record.net_salary.toLocaleString()} ج.م</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      record.status === 'paid' ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-orange-600'
                    }`}>
                      {record.status === 'paid' ? 'تم الصرف' : 'بانتظار الصرف'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
                      <Download className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
