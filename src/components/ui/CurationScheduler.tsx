'use client';

import React, { useState } from 'react';
import { Calendar as CalendarIcon, Clock, CheckCircle2, ShieldCheck } from 'lucide-react';
import { CurationAppointment } from '@/types';
import { useLanguage } from '@/context/LanguageContext';

interface CurationSchedulerProps {
  onScheduleChange: (appointment: CurationAppointment) => void;
  selectedAppointment?: CurationAppointment;
  userType?: 'criadora' | 'agencia';
}

const MORNING_SLOTS = ['09:00', '10:00', '11:00', '11:30'];
const AFTERNOON_SLOTS = ['14:00', '15:00', '16:00', '17:00'];
const EVENING_SLOTS = ['18:30', '19:30', '20:30'];

export const CurationScheduler: React.FC<CurationSchedulerProps> = ({
  onScheduleChange,
  selectedAppointment,
  userType = 'criadora',
}) => {
  const { t } = useLanguage();

  // Gera os próximos 7 dias úteis a partir de amanhã
  const getNextDays = () => {
    const days: { dateStr: string; displayDay: string; displayMonth: string; weekDay: string }[] = [];
    const now = new Date();
    let count = 0;
    let offset = 1;

    const weekDaysMap = [
      t('day_sun'),
      t('day_mon'),
      t('day_tue'),
      t('day_wed'),
      t('day_thu'),
      t('day_fri'),
      t('day_sat'),
    ];

    const monthsMap = [
      t('month_jan'),
      t('month_feb'),
      t('month_mar'),
      t('month_apr'),
      t('month_may'),
      t('month_jun'),
      t('month_jul'),
      t('month_ago'),
      t('month_set'),
      t('month_out'),
      t('month_nov'),
      t('month_dez'),
    ];

    while (count < 6) {
      const d = new Date(now);
      d.setDate(now.getDate() + offset);
      // Ignora domingos para reuniões de curadoria
      if (d.getDay() !== 0) {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        days.push({
          dateStr: `${year}-${month}-${day}`,
          displayDay: String(d.getDate()),
          displayMonth: monthsMap[d.getMonth()],
          weekDay: weekDaysMap[d.getDay()],
        });
        count++;
      }
      offset++;
    }
    return days;
  };

  const availableDays = getNextDays();
  const [selectedDate, setSelectedDate] = useState<string>(
    selectedAppointment?.date || availableDays[0]?.dateStr || ''
  );
  const [selectedSlot, setSelectedSlot] = useState<string>(
    selectedAppointment?.timeSlot || '15:00'
  );

  const handleSelect = (date: string, slot: string) => {
    setSelectedDate(date);
    setSelectedSlot(slot);
    onScheduleChange({
      date,
      timeSlot: slot,
      status: 'scheduled',
      notes: `Curadoria agendada para ${userType}`,
    });
  };

  return (
    <div className="bg-white border border-[#0B0B0B]/10 p-6 md:p-10 shadow-xl space-y-8">
      {/* Header do Agendador */}
      <div className="border-b border-[#0B0B0B]/10 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-[#8C6B2F] font-sans font-semibold mb-1">
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>{t('sched_badge')}</span>
          </div>
          <h3 className="font-serif-lumiardi text-2xl md:text-3xl font-light text-[#0B0B0B]">
            {t('sched_title')}
          </h3>
          <p className="text-xs text-[#0B0B0B]/70 font-sans mt-1">
            {t('sched_desc')}
          </p>
        </div>

        <div className="flex items-center gap-2 p-3 bg-[#FAF7F2] border border-[#C9A96B]/30 shrink-0">
          <ShieldCheck className="w-5 h-5 text-[#8C6B2F]" />
          <span className="text-[11px] text-[#0B0B0B]/80 font-sans">
            {t('sched_encrypted_badge')}
          </span>
        </div>
      </div>

      {/* 1. Seleção de Dias */}
      <div className="space-y-3">
        <label className="block text-xs font-sans uppercase tracking-wider font-semibold text-[#0B0B0B]/80 flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-[#8C6B2F]" />
          <span>{t('sched_select_date_label')}</span>
        </label>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {availableDays.map((d) => {
            const isSelected = selectedDate === d.dateStr;
            return (
              <button
                key={d.dateStr}
                type="button"
                onClick={() => handleSelect(d.dateStr, selectedSlot)}
                className={`p-3.5 text-center border transition-all duration-300 cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                  isSelected
                    ? 'border-[#C9A96B] bg-[#0B0B0B] text-ivory shadow-md scale-105'
                    : 'border-[#0B0B0B]/15 bg-[#FAF7F2] text-[#0B0B0B]/80 hover:border-[#C9A96B] hover:bg-white'
                }`}
              >
                <span className={`text-[10px] uppercase tracking-wider font-sans ${isSelected ? 'text-[#C9A96B]' : 'text-[#0B0B0B]/50'}`}>
                  {d.weekDay}
                </span>
                <span className="font-serif-lumiardi text-2xl font-light">
                  {d.displayDay}
                </span>
                <span className="text-[10px] uppercase tracking-widest font-sans opacity-70">
                  {d.displayMonth}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Seleção de Slots de Horários */}
      <div className="space-y-4 pt-2">
        <label className="block text-xs font-sans uppercase tracking-wider font-semibold text-[#0B0B0B]/80 flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#8C6B2F]" />
          <span>{t('sched_select_time_label')}</span>
        </label>

        <div className="space-y-4">
          {/* Manhã */}
          <div>
            <span className="text-[11px] font-sans uppercase tracking-wider text-[#8C6B2F] font-semibold block mb-2">
              {t('sched_morning_period')}
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {MORNING_SLOTS.map((slot) => {
                const isSelected = selectedSlot === slot;
                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => handleSelect(selectedDate, slot)}
                    className={`py-2.5 px-4 text-xs font-sans tracking-wider transition-all duration-200 border cursor-pointer ${
                      isSelected
                        ? 'bg-[#C9A96B] text-[#0B0B0B] font-bold border-[#C9A96B] shadow-sm'
                        : 'bg-[#FAF7F2] text-[#0B0B0B]/80 border-[#0B0B0B]/10 hover:border-[#C9A96B] hover:bg-white'
                    }`}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tarde */}
          <div>
            <span className="text-[11px] font-sans uppercase tracking-wider text-[#8C6B2F] font-semibold block mb-2">
              {t('sched_afternoon_period')}
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {AFTERNOON_SLOTS.map((slot) => {
                const isSelected = selectedSlot === slot;
                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => handleSelect(selectedDate, slot)}
                    className={`py-2.5 px-4 text-xs font-sans tracking-wider transition-all duration-200 border cursor-pointer ${
                      isSelected
                        ? 'bg-[#C9A96B] text-[#0B0B0B] font-bold border-[#C9A96B] shadow-sm'
                        : 'bg-[#FAF7F2] text-[#0B0B0B]/80 border-[#0B0B0B]/10 hover:border-[#C9A96B] hover:bg-white'
                    }`}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Noite */}
          <div>
            <span className="text-[11px] font-sans uppercase tracking-wider text-[#8C6B2F] font-semibold block mb-2">
              {t('sched_evening_period')}
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {EVENING_SLOTS.map((slot) => {
                const isSelected = selectedSlot === slot;
                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => handleSelect(selectedDate, slot)}
                    className={`py-2.5 px-4 text-xs font-sans tracking-wider transition-all duration-200 border cursor-pointer ${
                      isSelected
                        ? 'bg-[#C9A96B] text-[#0B0B0B] font-bold border-[#C9A96B] shadow-sm'
                        : 'bg-[#FAF7F2] text-[#0B0B0B]/80 border-[#0B0B0B]/10 hover:border-[#C9A96B] hover:bg-white'
                    }`}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Resumo do Agendamento Escolhido */}
      {selectedDate && selectedSlot && (
        <div className="p-4 bg-[#FAF7F2] border border-[#C9A96B]/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#C9A96B]/20 text-[#8C6B2F] rounded-full">
              <CheckCircle2 className="w-5 h-5 stroke-[1.5]" />
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wider text-[#8C6B2F] font-sans font-semibold block">
                {t('sched_selected_summary_label')}
              </span>
              <span className="font-serif-lumiardi text-lg text-[#0B0B0B]">
                {selectedDate.split('-').reverse().join('/')} às {selectedSlot} {t('sched_selected_summary_tz')}
              </span>
            </div>
          </div>
          <span className="text-[10px] uppercase tracking-widest text-[#0B0B0B]/60 font-sans hidden sm:inline">
            {t('sched_email_link_note')}
          </span>
        </div>
      )}
    </div>
  );
};
