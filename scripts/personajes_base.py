"""
Crea la lista base de personajes de Marvel (un archivo .md por personaje).
No sobrescribe los que ya existan. Después se editan a mano libremente.

Uso:
    .venv/Scripts/python.exe scripts/personajes_base.py contenido/personajes/marvel
"""
import sys
from pathlib import Path

import yaml

# id | nombre | identidad | alias (separados por ;)
LISTA = """
capitan-america|Capitán América|Steve Rogers|Captain America;Steven Rogers
iron-man|Iron Man|Tony Stark|Toni Stark;Anthony Stark;Hombre de Hierro
thor|Thor|Thor Odinson|Dios del Trueno
hulk|Hulk|Bruce Banner|La Masa;Dr. Bruce Banner;David Banner;Dr. David Banner;David Bruce Banner;Professor Hulk;Smart Hulk
viuda-negra|Viuda Negra|Natasha Romanoff|Black Widow;Natasha Romanov;Natasha
ojo-de-halcon|Ojo de Halcón|Clint Barton|Hawkeye;Ronin
nick-fury|Nick Fury|Nicholas Fury|Nick Furia;Fury
loki|Loki|Loki Laufeyson|Loki Odinson
peggy-carter|Peggy Carter|Margaret Carter|Agente Carter;Agent Carter;Captain Carter;Capitana Carter
soldado-de-invierno|Soldado de Invierno|Bucky Barnes|Winter Soldier;James Buchanan Barnes;James 'Bucky' Barnes;Bucky;Lobo Blanco;White Wolf
falcon|Falcon|Sam Wilson|Halcón
maquina-de-guerra|Máquina de Guerra|James Rhodes|War Machine;Rhodey;James Rhodey;Cnel. James Rhodey;Coronel James Rhodes;Iron Patriot;James 'Rhodey' Rhodes
pepper-potts|Pepper Potts|Virginia Potts|Virginia Pepper Potts;Rescue
happy-hogan|Happy Hogan|Harold Hogan|Happy
howard-stark|Howard Stark||Howar Stark
phil-coulson|Phil Coulson||Agente Coulson;Agent Coulson;Coulson
maria-hill|Maria Hill||Agente Hill
sharon-carter|Sharon Carter||Agente 13;Agent 13
capitana-marvel|Capitana Marvel|Carol Danvers|Captain Marvel;Vers
monica-rambeau|Monica Rambeau||Photon;Spectrum
ms-marvel|Ms. Marvel|Kamala Khan|Ms Marvel
spider-man|Spider-Man|Peter Parker|Hombre Araña;El hombre araña;Spiderman;Spidey
miles-morales|Miles Morales||
gwen-stacy|Gwen Stacy||Spider-Gwen;Ghost-Spider;Spider-Woman (Gwen)
mary-jane|Mary Jane Watson||Mary Jane;MJ
tia-may|Tía May|May Parker|Aunt May;Tia May
j-jonah-jameson|J. Jonah Jameson||Jameson
duende-verde|Duende Verde|Norman Osborn|Green Goblin
doctor-octopus|Doctor Octopus|Otto Octavius|Doc Ock;Dr. Octopus
venom|Venom|Eddie Brock|
black-panther|Black Panther|T'Challa|Pantera Negra;T´Challa
shuri|Shuri||
doctor-strange|Doctor Strange|Stephen Strange|Dr. Strange;Doctor Extraño
wong|Wong||
bruja-escarlata|Bruja Escarlata|Wanda Maximoff|Scarlet Witch;Wanda
vision|Visión||Vision;The Vision
mercurio|Mercurio|Pietro Maximoff|Quicksilver;Peter Maximoff
ant-man|Ant-Man|Scott Lang|
hank-pym|Hank Pym|Henry Pym|Dr. Hank Pym
avispa|La Avispa|Hope van Dyne|The Wasp;Wasp;Hope Van Dyne
janet-van-dyne|Janet van Dyne||Janet Van Dyne
star-lord|Star-Lord|Peter Quill|
gamora|Gamora||
drax|Drax|Drax el Destructor|Drax the Destroyer
rocket|Rocket|Rocket Raccoon|Mapache Rocket
groot|Groot||Baby Groot;Bebé Groot
mantis|Mantis||
nebula|Nebula||
thanos|Thanos||
ultron|Ultrón||Ultron
red-skull|Cráneo Rojo|Johann Schmidt|Red Skull
arnim-zola|Arnim Zola||Dr. Arnim Zola
daredevil|Daredevil|Matt Murdock|Matthew Murdock
kingpin|Kingpin|Wilson Fisk|
karen-page|Karen Page||
foggy-nelson|Foggy Nelson|Franklin Nelson|Foggy
jessica-jones|Jessica Jones||
luke-cage|Luke Cage||
iron-fist|Iron Fist|Danny Rand|
punisher|The Punisher|Frank Castle|El Castigador;Castigador;Punisher
elektra|Elektra|Elektra Natchios|
quake|Quake|Daisy Johnson|Skye
melinda-may|Melinda May||
leo-fitz|Leo Fitz||Fitz
jemma-simmons|Jemma Simmons||Simmons
grant-ward|Grant Ward||
caballero-luna|Caballero Luna|Marc Spector|Moon Knight;Steven Grant
she-hulk|She-Hulk|Jennifer Walters|Hulka
shang-chi|Shang-Chi||Shaun
yelena-belova|Yelena Belova||Yelena
kate-bishop|Kate Bishop||
agatha-harkness|Agatha Harkness||Agatha
kang|Kang|He Who Remains|El que permanece;Kang el Conquistador;Kang the Conqueror;Victor Timely
sylvie|Sylvie||
deadpool|Deadpool|Wade Wilson|
lobezno|Lobezno|Logan|Wolverine;James Howlett
profesor-x|Profesor X|Charles Xavier|Professor X;Profesor Charles Xavier
magneto|Magneto|Erik Lehnsherr|Erik
mistica|Mística|Raven Darkhölme|Mystique;Raven
tormenta|Tormenta|Ororo Munroe|Storm
ciclope|Cíclope|Scott Summers|Cyclops
jean-grey|Jean Grey||Fénix;Phoenix;Fénix Oscura;Dark Phoenix
bestia|Bestia|Hank McCoy|Beast
picara|Pícara|Marie|Rogue
mr-fantastico|Mr. Fantástico|Reed Richards|Mister Fantastic;Mr. Fantastic
mujer-invisible|La Mujer Invisible|Sue Storm|Invisible Woman;Susan Storm
antorcha-humana|La Antorcha Humana|Johnny Storm|Human Torch
la-cosa|La Cosa|Ben Grimm|The Thing;Benjamin Grimm
doctor-doom|Doctor Doom|Victor von Doom|Doctor Muerte;Victor Von Doom
silver-surfer|Silver Surfer|Norrin Radd|Estela Plateada
blade|Blade|Eric Brooks|
ghost-rider|Ghost Rider|Johnny Blaze|El motorista fantasma
morbius|Morbius|Michael Morbius|Dr. Michael Morbius
kraven|Kraven|Sergei Kravinoff|Kraven el Cazador;Kraven the Hunter
madame-web|Madame Web|Cassandra Webb|
howard-el-pato|Howard el Pato||Howard the Duck;Howard
"""


def main(destino):
    destino = Path(destino)
    destino.mkdir(parents=True, exist_ok=True)
    creados = 0
    for linea in LISTA.strip().splitlines():
        ident, nombre, identidad, alias = (linea.split('|') + [''] * 4)[:4]
        archivo = destino / f'{ident}.md'
        if archivo.exists():
            continue
        datos = {'nombre': nombre, 'universo': 'marvel'}
        if identidad:
            datos['identidad'] = identidad
        if alias:
            datos['alias'] = [a.strip() for a in alias.split(';') if a.strip()]
        texto = yaml.safe_dump(datos, allow_unicode=True, sort_keys=False, width=1000)
        archivo.write_text(f'---\n{texto}---\n', encoding='utf-8', newline='\n')
        creados += 1
    print(f'{creados} personajes creados en {destino}')


if __name__ == '__main__':
    main(sys.argv[1])
