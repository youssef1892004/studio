export const getEnv = (key: string) => {
    if (typeof window !== 'undefined' && (window as any).__ENV) {
        return (window as any).__ENV[key];
    }
    return process.env[key];
};
