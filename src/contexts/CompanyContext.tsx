import React, { createContext, useContext, useEffect, useState } from 'react';

type CompanyId = '4C' | 'MANUCAR';

interface CompanyContextValue {
  companyId: CompanyId;
  setCompanyId: (id: CompanyId) => void;
}

const CompanyContext = createContext<CompanyContextValue | undefined>(undefined);

export const CompanyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [companyId, setCompanyIdState] = useState<CompanyId>(() => {
    const v = localStorage.getItem('company_id');
    return (v === '4C' || v === 'MANUCAR') ? v : '4C';
  });

  const setCompanyId = (id: CompanyId) => {
    setCompanyIdState(id);
    localStorage.setItem('company_id', id);
  };

  useEffect(() => {
    const v = localStorage.getItem('company_id');
    if (v && (v === '4C' || v === 'MANUCAR')) setCompanyIdState(v);
  }, []);

  return (
    <CompanyContext.Provider value={{ companyId, setCompanyId }}>
      {children}
    </CompanyContext.Provider>
  );
};

export function useCompany() {
  const ctx = useContext(CompanyContext);
  if (!ctx) throw new Error('useCompany must be used within CompanyProvider');
  return ctx;
}


