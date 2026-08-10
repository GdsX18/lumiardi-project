'use client';

import React, { useState } from 'react';
import { ResidentialAddress } from '@/types';
import { useLanguage } from '@/context/LanguageContext';

interface LocationSelectorProps {
  value: ResidentialAddress;
  onChange: (value: ResidentialAddress) => void;
  required?: boolean;
}

const COUNTRIES = [
  'Brasil',
  'Estados Unidos',
  'França',
  'Itália',
  'Espanha',
  'Reino Unido',
  'Portugal',
  'Alemanha',
  'Suíça',
  'Emirados Árabes Unidos',
  'Outro',
];

const BRAZIL_STATES = [
  { uf: 'AC', name: 'Acre' },
  { uf: 'AL', name: 'Alagoas' },
  { uf: 'AP', name: 'Amapá' },
  { uf: 'AM', name: 'Amazonas' },
  { uf: 'BA', name: 'Bahia' },
  { uf: 'CE', name: 'Ceará' },
  { uf: 'DF', name: 'Distrito Federal' },
  { uf: 'ES', name: 'Espírito Santo' },
  { uf: 'GO', name: 'Goiás' },
  { uf: 'MA', name: 'Maranhão' },
  { uf: 'MT', name: 'Mato Grosso' },
  { uf: 'MS', name: 'Mato Grosso do Sul' },
  { uf: 'MG', name: 'Minas Gerais' },
  { uf: 'PA', name: 'Pará' },
  { uf: 'PB', name: 'Paraíba' },
  { uf: 'PR', name: 'Paraná' },
  { uf: 'PE', name: 'Pernambuco' },
  { uf: 'PI', name: 'Piauí' },
  { uf: 'RJ', name: 'Rio de Janeiro' },
  { uf: 'RN', name: 'Rio Grande do Norte' },
  { uf: 'RS', name: 'Rio Grande do Sul' },
  { uf: 'RO', name: 'Rondônia' },
  { uf: 'RR', name: 'Roraima' },
  { uf: 'SC', name: 'Santa Catarina' },
  { uf: 'SP', name: 'São Paulo' },
  { uf: 'SE', name: 'Sergipe' },
  { uf: 'TO', name: 'Tocantins' },
];

export const LocationSelector: React.FC<LocationSelectorProps> = ({
  value,
  onChange,
  required = true,
}) => {
  const { t } = useLanguage();
  const [isBrazil, setIsBrazil] = useState(value.country === 'Brasil' || !value.country);

  const handleCountryChange = (country: string) => {
    const isBr = country === 'Brasil';
    setIsBrazil(isBr);
    onChange({
      country,
      state: isBr ? 'SP' : '',
      city: '',
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-sans">
        {/* País */}
        <div>
          <label className="block text-[#0B0B0B]/80 font-medium mb-1 uppercase tracking-wider">
            {t('loc_country_label')} {required && '*'}
          </label>
          <select
            value={value.country || 'Brasil'}
            onChange={(e) => handleCountryChange(e.target.value)}
            className="w-full px-4 py-3 border border-[#0B0B0B]/20 focus:outline-none focus:border-[#C9A96B] bg-[#FAF7F2] text-[#0B0B0B]"
            required={required}
          >
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>
                {c === 'Outro' ? t('gender_other') : c}
              </option>
            ))}
          </select>
        </div>

        {/* Estado / Província */}
        <div>
          <label className="block text-[#0B0B0B]/80 font-medium mb-1 uppercase tracking-wider">
            {isBrazil ? t('loc_state_brazil') : t('loc_state_intl')} {required && '*'}
          </label>
          {isBrazil ? (
            <select
              value={value.state || 'SP'}
              onChange={(e) => onChange({ ...value, state: e.target.value })}
              className="w-full px-4 py-3 border border-[#0B0B0B]/20 focus:outline-none focus:border-[#C9A96B] bg-[#FAF7F2] text-[#0B0B0B]"
              required={required}
            >
              {BRAZIL_STATES.map((st) => (
                <option key={st.uf} value={st.uf}>
                  {st.name} ({st.uf})
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              placeholder={t('loc_state_placeholder')}
              value={value.state || ''}
              onChange={(e) => onChange({ ...value, state: e.target.value })}
              className="w-full px-4 py-3 border border-[#0B0B0B]/20 focus:outline-none focus:border-[#C9A96B] bg-[#FAF7F2] text-[#0B0B0B]"
              required={required}
            />
          )}
        </div>

        {/* Cidade */}
        <div>
          <label className="block text-[#0B0B0B]/80 font-medium mb-1 uppercase tracking-wider">
            {t('loc_city_label')} {required && '*'}
          </label>
          <input
            type="text"
            placeholder={isBrazil ? t('loc_city_placeholder_br') : t('loc_city_placeholder_intl')}
            value={value.city || ''}
            onChange={(e) => onChange({ ...value, city: e.target.value })}
            className="w-full px-4 py-3 border border-[#0B0B0B]/20 focus:outline-none focus:border-[#C9A96B] bg-[#FAF7F2] text-[#0B0B0B]"
            required={required}
          />
        </div>
      </div>
    </div>
  );
};
