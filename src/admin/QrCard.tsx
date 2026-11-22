import { useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { downloadText } from '../lib/download';

export function QrCard() {
  const [message, setMessage] = useState('');
  const frameRef = useRef<HTMLDivElement>(null);
  const url = `${window.location.origin}${window.location.pathname}`;
  const isLocal = ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setMessage('Enlace copiado.');
    } catch {
      setMessage('No se pudo copiar. Selecciona el enlace manualmente.');
    }
  };

  const download = () => {
    const svg = frameRef.current?.querySelector('svg');
    if (!svg) return;
    const text = new XMLSerializer().serializeToString(svg);
    downloadText('formix-lab-qr.svg', text, 'image/svg+xml');
    setMessage('QR descargado.');
  };

  return (
    <section className="qr-card staff-card">
      <div className="qr-card__frame" ref={frameRef} data-testid="qr-code">
        <QRCodeSVG value={url} size={220} level="M" bgColor="#FFFDFB" fgColor="#4A2450" />
      </div>
      <h2>Escanea para abrir FORMIX LAB</h2>
      <p className="qr-card__url">{url}</p>
      <div className="share-actions">
        <button type="button" className="btn btn--secondary btn--md" onClick={copy}>
          Copiar enlace
        </button>
        <button type="button" className="btn btn--primary btn--md" onClick={download}>
          Descargar QR
        </button>
      </div>
      {isLocal ? (
        <p className="share-warning">
          Esta URL es local. El QR solo funcionará en este equipo.
        </p>
      ) : null}
      <p className="form-note" role="status" aria-live="polite">
        {message}
      </p>
    </section>
  );
}
