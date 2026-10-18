// Estrellas de un nivel (0 a 3). Mismo glifo para llenas y vacías, cambia solo
// el color: mezclar un emoji con un carácter de texto se veía desparejo.
export function Estrellas({ cantidad, grande = false }: { cantidad: number; grande?: boolean }) {
  return (
    <span className={grande ? 'estrellas estrellas--grandes' : 'estrellas'} role="img" aria-label={`${cantidad} de 3 estrellas`}>
      {[0, 1, 2].map((i) => (
        <span key={i} className={i < cantidad ? 'estrella-llena' : 'estrella-vacia'} aria-hidden="true">
          ★
        </span>
      ))}
    </span>
  );
}
