export interface PinData {
  pin: string;
  c_temperature: number;
  f_temperature: number;
  timestamp?: number;
}

export interface DeviceData {
  device_id: string;
  pins: PinData[];
}

export interface HistoricalData {
  [deviceId: string]: {
    [pin: string]: {
      timestamps: number[];
      temperatures: number[];
    };
  };
}