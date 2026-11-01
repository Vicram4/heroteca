"""
«Dónde ver»: plataformas de suscripción, gratis, alquiler y compra de cada ficha, en España
(versión española de la web) y en Estados Unidos (versión inglesa).

Los datos los da TMDB y proceden de JustWatch (hay que citarlo en la web). Como los catálogos
cambian a menudo, este script se ejecuta cada semana desde GitHub Actions
(.github/workflows/donde-ver.yml) y siempre pide los datos frescos.

Uso:
    .venv/Scripts/python.exe scripts/sincronizar_donde_ver.py
Salida: datos/donde-ver.json (España) y datos/donde-ver-us.json (Estados Unidos)

Además apunta en datos/novedades-plataformas.json lo que llega y lo que se va de cada plataforma
(suscripción o gratis) respecto a la semana anterior, para la futura sección «Novedades».
Se guardan los últimos DIAS_HISTORIAL días.
"""
import datetime
import json
import re
import sys
from pathlib import Path

import yaml

sys.path.insert(0, str(Path(__file__).parent))
import tmdb  # noqa: E402

RAIZ = Path(__file__).resolve().parent.parent
PAISES = {'ES': 'donde-ver.json', 'US': 'donde-ver-us.json'}
ARCHIVO_NOVEDADES = RAIZ / 'datos' / 'novedades-plataformas.json'
DIAS_HISTORIAL = 120
CATEGORIAS = {'flatrate': 'suscripcion', 'free': 'gratis', 'ads': 'gratis', 'rent': 'alquiler', 'buy': 'compra'}


def leer_ficha(archivo):
    m = re.match(r'^---\n(.*?)\n---', archivo.read_text(encoding='utf-8'), re.S)
    return yaml.safe_load(m.group(1)) if m else {}


# Nombres tal como se conocen en España
NOMBRES = {'Disney Plus': 'Disney+', 'Amazon Prime Video': 'Prime Video', 'Apple TV Store': 'Apple TV'}


def nombre_base(nombre):
    """«Netflix Standard with Ads» → «Netflix»; «HBO Max Amazon Channel» → «HBO Max»."""
    n = re.sub(r'\s+(Standard\s+)?with Ads$', '', nombre.strip())
    n = re.sub(r'\s+Amazon Channel$', '', n).strip()
    return NOMBRES.get(n, n)


def plataformas(datos):
    """Agrupa por categoría, sin repetir variantes de la misma plataforma."""
    salida, vistas = {}, set()
    for clave in ('flatrate', 'free', 'ads', 'rent', 'buy'):
        cat = CATEGORIAS[clave]
        for p in sorted(datos.get(clave) or [], key=lambda p: p.get('display_priority', 99)):
            base = nombre_base(p['provider_name'])
            if (cat, base) in vistas:
                continue
            vistas.add((cat, base))
            salida.setdefault(cat, []).append({'nombre': base, 'logo': p.get('logo_path')})
    return salida


def incluidas(t):
    """Plataformas donde se ve sin pagar aparte (suscripción o gratis)."""
    return {p['nombre'] for c in ('suscripcion', 'gratis') for p in t.get(c, [])}


def apuntar_novedades(pais, anteriores, nuevos, hoy):
    """Compara con los datos de la semana anterior y añade llegadas y salidas al historial."""
    historial = json.loads(ARCHIVO_NOVEDADES.read_text(encoding='utf-8')) if ARCHIVO_NOVEDADES.exists() else {}
    del_pais = historial.setdefault(pais, {'llegadas': [], 'salidas': []})
    limite = (datetime.date.fromisoformat(hoy) - datetime.timedelta(days=DIAS_HISTORIAL)).isoformat()
    for clave in ('llegadas', 'salidas'):
        del_pais[clave] = [e for e in del_pais[clave] if e['fecha'] >= limite and e['fecha'] != hoy]
    for ident in sorted(set(anteriores) | set(nuevos)):
        antes, ahora = incluidas(anteriores.get(ident, {})), incluidas(nuevos.get(ident, {}))
        del_pais['llegadas'] += [{'fecha': hoy, 'id': ident, 'plataforma': p} for p in sorted(ahora - antes)]
        del_pais['salidas'] += [{'fecha': hoy, 'id': ident, 'plataforma': p} for p in sorted(antes - ahora)]
    ARCHIVO_NOVEDADES.write_text(json.dumps(historial, ensure_ascii=False, indent=1, sort_keys=True), encoding='utf-8', newline='\n')
    return sum(1 for e in del_pais['llegadas'] if e['fecha'] == hoy), sum(1 for e in del_pais['salidas'] if e['fecha'] == hoy)


def main():
    titulos = {p: {} for p in PAISES}
    cache = {}
    for archivo in sorted((RAIZ / 'contenido' / 'titulos').glob('*/*/index.md')):
        ref = leer_ficha(archivo).get('tmdb')
        if not ref:
            continue
        clave = (ref['tipo'], ref['id'])
        if clave not in cache:
            datos = tmdb.get(f"/{ref['tipo']}/{ref['id']}/watch/providers", refrescar=True, language=None) or {}
            cache[clave] = datos.get('results') or {}
        for pais in PAISES:
            d = cache[clave].get(pais)
            grupos = plataformas(d) if d else {}
            if grupos:
                titulos[pais][archivo.parent.name] = {'enlace': d.get('link'), **grupos}
    hoy = datetime.date.today().isoformat()
    for pais, nombre in PAISES.items():
        salida = {'fecha': hoy, 'pais': pais, 'fuente': 'JustWatch (vía TMDB)', 'titulos': titulos[pais]}
        destino = RAIZ / 'datos' / nombre
        # Solo se comparan semanas distintas (si se relanza el mismo día, se rehace la comparación con la anterior)
        if destino.exists():
            previo = json.loads(destino.read_text(encoding='utf-8'))
            if previo.get('fecha') != hoy:
                llegan, se_van = apuntar_novedades(pais, previo.get('titulos', {}), titulos[pais], hoy)
                print(f'{pais}: {llegan} llegadas y {se_van} salidas desde el {previo.get("fecha")}')
        destino.write_text(json.dumps(salida, ensure_ascii=False, separators=(',', ':'), sort_keys=True), encoding='utf-8', newline='\n')
        con = {c: sum(1 for t in titulos[pais].values() if c in t) for c in ('suscripcion', 'gratis', 'alquiler', 'compra')}
        print(f'{pais}: {len(titulos[pais])} fichas con «dónde ver» de {len(cache)} consultadas · {con} · {destino.stat().st_size // 1024} KB')


if __name__ == '__main__':
    main()
