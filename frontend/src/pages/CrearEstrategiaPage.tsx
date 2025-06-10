import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Navigate, useParams, useNavigate, useLocation } from 'react-router-dom'; // useLocation
import { Stage, Layer, Image as KonvaImage, Circle, Text as KonvaText, Arrow as KonvaArrow, Line as KonvaLine, Rect as KonvaRect } from 'react-konva';
import Konva from 'konva';
import useImage from 'use-image';
import {
    guardarEstrategia, getEstrategiaPorId, EstrategiaData,
    getComentariosPorEstrategia, addComentarioAEstrategia, ComentarioData // Importar de comentarios
} from '../services/estrategiaService';
import { getMisEquipos, Equipo } from '../services/equipoService';

// Tipos (sin cambios)
const futsalCourtSVG = require('../assets/fields/futsal_court.svg').default;
const futbol7CourtSVG = require('../assets/fields/futbol7_court.svg').default;
const futbol11CourtSVG = require('../assets/fields/futbol11_court.svg').default;
export type TipoCampo = 'Futsal' | 'Futbol_7' | 'Futbol_11';
export interface CampoOpcion { /* ... */
  tipo: TipoCampo; nombreMostrado: string; imagenSrc: string; width: number; height: number; limiteFichasPorEquipo: number;
}
export const opcionesCampo: CampoOpcion[] = [
  { tipo: 'Futsal', nombreMostrado: 'Futsal', imagenSrc: futsalCourtSVG, width: 400, height: 200, limiteFichasPorEquipo: 5 },
  { tipo: 'Futbol_7', nombreMostrado: 'Fútbol 7', imagenSrc: futbol7CourtSVG, width: 600, height: 400, limiteFichasPorEquipo: 7 },
  { tipo: 'Futbol_11', nombreMostrado: 'Fútbol 11', imagenSrc: futbol11CourtSVG, width: 700, height: 500, limiteFichasPorEquipo: 11 },
];
export interface ElementoTablero { /* ... */
  id: string; x: number; y: number; type: 'ficha' | 'balon' | 'linea' | 'flecha' | 'texto_nota' | 'rect_zona' | 'circ_zona';
  radius?: number; fill?: string; stroke?: string; strokeWidth?: number; text?: string; fontSize?: number;
  playerType?: 'local' | 'visitante'; points?: number[]; textValue?: string; width?: number; height?: number;
}
const coloresHerramientas = ['black', 'red', 'blue', 'green', 'yellow', 'white'];
const grosoresHerramientas = [{nombre: 'Delgado', valor: 2}, {nombre: 'Normal', valor: 4}, {nombre: 'Grueso', valor: 6}];
type HerramientaActual = 'seleccion' | 'ficha_local' | 'ficha_visitante' | 'balon' | 'linea' | 'flecha' | 'texto_nota' | 'rect_zona' | 'circ_zona';


