// HU10 · Barras horizontales de una sola serie: el título nombra la serie, cada barra muestra su valor.
export function BarrasHorizontales({ titulo, datos, unidad = '' }) {
  const maximo = Math.max(1, ...datos.map((d) => d.valor));

  return (
    <section className="panel">
      <div className="panel__header">
        <h2 className="panel__title">{titulo}</h2>
      </div>
      <div className="panel__body">
        <ul className="bars" role="list">
          {datos.map((d) => (
            <li key={d.etiqueta} className="bars__row">
              <span className="bars__label">{d.etiqueta}</span>
              <span className="bars__track" aria-label={`${d.etiqueta}: ${d.valor}${unidad}`}>
                {d.valor > 0 ? <span className="bars__bar" style={{ width: `${(d.valor / maximo) * 100}%` }} /> : null}
                <span className="bars__value num">{d.valor}{unidad}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
