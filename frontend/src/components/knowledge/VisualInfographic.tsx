import React, { useState } from 'react';
import * as Icons from 'lucide-react';

interface Stat {
  label: string;
  value: string;
  unit?: string;
}

interface Section {
  title: string;
  content: string;
  icon_hint?: string;
}

interface VisualInfographicProps {
  data: {
    main_title: string;
    intro: string;
    stats: Stat[];
    sections: Section[];
    unsplash_query?: string;
  };
  imageUrl: string;
}

const VisualInfographic: React.FC<VisualInfographicProps> = ({ data, imageUrl }) => {
  const [imgError, setImgError] = useState(false);
  
  // Use a nice fallback gradient if image fails
  const fallbackBg = 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)';

  return (
    <div style={{
      width: '100%',
      backgroundColor: 'var(--gpt-bg)',
      borderRadius: '1.25rem',
      overflow: 'hidden',
      border: '1px solid var(--gpt-border)',
      boxShadow: '0 10px 30px -10px rgba(0,0,0,0.3)',
      margin: '1.5rem 0',
      fontFamily: "'Inter', sans-serif"
    }}>
      {/* Header with Background Image */}
      <div style={{
        height: '240px',
        width: '100%',
        position: 'relative',
        backgroundColor: '#1e293b',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        overflow: 'hidden'
      }}>
        {!imgError ? (
          <img 
            src={imageUrl} 
            alt="Infographic Background"
            onError={() => setImgError(true)}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              zIndex: 0
            }}
          />
        ) : (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: fallbackBg,
            zIndex: 0
          }} />
        )}
        
        {/* Overlay */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.85))',
          zIndex: 1
        }} />

        <div style={{ position: 'relative', zIndex: 2, padding: '2rem' }}>
            <h1 style={{ 
            fontSize: '1.8rem', 
            fontWeight: 800, 
            color: '#fff', 
            margin: 0, 
            letterSpacing: '-0.02em',
            textShadow: '0 2px 4px rgba(0,0,0,0.5)',
            lineHeight: 1.2
            }}>
            {data.main_title}
            </h1>
            <p style={{ 
            color: 'rgba(255,255,255,0.9)', 
            fontSize: '0.95rem', 
            marginTop: '0.5rem', 
            maxWidth: '95%',
            lineHeight: 1.4,
            fontWeight: 400
            }}>
            {data.intro}
            </p>
        </div>
      </div>

      <div style={{ padding: '2rem' }}>
        {/* Stats Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', 
          gap: '1.25rem',
          marginBottom: '2.5rem'
        }}>
          {(data.stats || []).map((stat, idx) => (
            <div key={idx} style={{ 
              padding: '1.25rem', 
              backgroundColor: 'var(--gpt-bg-secondary)', 
              borderRadius: '1rem',
              border: '1px solid var(--gpt-border)',
              textAlign: 'center',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
            }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--gpt-text-secondary)', fontWeight: 600, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {stat.label}
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-app-primary)' }}>
                {stat.value}<span style={{ fontSize: '0.9rem', fontWeight: 500, marginLeft: '2px', opacity: 0.8 }}>{stat.unit}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {(data.sections || []).map((section, idx) => {
            // Dynamically pick icon
            const rawHint = section.icon_hint || 'Info';
            const IconName = (rawHint.charAt(0).toUpperCase() + rawHint.slice(1).replace(/-([a-z])/g, (g) => g[1].toUpperCase())) as keyof typeof Icons;
             // @ts-ignore
            const IconComponent = (Icons[IconName] || Icons.Info) as any;

            return (
              <div key={idx} style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
                <div style={{ 
                  flexShrink: 0,
                  width: '3.25rem', 
                  height: '3.25rem', 
                  backgroundColor: 'rgba(99,102,241,0.1)', 
                  borderRadius: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-app-primary)',
                  boxShadow: 'inset 0 0 0 1px rgba(99,102,241,0.2)'
                }}>
                  <IconComponent size={22} />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.4rem 0', color: 'var(--gpt-text-primary)' }}>
                    {section.title}
                  </h3>
                  <div style={{ fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--gpt-text-secondary)' }}>
                    {section.content}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Footer Branding */}
      <div style={{ 
        padding: '0.875rem 2rem', 
        borderTop: '1px solid var(--gpt-border)', 
        backgroundColor: 'rgba(0,0,0,0.02)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ fontSize: '0.7rem', color: 'var(--gpt-text-secondary)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Intelligent Insights by EleVatria
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Icons.Zap size={12} color="var(--color-app-primary)" />
            <span style={{ fontSize: '0.7rem', color: 'var(--gpt-text-secondary)' }}>Premium AI Output</span>
        </div>
      </div>
    </div>
  );
};

export default VisualInfographic;