const CrearEstrategiaPage: React.FC = () => {
  const { user } = useAuth();
  const { estrategiaId } = useParams<{ estrategiaId?: string }>();
  const navigate = useNavigate();
  const location = useLocation(); // Para determinar el modo visualización

  const [isReadOnly, setIsReadOnly] = useState(false);

  // Estados existentes ...
  const [campoSeleccionado, setCampoSeleccionado] = useState<CampoOpcion | null>(null);
  const [backgroundImage] = useImage(campoSeleccionado?.imagenSrc || '');
  const [elementos, setElementos] = useState<ElementoTablero[]>([]);
  const [elementoSeleccionadoId, setElementoSeleccionadoId] = useState<string | null>(null);
  const [herramientaActual, setHerramientaActual] = useState<HerramientaActual>('seleccion');
  const [colorHerramienta, setColorHerramienta] = useState('red');
  const [grosorHerramienta, setGrosorHerramienta] = useState(4);
  const [dibujando, setDibujando] = useState(false);
  const [puntosActuales, setPuntosActuales] = useState<number[]>([]);
  const [nombreEstrategia, setNombreEstrategia] = useState('');
  const [equipoEntrenador, setEquipoEntrenador] = useState<Equipo | null>(null);
  const [isLoading, setIsLoading] = useState(false); // Para acciones como guardar, etc.
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPageLoading, setIsPageLoading] = useState(true); // Para carga inicial de datos

  // Nuevos estados para comentarios
  const [comentarios, setComentarios] = useState<ComentarioData[]>([]);
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [isLoadingComentarios, setIsLoadingComentarios] = useState(false);

  const stageRef = useRef<Konva.Stage>(null);
  const stageWidth = Math.min(campoSeleccionado?.width || 800, typeof window !== 'undefined' ? window.innerWidth * 0.9 : 800);
  const scale = campoSeleccionado ? stageWidth / campoSeleccionado.width : 1;
  const stageHeight = campoSeleccionado ? campoSeleccionado.height * scale : 400;

  useEffect(() => {
    // Determinar si es read-only basado en la ruta o rol del usuario
    // Si la ruta es /visualizar-estrategia/* O si el usuario es 'jugador' y hay un estrategiaId
    const readOnlyMode = location.pathname.startsWith('/visualizar-estrategia') || (user?.rol === 'jugador' && !!estrategiaId);
    setIsReadOnly(readOnlyMode);
    if (readOnlyMode) {
        setHerramientaActual('seleccion'); // Forzar a modo seleccion si es read-only
    }
  }, [location.pathname, user, estrategiaId]);


  const fetchComentarios = useCallback(async (id: number) => {
    if (!id) return;
    setIsLoadingComentarios(true);
    try {
      const data = await getComentariosPorEstrategia(id);
      setComentarios(data);
    } catch (err) {
      console.error("Error al cargar comentarios", err);
      //setError("No se pudieron cargar los comentarios."); // Podría ser muy intrusivo
    } finally {
      setIsLoadingComentarios(false);
    }
  }, []);

  useEffect(() => {
    const cargarDatosIniciales = async () => {
      if (!user) { // Si no hay usuario, no hacer nada hasta que AuthProvider cargue
          setIsPageLoading(false);
          return;
      }
      setIsPageLoading(true);
      setIsLoading(true); // Usar isLoading general también

      try {
        if (user.rol === 'entrenador') {
          const equipos = await getMisEquipos();
          if (equipos.length > 0) {
            setEquipoEntrenador(equipos[0]);
          } else if (!estrategiaId) { // Solo error si no está cargando una estrategia existente
            setError("Como entrenador, no tienes un equipo asignado. Debes crear uno primero.");
          }
        }

        if (estrategiaId) {
          const idNum = parseInt(estrategiaId, 10);
          const data = await getEstrategiaPorId(idNum);
          setNombreEstrategia(data.nombre);
          const campoCargado = opcionesCampo.find(oc => oc.tipo === data.tipo_campo);
          if (campoCargado) {
            setCampoSeleccionado(campoCargado);
          }
          setElementos(data.datos_estrategia?.elementos || []);
          // Cargar comentarios para esta estrategia
          fetchComentarios(idNum);
        } else {
          // Si es nueva estrategia, limpiar comentarios
          setComentarios([]);
        }
      } catch (err: any) {
        setError(err.response?.data?.detail || err.message || 'Error al cargar datos iniciales.');
        console.error("Error cargando datos iniciales:", err);
      } finally {
        setIsLoading(false);
        setIsPageLoading(false);
      }
    };
    cargarDatosIniciales();
  }, [user, estrategiaId, fetchComentarios]); // fetchComentarios es dependencia

  // Lógica de handleSeleccionarCampo, reiniciarSeleccionCampo, getCounts (sin cambios)
  const handleSeleccionarCampo = (opcion: CampoOpcion) => { /* ... */
    if (elementos.length > 0 && !window.confirm("Tienes elementos en el tablero. ¿Seguro que quieres cambiar de campo? Se perderán los cambios no guardados.")) return;
    setCampoSeleccionado(opcion); setElementos([]); setElementoSeleccionadoId(null); setNombreEstrategia(''); setComentarios([]);
  };
  const reiniciarSeleccionCampo = () => { /* ... */
    if (elementos.length > 0 && !window.confirm("Tienes elementos en el tablero. ¿Seguro que quieres cambiar de campo? Se perderán los cambios no guardados.")) return;
    setCampoSeleccionado(null); setElementos([]); setNombreEstrategia(''); setComentarios([]);
  };
  const getCounts = () => { /* ... */
    const fichasLocal = elementos.filter(el => el.type === 'ficha' && el.playerType === 'local').length;
    const fichasVisitante = elementos.filter(el => el.type === 'ficha' && el.playerType === 'visitante').length;
    const balonExiste = elementos.some(el => el.type === 'balon');
    return { fichasLocal, fichasVisitante, balonExiste };
  };


  // Lógica del tablero (Stage MouseDown, Move, Up, DragEnd, ElementoClick, EditarTextoFicha, Eliminar, Limpiar)
  // Estas funciones deben respetar 'isReadOnly'
  const handleStageMouseDown = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (isReadOnly || !campoSeleccionado) return;
    // ... resto de la lógica de mousedown (sin cambios funcionales mayores)
    if (e.target !== e.target.getStage()) return;
    setElementoSeleccionadoId(null);
    const pos = e.target.getStage()?.getPointerPosition(); if (!pos) return;
    const x = pos.x / scale; const y = pos.y / scale;
    if (herramientaActual === 'ficha_local' || herramientaActual === 'ficha_visitante') { /* ... */
        const { fichasLocal, fichasVisitante } = getCounts(); const playerType = herramientaActual === 'ficha_local' ? 'local' : 'visitante';
        const limite = campoSeleccionado.limiteFichasPorEquipo;
        if ((playerType === 'local' && fichasLocal >= limite) || (playerType === 'visitante' && fichasVisitante >= limite)) { alert(`Límite de ${limite} fichas... `); return; }
        const nuevaFicha: ElementoTablero = { id: Konva.Util.getRandomColor(), x, y, type: 'ficha', radius: 10, fill: playerType === 'local' ? 'red' : 'blue', stroke: 'white', strokeWidth: 1, text: `${playerType === 'local' ? fichasLocal + 1 : fichasVisitante + 1}`, fontSize: 10, playerType };

        setElementos(prev => [...prev, nuevaFicha]);
    } else if (herramientaActual === 'balon') { /* ... */
        const { balonExiste } = getCounts(); if (balonExiste) { alert("Solo un balón..."); return; }
        const nuevoBalon: ElementoTablero = { id: Konva.Util.getRandomColor(), x, y, type: 'balon', radius: 6, fill: 'orange', stroke: 'black', strokeWidth: 1, };
        setElementos(prev => [...prev, nuevoBalon]);
    } else if (['linea', 'flecha', 'rect_zona', 'circ_zona'].includes(herramientaActual)) { /* ... */
        setDibujando(true); setPuntosActuales([x, y, x, y]);
    } else if (herramientaActual === 'texto_nota') { /* ... */
        const texto = prompt("Introduce la nota:"); if (texto) { const nuevaNota: ElementoTablero = { id: Konva.Util.getRandomColor(), x, y, type: 'texto_nota', textValue: texto, fontSize: 12, fill: colorHerramienta, }; setElementos(prev => [...prev, nuevaNota]); }
    }
  };
  const handleStageMouseMove = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => { if (isReadOnly || !dibujando || !puntosActuales.length) return; /* ... */
    const pos = e.target.getStage()?.getPointerPosition(); if (!pos) return;
    const x = pos.x / scale; const y = pos.y / scale;
    if (herramientaActual === 'linea' || herramientaActual === 'flecha') { setPuntosActuales([puntosActuales[0], puntosActuales[1], x, y]); }
    else if (herramientaActual === 'rect_zona' || herramientaActual === 'circ_zona') { setPuntosActuales([puntosActuales[0], puntosActuales[1], x, y]); }
  };
  const handleStageMouseUp = (_e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => { if (isReadOnly || !dibujando || !puntosActuales.length || !campoSeleccionado) return; /* ... */
    setDibujando(false); const id = Konva.Util.getRandomColor(); let nuevoElemento: ElementoTablero | null = null;
    if (herramientaActual === 'linea') nuevoElemento = { id, x:0, y:0, type: 'linea', points: puntosActuales, stroke: colorHerramienta, strokeWidth: grosorHerramienta };
    else if (herramientaActual === 'flecha') nuevoElemento = { id, x:0, y:0, type: 'flecha', points: puntosActuales, stroke: colorHerramienta, fill: colorHerramienta, strokeWidth: grosorHerramienta };
    else if (herramientaActual === 'rect_zona') { const [x1,y1,x2,y2] = puntosActuales; nuevoElemento = { id, type: 'rect_zona', x: Math.min(x1,x2), y: Math.min(y1,y2), width: Math.abs(x2-x1), height: Math.abs(y2-y1), stroke: colorHerramienta, strokeWidth: grosorHerramienta };}
    else if (herramientaActual === 'circ_zona') { const [x1,y1,x2,y2] = puntosActuales; const radius = Math.sqrt(Math.pow(x2-x1,2)+Math.pow(y2-y1,2)); nuevoElemento = { id, type: 'circ_zona', x:x1, y:y1, radius, stroke: colorHerramienta, strokeWidth: grosorHerramienta };}
    if (nuevoElemento) setElementos(prev => [...prev, nuevoElemento!]); setPuntosActuales([]);
  };
  const handleDragEnd = (e: Konva.KonvaEventObject<MouseEvent>, id: string) => { if (isReadOnly) return; /* ... */
    const newX = e.target.x() / scale; const newY = e.target.y() / scale;
    setElementos(prev => prev.map(el => el.id === id ? { ...el, x: newX, y: newY } : el));
  };
  const handleElementoClick = (id: string) => { /* ... */
    // Allow selection even in read-only for potential inspection, but not modification tools
    if (herramientaActual === 'seleccion') setElementoSeleccionadoId(id);
  };
  const handleEditarTextoFicha = (id: string) => {
    if (isReadOnly) return;
    const ficha = elementos.find(el => el.id === id && el.type === 'ficha');
    if (ficha) {
        const nuevoTexto = prompt("Número o inicial para la ficha (máx. 2 caracteres):", ficha.text || "");
        if (nuevoTexto === null) { // Usuario canceló
            return;
        }
        if (nuevoTexto.trim() === "") { // Texto vacío no permitido (o mantener el anterior)
            alert("El texto no puede estar vacío.");
            return;
        }
        if (nuevoTexto.length <= 2) {
            setElementos(prev => prev.map(el => el.id === id ? { ...el, text: nuevoTexto.toUpperCase() } : el));
        } else {
            alert("El texto debe tener máximo 2 caracteres.");
        }
    }
  };
  const eliminarElementoSeleccionado = () => { if (isReadOnly) return; /* ... */
    if (elementoSeleccionadoId) { setElementos(prev => prev.filter(el => el.id !== elementoSeleccionadoId)); setElementoSeleccionadoId(null); } else alert("Selecciona un elemento.");
  };
  const limpiarTablero = () => { if (isReadOnly) return; /* ... */
    if (window.confirm("Limpiar tablero?")) { setElementos([]); setElementoSeleccionadoId(null); }
  };
  const handleGuardarEstrategia = async () => { /* ... (sin cambios, ya respeta isLoading) ... */
    if (isReadOnly || !campoSeleccionado || !equipoEntrenador) { setError("No se puede guardar."); return; }
    let nombreParaGuardar = nombreEstrategia;
    if (!nombreParaGuardar) {
      const nombrePrompt = prompt("Nombre para la estrategia:");
      if (nombrePrompt === null || nombrePrompt.trim() === "") {
        setError("Nombre obligatorio.");
        return;
      }
      nombreParaGuardar = nombrePrompt;
      setNombreEstrategia(nombreParaGuardar); // Ahora nombreParaGuardar es definitivamente un string
    }
    const datosParaGuardar: EstrategiaData = { nombre: nombreParaGuardar, tipo_campo: campoSeleccionado.tipo, datos_estrategia: { elementos: elementos }, equipo: equipoEntrenador.id, };
    setIsLoading(true); setError(null); setMensaje(null);
    try { const estrategiaGuardada = await guardarEstrategia(datosParaGuardar); setMensaje('Estrategia "\${estrategiaGuardada.nombre}" guardada!'); if (!estrategiaId) navigate('/crear-estrategia/\${estrategiaGuardada.id}', { replace: true }); fetchComentarios(estrategiaGuardada.id!); /* Recargar comentarios (nueva) */ }
    catch (err: any) { setError(err.response?.data?.detail || 'Error guardando.'); } finally { setIsLoading(false); }
  };

  // Lógica para añadir comentario
  const handleAddComentario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoComentario.trim() || !estrategiaId) return;

    // Añadir el log aquí
    console.log('Enviando payload de comentario:', { texto: nuevoComentario });

    setIsLoadingComentarios(true);
    try {
      const comentarioAnadido = await addComentarioAEstrategia(parseInt(estrategiaId, 10), { texto: nuevoComentario });
      setComentarios(prev => [...prev, comentarioAnadido]); // Añadir a la lista local
      setNuevoComentario(''); // Limpiar input
    } catch (err) {
      console.error("Error al añadir comentario", err);
      setError("No se pudo enviar el comentario.");
    } finally {
      setIsLoadingComentarios(false);
    }
  };

  // RenderElemento y RenderFormaTemporal (sin cambios funcionales mayores, solo respetar isReadOnly para draggable)
  const renderElemento = (el: ElementoTablero) => { /* ... */
    const commonProps = { key:el.id, id:el.id, draggable:herramientaActual === 'seleccion' && !isReadOnly, onClick:()=>handleElementoClick(el.id), onTap:()=>handleElementoClick(el.id), onDragEnd:(e:Konva.KonvaEventObject<MouseEvent>)=>handleDragEnd(e,el.id), opacity:elementoSeleccionadoId===el.id?0.7:1,};
    switch(el.type){ /* ... (casos sin cambios, solo el draggable) ... */
      case 'ficha': return (<React.Fragment key={el.id}><Circle {...commonProps} x={el.x*scale} y={el.y*scale} radius={(el.radius||10)*scale} fill={el.fill} stroke={el.stroke} strokeWidth={(el.strokeWidth||1)*scale} onDblClick={()=>!isReadOnly && handleEditarTextoFicha(el.id)} onDblTap={()=>!isReadOnly && handleEditarTextoFicha(el.id)} /><KonvaText {...commonProps} listening={false} x={(el.x-(el.radius||10))*scale} y={(el.y-(el.radius||10)/1.5)*scale} text={el.text} fontSize={(el.fontSize||10)*scale} fill="white" width={(el.radius||10)*2*scale} height={(el.radius||10)*2*scale} align="center" verticalAlign="middle"/></React.Fragment>);
      case 'balon': return <Circle {...commonProps} x={el.x*scale} y={el.y*scale} radius={(el.radius||6)*scale} fill={el.fill} stroke={el.stroke} strokeWidth={(el.strokeWidth||1)*scale}/>;
      case 'linea': return <KonvaLine {...commonProps} points={(el.points || []).map(p=>p*scale)} stroke={el.stroke} strokeWidth={(el.strokeWidth||2)*scale} tension={0} listening={herramientaActual==='seleccion'}/>;
      case 'flecha': return <KonvaArrow {...commonProps} points={(el.points || []).map(p=>p*scale)} stroke={el.stroke} fill={el.fill} strokeWidth={(el.strokeWidth||2)*scale} pointerLength={10*scale} pointerWidth={10*scale} tension={0} listening={herramientaActual==='seleccion'}/>;
      case 'texto_nota': return <KonvaText {...commonProps} x={el.x*scale} y={el.y*scale} text={el.textValue} fontSize={(el.fontSize||12)*scale} fill={el.fill} listening={herramientaActual==='seleccion'}/>;
      case 'rect_zona': return <KonvaRect {...commonProps} x={el.x*scale} y={el.y*scale} width={(el.width||0)*scale} height={(el.height||0)*scale} stroke={el.stroke} strokeWidth={(el.strokeWidth||2)*scale} listening={herramientaActual==='seleccion'}/>;
      case 'circ_zona': return <Circle {...commonProps} x={el.x*scale} y={el.y*scale} radius={(el.radius||0)*scale} stroke={el.stroke} strokeWidth={(el.strokeWidth||2)*scale} listening={herramientaActual==='seleccion'}/>;
      default: return null;
    }
  };
  const renderFormaTemporal = () => { if (isReadOnly || !dibujando || puntosActuales.length < 2) return null; /* ... */
    const props = {stroke:colorHerramienta, strokeWidth:grosorHerramienta*scale, opacity:0.7};
    if(herramientaActual==='linea')return <KonvaLine points={puntosActuales.map(p=>p*scale)} {...props}/>;
    if(herramientaActual==='flecha')return <KonvaArrow points={puntosActuales.map(p=>p*scale)} fill={colorHerramienta} pointerLength={10*scale} pointerWidth={10*scale} {...props}/>;
    if(herramientaActual==='rect_zona'){const [x1,y1,x2,y2]=puntosActuales; return <KonvaRect x={Math.min(x1,x2)*scale} y={Math.min(y1,y2)*scale} width={Math.abs(x2-x1)*scale} height={Math.abs(y2-y1)*scale} {...props}/>;}
    if(herramientaActual==='circ_zona'){const [x1,y1,x2,y2]=puntosActuales; const r=Math.sqrt(Math.pow(x2-x1,2)+Math.pow(y2-y1,2)); return <Circle x={x1*scale} y={y1*scale} radius={r*scale} {...props}/>;}
    return null;
  };

  // ---- RENDER JSX ----
  if (isPageLoading) return <p>Cargando estrategia...</p>;
  if (!user) return <Navigate to="/login" replace />; // Si no hay usuario después de cargar
  if (user.rol === 'entrenador' && !equipoEntrenador && !estrategiaId) return <div><p>{error || "Cargando información del equipo..."}</p> <button onClick={() => navigate('/gestion-equipo')}>Ir a Gestión de Equipo</button></div>;


  return (
    <div>
      <h2>{isReadOnly ? 'Visualizando Estrategia: \${nombreEstrategia} ' : (estrategiaId ? 'Editando Estrategia: \${nombreEstrategia}' : "Crear Nueva Estrategia")}</h2>
      {mensaje && <p style={{ color: 'green' }}>{mensaje}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!campoSeleccionado && !estrategiaId ? (
         <> {/* Selector de campo (sin cambios) */}
          <p>Paso 1: Selecciona el tipo de campo para tu estrategia.</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-around', marginTop: '20px' }}>
            {opcionesCampo.map((opcion) => (<button key={opcion.tipo} onClick={() => handleSeleccionarCampo(opcion)} style={{ padding: '15px', fontSize: '1em', margin:'10px', width:'200px', textAlign:'center' }}><img src={opcion.imagenSrc} alt={opcion.nombreMostrado} style={{width:'100%',height:'auto',display:'block',marginBottom:'10px',border:'1px solid #ccc'}}/>{opcion.nombreMostrado}</button>))}
          </div>
        </>
      ) : campoSeleccionado ? (
        <>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px'}}>
            <h3>Campo: {campoSeleccionado.nombreMostrado}</h3>
            {!estrategiaId && !isReadOnly && <button onClick={reiniciarSeleccionCampo}>Cambiar Tipo de Campo</button>}
          </div>

          {!isReadOnly && ( // Solo mostrar input de nombre si no es read-only
            <div>
              <label htmlFor="nombreEstrategiaInput">Nombre de la Estrategia: </label>
              <input type="text" id="nombreEstrategiaInput" value={nombreEstrategia} onChange={(e) => setNombreEstrategia(e.target.value)} placeholder="Ej: Tiro libre indirecto frontal" style={{width: '300px', marginBottom: '10px'}} disabled={isLoading || isReadOnly}/>
            </div>
          )}

          {/* Panel de Herramientas (deshabilitar botones si isReadOnly) */}
          {!isReadOnly && (
            <div style={{ marginBottom: '10px', padding: '10px', border: '1px solid #eee', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              <button onClick={() => setHerramientaActual('seleccion')} className={herramientaActual === 'seleccion' ? 'active' : ''} disabled={isLoading}>Seleccionar</button>
              <button onClick={() => setHerramientaActual('ficha_local')} className={herramientaActual === 'ficha_local' ? 'active' : ''} disabled={isLoading}>Ficha L.</button>
              <button onClick={() => setHerramientaActual('ficha_visitante')} className={herramientaActual === 'ficha_visitante' ? 'active' : ''} disabled={isLoading}>Ficha V.</button>
              <button onClick={() => setHerramientaActual('balon')} className={herramientaActual === 'balon' ? 'active' : ''} disabled={isLoading}>Balón</button>
              <button onClick={() => setHerramientaActual('linea')} className={herramientaActual === 'linea' ? 'active' : ''} disabled={isLoading}>Línea</button>
              <button onClick={() => setHerramientaActual('flecha')} className={herramientaActual === 'flecha' ? 'active' : ''} disabled={isLoading}>Flecha</button>
              <button onClick={() => setHerramientaActual('texto_nota')} className={herramientaActual === 'texto_nota' ? 'active' : ''} disabled={isLoading}>Nota</button>
              <button onClick={() => setHerramientaActual('rect_zona')} className={herramientaActual === 'rect_zona' ? 'active' : ''} disabled={isLoading}>Zona Rect.</button>
              <button onClick={() => setHerramientaActual('circ_zona')} className={herramientaActual === 'circ_zona' ? 'active' : ''} disabled={isLoading}>Zona Circ.</button>
              <select value={colorHerramienta} onChange={e => setColorHerramienta(e.target.value)} style={{height: '38px'}} disabled={isLoading}><option value="black">Negro</option><option value="red">Rojo</option><option value="blue">Azul</option><option value="green">Verde</option><option value="yellow">Amarillo</option><option value="white">Blanco</option></select>
              <select value={grosorHerramienta} onChange={e => setGrosorHerramienta(Number(e.target.value))} style={{height: '38px'}} disabled={isLoading}><option value="2">Delgado</option><option value="4">Normal</option><option value="6">Grueso</option></select>
              <button onClick={eliminarElementoSeleccionado} disabled={!elementoSeleccionadoId || isLoading}>Eliminar</button>
              <button onClick={limpiarTablero} disabled={isLoading}>Limpiar</button>
            </div>
          )}
          <style>{`.active { background-color: lightblue !important; }`}</style>

          <div id="contenedor-tablero" style={{ width: stageWidth, height: stageHeight, margin: '0 auto', border: '1px solid #ccc', cursor: (herramientaActual !== 'seleccion' && herramientaActual !== 'texto_nota' && !isReadOnly) ? 'crosshair' : 'default' }}>
            <Stage ref={stageRef} width={stageWidth} height={stageHeight}
                onMouseDown={handleStageMouseDown} onMouseMove={handleStageMouseMove} onMouseUp={handleStageMouseUp}
                onTouchStart={handleStageMouseDown} onTouchMove={handleStageMouseMove} onTouchEnd={handleStageMouseUp}>
              <Layer><KonvaImage image={backgroundImage} width={stageWidth} height={stageHeight} listening={false} /></Layer>
              <Layer name="elementos">{elementos.map(el => renderElemento(el))}{renderFormaTemporal()}</Layer>
            </Stage>
          </div>
          {!isReadOnly && <p style={{textAlign: 'center', marginTop: '10px'}}>Doble clic en ficha para editar texto. Elementos arrastrables en modo "Seleccionar".</p>}
          <p style={{textAlign: 'center'}}>Fichas Local: {getCounts().fichasLocal}/{campoSeleccionado.limiteFichasPorEquipo} | Fichas Visitante: {getCounts().fichasVisitante}/{campoSeleccionado.limiteFichasPorEquipo} | Balón: {getCounts().balonExiste ? 'Sí' : 'No'}</p>

          {!isReadOnly && (
            <button onClick={handleGuardarEstrategia} style={{marginTop: '20px', padding: '10px 20px', fontSize: '1.2em'}} disabled={isLoading}>
              {isLoading ? 'Guardando...' : (estrategiaId ? 'Actualizar Estrategia' : 'Guardar Estrategia')}
            </button>
          )}

          {/* Sección de Comentarios */}
          {estrategiaId && ( // Solo mostrar comentarios si la estrategia existe (tiene ID)
            <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #eee', maxWidth: '800px', margin: '30px auto 0 auto' }}>
              <h3>Comentarios sobre esta Estrategia</h3>
              {isLoadingComentarios ? <p>Cargando comentarios...</p> : (
                comentarios.length === 0 ? <p>No hay comentarios aún.</p> : (
                  <ul style={{listStyle:'none', paddingLeft:0}}>
                    {comentarios.map(com => (
                      <li key={com.id} style={{borderBottom:'1px solid #f0f0f0', marginBottom:'10px', paddingBottom:'10px'}}>
                        <p><strong>{com.autor_username || 'Usuario'}:</strong> {com.texto}</p>
                        <small>{new Date(com.fecha_creacion || Date.now()).toLocaleString()}</small>
                      </li>
                    ))}
                  </ul>
                )
              )}
              <form onSubmit={handleAddComentario} style={{marginTop:'10px'}}>
                <textarea
                  value={nuevoComentario}
                  onChange={(e) => setNuevoComentario(e.target.value)}
                  placeholder="Escribe tu comentario aquí..."
                  rows={3}
                  style={{width:'100%',boxSizing:'border-box', marginBottom:'10px', padding:'8px', border:'1px solid #ccc', borderRadius:'4px'}}
                  required
                  disabled={isLoadingComentarios}
                />
                <br/>
                <button type="submit" disabled={isLoadingComentarios || !nuevoComentario.trim()}>
                  {isLoadingComentarios ? 'Enviando...' : 'Enviar Comentario'}
                </button>
              </form>
            </div>
          )}
        </>
      ) : (
        <p>Cargando configuración del tablero...</p>
      )}
    </div>
  );
};
export default CrearEstrategiaPage;
