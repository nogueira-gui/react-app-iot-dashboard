import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { TemperatureCard } from './TemperatureCard';
import { DeviceData, HistoricalData } from '../types/sensor';
import { Gauge } from 'lucide-react';

const MAX_HISTORY_POINTS = 20;
const WEBSOCKET_URL = 'http://localhost:5000';

export const Dashboard: React.FC = () => {
  const [devices, setDevices] = useState<DeviceData[]>([]);
  const [historicalData, setHistoricalData] = useState<HistoricalData>({});
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected'>('disconnected');

  useEffect(() => {
    const socket = io(WEBSOCKET_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });

    const loadInitialData = async () => {
      try {
        const response = await fetch(`${WEBSOCKET_URL}/cache`);
        const cache = await response.json();

        // Processar dados do cache
        setHistoricalData(
          Object.entries(cache).reduce((acc, [deviceId, pins]) => {
            acc[deviceId] = Object.entries(pins).reduce((pinsAcc, [pin, data]) => {
              pinsAcc[pin] = {
                timestamps: data.map((item: any) => item.timestamp),
                temperatures: data.map((item: any) => item.c_temperature),
              };
              return pinsAcc;
            }, {} as HistoricalData[string]);
            return acc;
          }, {} as HistoricalData)
        );

        const initialDevices: DeviceData[] = Object.entries(cache).map(([device_id, pins]) => ({
          device_id,
          pins: Object.entries(pins).map(([pin, data]: [string, any]) => ({
            pin,
            c_temperature: data[data.length - 1]?.c_temperature ?? 0,
            f_temperature: data[data.length - 1]?.f_temperature ?? 0,
          })),
        }));
        setDevices(initialDevices);
      } catch (error) {
        console.error('Error loading initial data:', error);
      }
    };

    socket.on('connect', () => {
      console.log('Connected to WebSocket server');
      setConnectionStatus('connected');
      loadInitialData();
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
      setConnectionStatus('disconnected');
    });

    socket.on('new_message', (data: { message: DeviceData }) => {
      const { message } = data;

      setDevices((prevDevices) => {
        const existingDevice = prevDevices.find((d) => d.device_id === message.device_id);
        if (existingDevice) {
          existingDevice.pins = message.pins;
          return [...prevDevices];
        }
        return [...prevDevices, message];
      });

      // Atualizar dados históricos
      message.pins.forEach((pinData) => {
        const deviceId = message.device_id;
        const pin = pinData.pin;

        setHistoricalData((prev) => {
          const newData = { ...prev };
          if (!newData[deviceId]) {
            newData[deviceId] = {};
          }
          if (!newData[deviceId][pin]) {
            newData[deviceId][pin] = {
              timestamps: [],
              temperatures: [],
            };
          }
          const timestamps = [...newData[deviceId][pin].timestamps, pinData.timestamp];
          const temperatures = [...newData[deviceId][pin].temperatures, pinData.c_temperature];

          if (timestamps.length > MAX_HISTORY_POINTS) {
            timestamps.shift();
            temperatures.shift();
          }

          newData[deviceId][pin] = {
            timestamps,
            temperatures,
          };

          return newData;
        });
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <Gauge className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-800">Temperature Monitoring Dashboard</h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  connectionStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'
                }`}
              />
              <span className="text-sm text-gray-600">
                {connectionStatus === 'connected' ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <div className="text-sm text-gray-500">Last Update: {new Date().toLocaleString()}</div>
          </div>
        </div>

        {devices.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">Waiting for sensor data...</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {devices.map((device) =>
            device.pins.map((pinData) => (
              <TemperatureCard
                key={`${device.device_id}-${pinData.pin}`}
                deviceId={device.device_id}
                pinData={pinData}
                historicalData={historicalData[device.device_id]?.[pinData.pin]?.temperatures ?? []}
                timestamps={historicalData[device.device_id]?.[pinData.pin]?.timestamps ?? []}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};
