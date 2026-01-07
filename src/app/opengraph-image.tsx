import { ImageResponse } from 'next/og';

// Image metadata
export const alt = 'Merkel Vision - Location Management Platform';
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

// Image generation
export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 128,
          background: 'linear-gradient(to bottom right, #4f46e5, #7c3aed)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontFamily: 'system-ui',
        }}
      >
        <div style={{ fontSize: 80, fontWeight: 'bold', marginBottom: 20 }}>
          📍 Merkel Vision
        </div>
        <div
          style={{
            fontSize: 40,
            fontWeight: 'normal',
            opacity: 0.9,
          }}
        >
          Professional Location Management
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
