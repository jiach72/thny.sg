module.exports = {
    content: [
        "./index.html",
        "./src/**/*.{vue,js,ts,jsx,tsx}",
    ],
    corePlugins: {
        preflight: false, // Disable preflight to avoid Element Plus conflicts
    },
    theme: {
        extend: {
            colors: {
                // Quiet Luxury Palette - Refined (Warmer, Lighter Dark)
                obsidian: '#151923', // Lighter than pure black, rich charcoal
                wealth: '#D6B56E',   // Muted gold
                glass: '#1E2433',    // Surface lighter than bg
                primary: 'var(--el-color-primary)', // Sync with Element Plus
                text: {
                    DEFAULT: '#E2E8F0', // Soft White (not harsh #FFF)
                    muted: '#94A3B8',
                    secondary: '#64748B'
                }
            },
            fontFamily: {
                serif: ['Playfair Display', 'serif'],
                sans: ['Montserrat', 'sans-serif'],
            },
            backgroundImage: {
                'noise': "url('https://grainy-gradients.vercel.app/noise.svg')", // Subtle texture
            }
        },
    },
    plugins: [],
}
