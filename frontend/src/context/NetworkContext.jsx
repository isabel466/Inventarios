import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db.js';
import {
  sincronizarVentasPendientes,
  sincronizarProductosPendientes,
  setSimulatedNetworkStatus,
  getIsOnline,
  initSyncListeners
} from '../services/syncService.js';
const NetworkContext = createContext();

export const NetworkProvider = ({ children }) => {
  const [realOnline, setRealOnline] = useState(navigator.onLine);
  const [simulationMode, setSimulationMode] = useState('auto'); // 'auto', 'force_online', 'force_offline'
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [notificationPermission, setNotificationPermission] = useState('default');

  // Reactividad con IndexedDB: contar ventas pendientes (syncStatus === 0)
  const pendingSalesCount = useLiveQuery(
    () => db.ventas.where('syncStatus').equals(0).count(),
    []
  ) ?? 0;

  const currentOnlineState = getIsOnline();


useEffect(() => {
  if ('Notification' in window) {
    setNotificationPermission(Notification.permission);
  }

  // Mantener los eventos online/offline existentes.
  const cleanup = initSyncListeners((onlineStatus) => {
    setRealOnline(onlineStatus);
  });

  // Revisar productos pendientes al iniciar la aplicación.
  // No sincroniza ventas ni ajustes de stock.
  const verificarProductosPendientes = async () => {
    if (!navigator.onLine || !getIsOnline()) {
      console.log('Sin conexión: productos pendientes conservados.');
      return;
    }

    try {
      const resultado = await sincronizarProductosPendientes();

      console.log(
        'Verificación inicial de productos:',
        resultado
      );
    } catch (error) {
      console.error(
        'Error verificando productos pendientes:',
        error
      );
    }
  };

  verificarProductosPendientes();

  return cleanup;
}, []);


  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const perm = await Notification.requestPermission();
      setNotificationPermission(perm);
      return perm;
    }
    return 'denied';
  };

  const handleToggleSimulation = async (mode) => {
    setSimulationMode(mode);
    if (mode === 'auto') {
      setSimulatedNetworkStatus(null);
    } else if (mode === 'force_online') {
      setSimulatedNetworkStatus(true);
      // Forzar sync al pasar a online simulado
      await triggerManualSync();
    } else if (mode === 'force_offline') {
      setSimulatedNetworkStatus(false);
    }
  };

  const triggerManualSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const res = await sincronizarVentasPendientes();
      setLastSyncTime(new Date());
      return res;
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <NetworkContext.Provider
      value={{
        isOnline: currentOnlineState,
        realOnline,
        simulationMode,
        setSimulationMode: handleToggleSimulation,
        pendingSalesCount,
        isSyncing,
        lastSyncTime,
        triggerManualSync,
        notificationPermission,
        requestNotificationPermission
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = () => useContext(NetworkContext);
