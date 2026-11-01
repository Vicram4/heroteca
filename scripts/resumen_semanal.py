"""
Resumen semanal de Heroteca para el aviso por correo.

Lo ejecuta cada lunes GitHub Actions (.github/workflows/donde-ver.yml) después de actualizar los datos.
Compara «Próximamente» con la semana anterior y lee el historial de plataformas. Si hay algo relevante,
escribe un resumen en Markdown que la tarea publica como «issue» del repositorio, y GitHub lo manda por correo.

Secciones:
  - Estrenos anunciados nuevos, cambios de fecha y estrenos que ya no aparecen.
  - Ya estrenado y sin ficha en la colección (pista para añadirlo).
  - Cambios en plataformas y en digital (alquiler o compra), en España.
  - Pendientes de la colección (solo se incluyen si hay algo más que contar, para no repetir el mismo aviso).

Uso:
    python scripts/resumen_semanal.py <proximamente-anterior.json> <salida.md>
Si no hay nada relevante, no crea el archivo de salida.
"""
import json
import re
import sys
from pathlib import Path

import yaml

RAIZ = Path(__file__).resolve().parent.parent
WEB = 'https://heroteca.vercel.app'
MAX_LISTA = 15


def leer(ruta):
    p = Path(ruta)
    return json.loads(p.read_text(encoding='utf-8')) if p.exists() else {}


def fichas():
    """id de ficha → (universo, datos de la cabecera)."""
    salida = {}
    for archivo in sorted((RAIZ / 'contenido' / 'titulos').glob('*/*/index.md')):
        m = re.match(r'^---\n(.*?)\n---', archivo.read_text(encoding='utf-8'), re.S)
        salida[archivo.parent.name] = (archivo.parent.parent.name, yaml.safe_load(m.group(1)) if m else {})
    return salida


def fecha_es(e):
    """Fecha que cuenta en España: estreno en cines si se conoce; si no, la general."""
    return (e.get('cines') or {}).get('ES') or e['fecha']


MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']


def legible(fecha):
    """2026-12-18 → 18 de diciembre de 2026."""
    if not fecha or len(fecha) < 10:
        return fecha or '?'
    a, m, d = fecha[:10].split('-')
    return f'{int(d)} de {MESES[int(m) - 1]} de {a}'


def nombre(e):
    return e['es'].get('titulo') or e['en'].get('titulo') or e['clave']


def describir(e):
    tipo = 'película' if e['tipo'] == 'pelicula' else (f"temporada {e.get('temporada')}" if e.get('temporada') else 'serie')
    enlace = f"https://www.themoviedb.org/{e['tmdb']['tipo']}/{e['tmdb']['id']}"
    return f"[{nombre(e)}]({enlace}) ({e['universo'].upper() if e['universo'] == 'dc' else e['universo'].capitalize()}, {tipo})"


