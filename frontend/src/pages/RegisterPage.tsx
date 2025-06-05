import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from '../services/authService'; // Asumimos que existe este servicio

const RegisterPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [rol, setRol] = useState<'entrenador' | 'jugador'>('jugador');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (password !== password2) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    try {
      await registerUser({ username, email, password, rol });
      setSuccess('¡Registro exitoso! Ahora puedes iniciar sesión.');
      // Opcionalmente, redirigir a login después de un delay
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      if (err.response && err.response.data) {
        let errors = '';
        for (const key in err.response.data) {
          errors += \`\${key}: \${err.response.data[key].join ? err.response.data[key].join(', ') : err.response.data[key]} \n\`;
        }
        setError(errors.trim() || 'Error en el registro.');
      } else {
        setError('Error en el registro. Intenta de nuevo.');
      }
      console.error(err);
    }
  };

  return (
    <div>
      <h2>Registrarse</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="username">Usuario:</label>
          <input type="text" id="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
        </div>
        <div>
          <label htmlFor="email">Email:</label>
          <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label htmlFor="password">Contraseña:</label>
          <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <div>
          <label htmlFor="password2">Confirmar Contraseña:</label>
          <input type="password" id="password2" value={password2} onChange={(e) => setPassword2(e.target.value)} required />
        </div>
        <div>
          <label htmlFor="rol">Soy un:</label>
          <select id="rol" value={rol} onChange={(e) => setRol(e.target.value as 'entrenador' | 'jugador')}>
            <option value="jugador">Jugador</option>
            <option value="entrenador">Entrenador</option>
          </select>
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {success && <p style={{ color: 'green' }}>{success}</p>}
        <button type="submit">Registrarse</button>
      </form>
      <p>¿Ya tienes cuenta? <Link to="/login">Inicia sesión aquí</Link></p>
    </div>
  );
};

export default RegisterPage;
