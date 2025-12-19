'use client';

import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

type Props = {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
    tension?: number;
    fill?: boolean;
  }>;
  height?: number;
};

export function LineAreaChart({ labels, datasets, height }: Props) {
  const data = { labels, datasets };
  
  // Altura responsiva: menor no mobile
  const responsiveHeight = height || 320;
  
  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        display: true, 
        position: 'bottom',
        labels: { 
          boxWidth: 12,
          padding: 12,
          font: {
            size: 11
          },
          usePointStyle: true
        }
      },
      tooltip: { 
        mode: 'index', 
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: {
          size: 13
        },
        bodyFont: {
          size: 12
        },
        cornerRadius: 8
      },
    },
    interaction: { mode: 'nearest', intersect: false },
    scales: {
      x: { 
        grid: { display: false },
        ticks: {
          font: {
            size: 11
          },
          maxRotation: 45,
          minRotation: 0
        }
      },
      y: { 
        grid: { color: 'rgba(0,0,0,0.06)' }, 
        beginAtZero: true, 
        suggestedMax: 100,
        ticks: {
          font: {
            size: 11
          }
        }
      },
    },
    elements: { 
      point: { 
        radius: 0, 
        hoverRadius: 5,
        hitRadius: 10
      }, 
      line: { borderWidth: 2.5 } 
    },
  };

  return (
    <div className="w-full" style={{ height: responsiveHeight }}>
      <Line data={data} options={options} />
    </div>
  );
}