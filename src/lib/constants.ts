
export const TEXT_PRESETS = {
    title: {
        textStyle: { fontSize: 64, fontWeight: 'bold' as const, align: 'center' as const, lineHeight: 1.1 },
        layout: { x: 50, y: 50 } // Center
    },
    subtitle: {
        textStyle: { fontSize: 36, fontWeight: 'medium' as const, align: 'center' as const, lineHeight: 1.2 },
        layout: { x: 50, y: 80 } // Bottom Center
    },
    lowerThird: {
        textStyle: { fontSize: 24, fontWeight: 'semibold' as const, align: 'left' as const, lineHeight: 1.2 },
        layout: { x: 10, y: 90 } // Bottom Left
    },
    body: {
        textStyle: { fontSize: 18, fontWeight: 'normal' as const, align: 'left' as const, lineHeight: 1.4 },
        layout: { x: 50, y: 50 }
    }
};

export const TEXT_COLORS = [
    '#FFFFFF', '#000000', '#FF5733', '#33FF57', '#3357FF', '#F1C40F', '#9B59B6', '#E74C3C'
];
