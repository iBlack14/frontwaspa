'use client';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import type { ChartOptions } from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
);

interface ChartComponentProps {
  data: any;
  options: ChartOptions<'line'>;
}

export default function ChartComponent({ data, options }: ChartComponentProps) {
  return (
    <div className="relative w-full max-w-4xl mx-auto h-[500px] box-border overflow-x-auto">
      <Line data={data} options={options} />
    </div>
  );
}
