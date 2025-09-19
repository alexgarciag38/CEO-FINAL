import React, { useEffect, useState } from 'react';

const loaders: Record<string, () => Promise<any>> = {
  amazon_mx: () => import('@/utils/fees/mx/amazon.json'),
  meli_mx: () => import('@/utils/fees/mx/meli.json'),
  tiktok_mx: () => import('@/utils/fees/mx/tiktok.json'),
  shein_mx: () => import('@/utils/fees/mx/shein.json'),
};

function daysBetween(a: Date, b: Date): number {
  const diff = Math.abs(a.getTime() - b.getTime());
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export const StalenessBanner: React.FC<{ platform: string }> = ({ platform }) => {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        const data = (await loaders[platform]?.())?.default;
        if (data?.lastCheckedAt) {
          const d = new Date(data.lastCheckedAt);
          const age = daysBetween(d, new Date());
          if (age > 90) {
            setMessage(`Las tarifas de ${platform} tienen ${age} días. Revisa fuentes oficiales.`);
          } else {
            setMessage(null);
          }
        }
      } catch {}
    };
    run();
  }, [platform]);

  if (!message) return null;
  return (
    <div className="mb-2 p-2 bg-yellow-50 border border-yellow-200 text-yellow-800 text-xs rounded">
      {message}
    </div>
  );
};

export default StalenessBanner;




