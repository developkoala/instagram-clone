/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 먹스타그램 브랜드 색상
        muksta: {
          orange: '#FF6B35',       // 메인 오렌지 - 식욕 자극
          red: '#E63946',          // 포인트 레드 - 매운맛
          yellow: '#FCA311',       // 황금빛 - 구운 요리
          green: '#06BA63',        // 신선한 야채
          brown: '#8B4513',        // 구운 빵, 커피
          cream: '#FFF8E7',        // 크림색 배경
          dark: '#2D3436',         // 다크 텍스트
          gray: '#636E72',         // 보조 텍스트
          lightGray: '#F5F3F0',    // 연한 배경
          white: '#FFFFFF',        // 흰색
          border: '#E8E3DD',       // 테두리
        },
        // 기존 instagram 색상 매핑 (호환성)
        instagram: {
          primary: '#FF6B35',      // orange로 대체
          secondary: '#FFFFFF',
          accent: '#FF6B35',       // orange로 대체  
          background: '#FFF8E7',   // cream으로 대체
          border: '#E8E3DD',
          text: '#2D3436',         // dark로 대체
          textSecondary: '#636E72', // gray로 대체
          error: '#E63946',        // red로 대체
          success: '#06BA63',      // green으로 대체
          warning: '#FCA311',      // yellow로 대체
          link: '#8B4513',         // brown으로 대체
          lightGray: '#F5F3F0',
        }
      },
      fontFamily: {
        sans: ['Pretendard', 'Noto Sans KR', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        'xl': '16px',
        '2xl': '20px',
      },
      boxShadow: {
        'card': '0 2px 8px rgba(0, 0, 0, 0.08)',
        'card-hover': '0 4px 16px rgba(0, 0, 0, 0.12)',
        'muksta': '0 3px 10px rgba(255, 107, 53, 0.15)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'like': 'like 0.4s ease-in-out',
        'bounce-slow': 'bounce 2s infinite',
        'wiggle': 'wiggle 0.3s ease-in-out',
        'pulse-slow': 'pulse 3s infinite',
        'spin-slow': 'spin 3s linear infinite',
        'plate-spin': 'plateSpin 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        like: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.2)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        plateSpin: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
    },
  },
  plugins: [],
}