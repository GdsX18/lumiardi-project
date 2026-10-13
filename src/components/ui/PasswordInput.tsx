'use client';

import React, { useState } from 'react';
import { Eye, EyeOff, Check, X } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { cn } from '@/lib/utils';
import { getPasswordIssues, PASSWORD_CHECKLIST, PasswordRequirement } from '@/lib/passwordPolicy';

type Tone = 'dark' | 'light';

interface PasswordInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** dark: portal/login (fundo preto, dourado); light: formulários de qualificação (marfim) */
  tone?: Tone;
  /** Ícone decorativo à esquerda (já posicionado com `absolute` pelo chamador) */
  leftIcon?: React.ReactNode;
  wrapperClassName?: string;
}

/** Campo de senha com botão de mostrar/ocultar (olhinho). */
export function PasswordInput({ tone = 'dark', leftIcon, wrapperClassName, className, ...props }: PasswordInputProps) {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);
  const label = visible ? t('pwd_hide') : t('pwd_show');

  return (
    <div className={cn('relative', wrapperClassName)}>
      {leftIcon}
      <input
        {...props}
        type={visible ? 'text' : 'password'}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        className={cn(className, 'pr-10')}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={label}
        aria-pressed={visible}
        title={label}
        className={cn(
          'absolute right-3 top-1/2 -translate-y-1/2 p-0.5 cursor-pointer transition-colors focus:outline-none focus-visible:ring-1',
          tone === 'dark'
            ? 'text-ivory/40 hover:text-gold focus-visible:ring-gold'
            : 'text-[#0B0B0B]/40 hover:text-[#8C6B2F] focus-visible:ring-[#C9A96B]'
        )}
      >
        {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

const REQUIREMENT_KEYS: Record<PasswordRequirement, string> = {
  min_length: 'pwd_rule_min_length',
  max_length: 'pwd_rule_max_length',
  letter: 'pwd_rule_letter',
  number: 'pwd_rule_number',
};

/** Checklist ao vivo da política de senha (mesma regra validada pelo servidor). */
export function PasswordRequirements({ password, tone = 'dark' }: { password: string; tone?: Tone }) {
  const { t } = useLanguage();
  const issues = getPasswordIssues(password);
  const rules: PasswordRequirement[] = issues.includes('max_length') ? [...PASSWORD_CHECKLIST, 'max_length'] : PASSWORD_CHECKLIST;
  const pending = tone === 'dark' ? 'text-ivory/50' : 'text-[#0B0B0B]/50';
  const ok = tone === 'dark' ? 'text-emerald-400' : 'text-emerald-700';

  return (
    <ul className="mt-2 space-y-1 text-[11px] font-sans" aria-live="polite">
      {rules.map((rule) => {
        const met = !issues.includes(rule);
        return (
          <li key={rule} className={cn('flex items-center gap-1.5', met ? ok : pending)}>
            {met ? <Check className="w-3 h-3 shrink-0" /> : <X className="w-3 h-3 shrink-0" />}
            <span>{t(REQUIREMENT_KEYS[rule])}</span>
          </li>
        );
      })}
    </ul>
  );
}
