'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type PerformanceMode = 'efficiency' | 'balanced' | 'quality';

interface PerformanceMetrics {
    lastExportTime: number | null;
    memoryWarning: boolean;
    fps: number;
}

interface PerformanceContextType {
    mode: PerformanceMode;
    setMode: (mode: PerformanceMode) => void;
    metrics: PerformanceMetrics;
    updateMetrics: (newMetrics: Partial<PerformanceMetrics>) => void;
    settings: {
        waveformQuality: 'low' | 'high';
        useProxy: boolean;
        parallelRendering: boolean;
    };
}

const PerformanceContext = createContext<PerformanceContextType | undefined>(undefined);

export function PerformanceProvider({ children }: { children: React.ReactNode }) {
    const [mode, setMode] = useState<PerformanceMode>('balanced');
    const [metrics, setMetrics] = useState<PerformanceMetrics>({
        lastExportTime: null,
        memoryWarning: false,
        fps: 0,
    });

    // Derived settings based on mode
    const settings = {
        waveformQuality: mode === 'efficiency' ? 'low' : 'high' as 'low' | 'high',
        useProxy: true,
        parallelRendering: mode !== 'quality', // Quality mode might strictly enforce sequential for stability
    };

    const updateMetrics = (newMetrics: Partial<PerformanceMetrics>) => {
        setMetrics(prev => ({ ...prev, ...newMetrics }));
    };

    // Auto-detect low-end devices could go here
    useEffect(() => {
        if (typeof navigator !== 'undefined' && 'hardwareConcurrency' in navigator) {
            const cores = navigator.hardwareConcurrency;
            if (cores <= 4) setMode('efficiency');
        }
    }, []);

    return (
        <PerformanceContext.Provider value={{ mode, setMode, metrics, updateMetrics, settings }}>
            {children}
        </PerformanceContext.Provider>
    );
}

export function usePerformance() {
    const context = useContext(PerformanceContext);
    if (context === undefined) {
        throw new Error('usePerformance must be used within a PerformanceProvider');
    }
    return context;
}
