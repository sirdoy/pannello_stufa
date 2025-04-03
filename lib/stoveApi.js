export const API_KEY = 'bdb58f63-117e-4753-bb0f-0487f2f14e52';

const base = 'https://wsthermorossi.cloudwinet.it/WiNetStove.svc/json';

export const STUFA_API = {
  ignite: `${base}/Ignit/${API_KEY}`,
  shutdown: `${base}/Shutdown/${API_KEY}`,
  getFan: `${base}/GetFanLevel/${API_KEY}`,
  getPower: `${base}/GetPower/${API_KEY}`,
  setFan: (level) => `${base}/SetFanLevel/${API_KEY};${level}`,
  setPower: (level) => `${base}/SetPower/${API_KEY};${level}`,
};