def main(ruta_antes, ruta_salida):
    antes = leer(ruta_antes)
    ahora = leer(RAIZ / 'datos' / 'proximamente.json')
    hoy = ahora.get('fecha', '')
    desde = antes.get('fecha', '')
    viejos = {e['clave']: e for e in antes.get('estrenos', [])}
    nuevos = {e['clave']: e for e in ahora.get('estrenos', [])}
    secciones = []

    # 1. Estrenos: anunciados, cambios de fecha y desaparecidos
    anunciados = [e for k, e in nuevos.items() if k not in viejos and fecha_es(e) >= hoy and not (e['tipo'] == 'serie' and (e.get('episodio') or 1) > 1)]
    cambios = [(viejos[k], e) for k, e in nuevos.items() if k in viejos and fecha_es(viejos[k]) != fecha_es(e) and fecha_es(e) >= hoy and e['tipo'] == 'pelicula']
    desaparecidos = [e for k, e in viejos.items() if k not in nuevos and fecha_es(e) > hoy]
    if anunciados:
        secciones.append('## 🆕 Estrenos anunciados nuevos\n\nYa salen solos en Próximamente.\n\n'
                         + '\n'.join(f'- {describir(e)}: {legible(fecha_es(e))}' for e in sorted(anunciados, key=fecha_es)))
    if cambios:
        secciones.append('## 📅 Cambios de fecha\n\n' + '\n'.join(f'- {describir(e)}: {legible(fecha_es(v))} → **{legible(fecha_es(e))}**' for v, e in cambios))
    if desaparecidos:
        secciones.append('## ❔ Ya no aparecen en TMDB\n\nPuede que se hayan cancelado o que hayan cambiado de ficha en TMDB.\n\n'
                         + '\n'.join(f'- {describir(e)} (estaba para el {legible(fecha_es(e))})' for e in desaparecidos))

    # 2. Ya estrenado y sin ficha en la colección
    estrenados = [
        e for e in nuevos.values()
        if not e.get('ficha') and desde < fecha_es(e) <= hoy and (e['tipo'] == 'pelicula' or (e.get('episodio') or 1) == 1)
    ]
    if estrenados:
        secciones.append('## 🎬 Ya estrenado y sin ficha en la colección\n\nSi quieres añadirlo, dime en qué sección y en qué lugar del orden.\n\n'
                         + '\n'.join(f'- {describir(e)}: estreno el {legible(fecha_es(e))}' for e in estrenados))

    # 3. Plataformas (España)
    todas = fichas()
    historial = leer(RAIZ / 'datos' / 'novedades-plataformas.json').get('ES', {})
    titulo = lambda i: (todas.get(i, (None, {}))[1] or {}).get('titulo', i) + (f" · T{todas[i][1]['temporada']}" if i in todas and todas[i][1].get('temporada') else '')  # noqa: E731
    partes = []
    for clave, verbo in (('llegadas', 'Llegan'), ('salidas', 'Se van')):
        for modo, texto in (('plataforma', 'a plataformas (suscripción o gratis)'), ('digital', 'a digital (alquiler o compra)')):
            lista = [x for x in historial.get(clave, []) if x['fecha'] == hoy and x.get('modo', 'plataforma') == modo]
            if not lista:
                continue
            texto_modo = texto if clave == 'llegadas' else texto.replace('a plataformas', 'de plataformas').replace('a digital', 'de digital')
            filas = [f"- [{titulo(x['id'])}]({WEB}/{todas.get(x['id'], ('', {}))[0]}/{x['id']}/): {x['plataforma']}" for x in lista[:MAX_LISTA]]
            if len(lista) > MAX_LISTA:
                filas.append(f'- … y {len(lista) - MAX_LISTA} más')
            partes.append(f'**{verbo} {texto_modo}: {len(lista)}**\n\n' + '\n'.join(filas))
    if partes:
        secciones.append('## 📺 Cambios en plataformas (España)\n\n«Dónde ver» ya está actualizado solo.\n\n' + '\n\n'.join(partes))

    if not secciones:
        print('Sin novedades relevantes: no se crea el aviso.')
        return

    # 4. Pendientes de la colección (solo acompañan a otras novedades)
    pendientes = []
    sin_tmdb = [i for i, (_, d) in todas.items() if not d.get('tmdb')]
    if sin_tmdb:
        pendientes.append(f"- Fichas sin datos de TMDB: {', '.join(sin_tmdb)}")
    umc = [(i, d) for i, (u, d) in todas.items() if u == 'marvel' and d.get('seccion') == 'umc']
    if any(d.get('epoca') for _, d in umc):
        sin_epoca = [i for i, d in umc if not d.get('epoca')]
        if sin_epoca:
            pendientes.append(f"- Títulos del UMC sin año en la línea temporal: {', '.join(sin_epoca)}")
    if pendientes:
        secciones.append('## ⚠️ Pendientes de la colección\n\n' + '\n'.join(pendientes))

    cuerpo = (f'Resumen automático de la semana (del {legible(desde)} al {legible(hoy)}). Para actualizar algo, cuéntaselo a Claude en el proyecto.\n\n'
              + '\n\n'.join(secciones)
              + f'\n\n---\nWeb: {WEB} · Este aviso se puede cerrar cuando esté revisado.')
    Path(ruta_salida).write_text(cuerpo, encoding='utf-8')
    print(f'Aviso preparado con {len(secciones)} secciones → {ruta_salida}')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
