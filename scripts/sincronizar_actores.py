"""
Datos de TMDB de los actores y actrices con página propia (/actores/<id>/): fecha y lugar de nacimiento, fallecimiento
y un extracto de la biografía en español y en inglés. Se guardan en datos/actores-tmdb.json, que se sube al repositorio.

Qué actores tienen página lo decide la web al compilar (src/lib/actores.ts, MIN_OBRAS). Por eso este script lee la
web ya compilada: compila antes (npm run build) y luego ejecútalo.

Uso:
    .venv/Scripts/python.exe scripts/sincronizar_actores.py [--refrescar]

- Las respuestas de TMDB se guardan en cache/tmdb/ (no se sube); --refrescar las vuelve a pedir.
- La biografía se corta en BIO_MAX caracteres, al final de una frase.
"""
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import tmdb  # noqa: E402

RAIZ = Path(__file__).resolve().parent.parent
DIST = RAIZ / 'dist' / 'actores'
SALIDA = RAIZ / 'datos' / 'actores-tmdb.json'
BIO_MAX = 700


def extracto(texto):
    """Primeros párrafos de la biografía, sin pasar de BIO_MAX y cortando al final de una frase."""
    texto = re.sub(r'\s*\n\s*\n\s*', '\n\n', (texto or '').strip())
    if not texto:
        return None
    if len(texto) <= BIO_MAX:
        return texto
    corte = texto[:BIO_MAX]
    fin = max(corte.rfind('. '), corte.rfind('.\n'))
    return corte[: fin + 1] if fin > BIO_MAX // 3 else corte.rsplit(' ', 1)[0] + '…'


def main():
    refrescar = '--refrescar' in sys.argv
    if not DIST.exists():
        raise SystemExit('Compila antes la web (npm run build): falta dist/actores/')
    ids = {}
    for carpeta in sorted(DIST.iterdir()):
        html = carpeta / 'index.html'
        if html.exists():
            m = re.search(r'themoviedb\.org/person/(\d+)', html.read_text(encoding='utf-8'))
            if m:
                ids[carpeta.name] = int(m.group(1))
    datos = {}
    for pagina, id_ in ids.items():
        es = tmdb.get(f'/person/{id_}', refrescar=refrescar, language='es-ES') or {}
        en = tmdb.get(f'/person/{id_}', refrescar=refrescar, language='en-US') or {}
        fila = {
            'idTmdb': id_,
            'nacimiento': en.get('birthday') or None,
            'fallecimiento': en.get('deathday') or None,
            'lugar': en.get('place_of_birth') or None,
            'bio': {'es': extracto(es.get('biography')), 'en': extracto(en.get('biography'))},
        }
        datos[pagina] = {k: v for k, v in fila.items() if v not in (None, {})}
    SALIDA.write_text(json.dumps(datos, ensure_ascii=False, indent=1, sort_keys=True) + '\n', encoding='utf-8')
    con = lambda f: sum(1 for d in datos.values() if f(d))  # noqa: E731
    print(f'{len(datos)} actores · nacimiento: {con(lambda d: d.get("nacimiento"))} · '
          f'biografía es: {con(lambda d: d["bio"].get("es"))} · en: {con(lambda d: d["bio"].get("en"))}')


if __name__ == '__main__':
    main()
