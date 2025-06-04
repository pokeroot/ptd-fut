import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer style={{ background: '#f1f1f1', color: '#333', padding: '1rem', textAlign: 'center', marginTop: 'auto' }}>
      <p>&copy; {new Date().getFullYear()} Pizarra Táctica Digital. Todos los derechos reservados.</p>
    </footer>
  );
};

export default Footer;
