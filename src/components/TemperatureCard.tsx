import React from 'react';
import { LineChart } from './LineChart';
import { PinData } from '../types/sensor';
import { Thermometer } from 'lucide-react';

interface TemperatureCardProps {
  deviceId: string;
  pinData: PinData;
  historicalData: number[];
  timestamps: number[];
}

export const TemperatureCard: React.FC<TemperatureCardProps> = ({
  deviceId,
  pinData,
  historicalData,
  timestamps,
}) => {
  return (
    <div className="bg-white shadow-lg rounded-lg p-6 hover:shadow-xl transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Thermometer className="w-6 h-6 text-blue-500" />
          <h2 className="text-xl font-bold text-gray-800">Sensor {pinData.pin}</h2>
        </div>
        <span className="text-sm text-gray-500">Device ID: {deviceId}</span>
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <div className="text-3xl font-bold text-blue-600">
            {pinData.c_temperature.toFixed(1)}°C
          </div>
          <div className="text-2xl text-gray-600">
            {pinData.f_temperature.toFixed(1)}°F
          </div>
        </div>
        
        <div className="h-[200px]">
          <LineChart
            data={historicalData}
            labels={timestamps}
            label={`Temperature History - Sensor ${pinData.pin}`}
          />
        </div>
      </div>

      <div className="text-sm text-gray-500">
        Last updated: {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
};