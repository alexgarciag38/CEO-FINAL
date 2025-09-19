import React from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface Props {
  netDes: number;
  netReal: number;
  netOpt: number;
}

const GraficoComparativoEscenarios: React.FC<Props> = ({ netDes, netReal, netOpt }) => {
  const data = {
    labels: ['Desfavorable', 'Realista', 'Óptimo'],
    datasets: [
      {
        label: 'Ganancia neta mensual',
        data: [netDes, netReal, netOpt],
        backgroundColor: ['#FB923C', '#60A5FA', '#34D399'],
        borderRadius: 6
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: false }
    },
    scales: {
      x: {
        ticks: { color: '#334155' },
        grid: { display: false }
      },
      y: {
        ticks: { color: '#334155' },
        grid: { color: 'rgba(209,213,219,0.4)' }
      }
    }
  } as const;

  return <Bar data={data} options={options} />;
};

export default GraficoComparativoEscenarios;
