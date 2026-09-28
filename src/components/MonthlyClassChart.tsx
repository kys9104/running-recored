import React, { useState, useMemo } from 'react';
import { RunningRecord } from '../types';
import { aggregateMonthlyClassStats, MonthlyClassTrend } from '../lib/runningUtils';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { BarChart3, TrendingUp, Layers, BarChart2, Award, Calendar } from 'lucide-react';

interface MonthlyClassChartProps {
  records: RunningRecord[];
}

const CLASS_COLORS: Record<string, { fill: string; stroke: string; label: string }> = {
  '1학년 1반': { fill: '#06b6d4', stroke: '#0891b2', label: '1학년 1반' },
  '1학년 2반': { fill: '#3b82f6', stroke: '#2563eb', label: '1학년 2반' },
  '2학년 1반': { fill: '#f59e0b', stroke: '#d97706', label: '2학년 1반' },
  '2학년 2반': { fill: '#a855f7', stroke: '#9333ea', label: '2학년 2반' },
};

export const MonthlyClassChart: React.FC<MonthlyClassChartProps> = ({ records }) => {
  const [chartMode, setChartMode] = useState<'grouped' | 'stacked'>('grouped');

  // 월별 학급 누적 데이터 산출
  const monthlyData: MonthlyClassTrend[] = useMemo(() => {
    return aggregateMonthlyClassStats(records);
  }, [records]);

  // 최다 달성 월 및 하이라이트 계산
  const highlights = useMemo(() => {
    if (monthlyData.length === 0) return null;

    let maxMonth = monthlyData[0];
    monthlyData.forEach((m) => {
      if (m.totalKm > maxMonth.totalKm) maxMonth = m;
    });

    const latestMonth = monthlyData[monthlyData.length - 1];
    const classes = ['1학년 1반', '1학년 2반', '2학년 1반', '2학년 2반'] as const;
    let leadingClass: (typeof classes)[number] = classes[0];
    let maxClassKm = latestMonth[classes[0]];

    classes.forEach((cls) => {
      if (latestMonth[cls] > maxClassKm) {
        maxClassKm = latestMonth[cls];
        leadingClass = cls;
      }
    });

    return {
      maxMonthLabel: maxMonth.fullMonthLabel,
      maxMonthKm: maxMonth.totalKm,
      latestMonthLabel: latestMonth.monthLabel,
      leadingClass,
      leadingClassKm: maxClassKm,
      totalMonths: monthlyData.length,
    };
  }, [monthlyData]);

  // 커스텀 툴팁
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const currentItem = monthlyData.find((d) => d.monthLabel === label);
      const total = currentItem ? currentItem.totalKm : 0;

      return (
        <div className="bg-slate-900/95 text-white p-4 rounded-2xl shadow-xl border border-slate-700/80 backdrop-blur-md text-xs min-w-[200px] z-50">
          <div className="flex items-center justify-between pb-2 border-b border-slate-700 mb-2">
            <span className="font-bold text-sm text-cyan-300">
              {currentItem?.fullMonthLabel || label}
            </span>
            <span className="text-[11px] text-slate-400">반별 누적</span>
          </div>

          <div className="space-y-1.5">
            {payload.map((entry: any, index: number) => {
              const km = Number(entry.value || 0);
              const percentage = total > 0 ? Math.round((km / total) * 100) : 0;

              return (
                <div key={`tooltip-item-${index}`} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-slate-300">{entry.name}:</span>
                  </div>
                  <div className="font-mono font-bold text-right">
                    <span className="text-white">{km} km</span>
                    {total > 0 && (
                      <span className="text-slate-400 text-[10px] ml-1.5 font-normal">
                        ({percentage}%)
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 mt-2 border-t border-slate-700 flex items-center justify-between text-xs font-black">
            <span className="text-slate-400">월간 총 합산</span>
            <span className="text-amber-400 font-mono text-sm">{total} km</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
      {/* 차트 상단 헤더 & 모드 전환 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-cyan-100 text-cyan-800 flex items-center justify-center shadow-xs">
              <BarChart3 className="w-5 h-5 text-cyan-700" />
            </div>
            <h3 className="text-xl font-black text-slate-900">
              반별 누적 거리 추이 (월별 막대 그래프)
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            신안해양과학고 1·2학년 학급별(학생 + 교사 기여) 월간 누적 러닝 거리 추이를 한눈에 비교합니다.
          </p>
        </div>

        {/* 차트 모드 토글 버튼 */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl self-start sm:self-center border border-slate-200/70">
          <button
            type="button"
            onClick={() => setChartMode('grouped')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              chartMode === 'grouped'
                ? 'bg-white text-blue-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5 text-cyan-600" />
            <span>학급별 비교</span>
          </button>
          <button
            type="button"
            onClick={() => setChartMode('stacked')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              chartMode === 'stacked'
                ? 'bg-white text-blue-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-cyan-600" />
            <span>누적 합산</span>
          </button>
        </div>
      </div>

      {/* 주요 통계 뱃지 카드 */}
      {highlights && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-cyan-600 text-white flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block font-medium">최다 러닝 월</span>
                <span className="text-xs font-black text-slate-800">
                  {highlights.maxMonthLabel}
                </span>
              </div>
            </div>
            <span className="text-sm font-black text-cyan-700 font-mono">
              {highlights.maxMonthKm} km
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block font-medium">
                  {highlights.latestMonthLabel} 선두 학급
                </span>
                <span className="text-xs font-black text-slate-800">
                  {highlights.leadingClass}
                </span>
              </div>
            </div>
            <span className="text-sm font-black text-amber-700 font-mono">
              {highlights.leadingClassKm} km
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100 flex items-center justify-between sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block font-medium">집계 대상 기간</span>
                <span className="text-xs font-black text-slate-800">
                  최근 {highlights.totalMonths}개월 데이터
                </span>
              </div>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-purple-100 text-purple-900 border border-purple-200">
              실시간 반영
            </span>
          </div>
        </div>
      )}

      {/* Recharts 시각화 본체 */}
      <div className="pt-2">
        {monthlyData.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-6 text-center">
            <BarChart3 className="w-10 h-10 mb-2 opacity-40" />
            <p className="font-bold text-sm text-slate-600">등록된 월별 러닝 데이터가 없습니다.</p>
            <p className="text-xs text-slate-400 mt-1">
              러닝 기록을 등록하면 반별 누적 거리 추이 그래프가 자동으로 생성됩니다.
            </p>
          </div>
        ) : (
          <div className="w-full h-80 sm:h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyData}
                margin={{ top: 15, right: 15, left: -10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="monthLabel"
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tick={{ fontWeight: 600 }}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `${val}km`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  wrapperStyle={{ paddingBottom: 16, fontSize: '12px', fontWeight: 600 }}
                />

                {/* 1학년 1반 */}
                <Bar
                  dataKey="1학년 1반"
                  name="1학년 1반"
                  fill={CLASS_COLORS['1학년 1반'].fill}
                  stackId={chartMode === 'stacked' ? 'classStack' : undefined}
                  radius={chartMode === 'stacked' ? [0, 0, 0, 0] : [6, 6, 0, 0]}
                  maxBarSize={50}
                />

                {/* 1학년 2반 */}
                <Bar
                  dataKey="1학년 2반"
                  name="1학년 2반"
                  fill={CLASS_COLORS['1학년 2반'].fill}
                  stackId={chartMode === 'stacked' ? 'classStack' : undefined}
                  radius={chartMode === 'stacked' ? [0, 0, 0, 0] : [6, 6, 0, 0]}
                  maxBarSize={50}
                />

                {/* 2학년 1반 */}
                <Bar
                  dataKey="2학년 1반"
                  name="2학년 1반"
                  fill={CLASS_COLORS['2학년 1반'].fill}
                  stackId={chartMode === 'stacked' ? 'classStack' : undefined}
                  radius={chartMode === 'stacked' ? [0, 0, 0, 0] : [6, 6, 0, 0]}
                  maxBarSize={50}
                />

                {/* 2학년 2반 */}
                <Bar
                  dataKey="2학년 2반"
                  name="2학년 2반"
                  fill={CLASS_COLORS['2학년 2반'].fill}
                  stackId={chartMode === 'stacked' ? 'classStack' : undefined}
                  radius={chartMode === 'stacked' ? [6, 6, 0, 0] : [6, 6, 0, 0]}
                  maxBarSize={50}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* 안내 범례 및 교사 기여 설명 */}
      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-slate-600">
        <div className="flex items-center gap-1.5 font-medium">
          <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
          <span>반별 누적 거리 = 학생 달리기 거리 + 교사 사제동행 기여 거리 합산치</span>
        </div>
        <div className="text-[11px] text-slate-400">
          단위: 킬로미터(km) · 매 기록 저장 시 즉시 갱신
        </div>
      </div>
    </div>
  );
};
