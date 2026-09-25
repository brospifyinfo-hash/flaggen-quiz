// Motive für „Was ist das“. Die Fotos liegen unter public/motive, die Zeichnung ist nur der Ersatz.
import { ZUSATZ } from './zusatz'
export type MotivGruppe = 'autos' | 'marken' | 'orte' | 'natur' | 'rap'

export interface MotivEintrag {
  id: string
  /** Was als Antwort dasteht */
  name: string
  gruppe: MotivGruppe
  /** Ein Satz in der Auflösung */
  hinweis: string
  /** Rap: der Künstler ist die Antwort, die Motiv-ID gehört zum Album */
  antwort?: string
  /** Rap: dieser Titel steht auf dem Cover, der Künstler nicht */
  titel?: string
}

const BASIS: MotivEintrag[] = [
  { id: 'vw', name: 'Volkswagen', gruppe: 'autos', hinweis: 'Zwei Buchstaben im Kreis, das Zeichen aus Wolfsburg.' },
  { id: 'mercedes', name: 'Mercedes-Benz', gruppe: 'autos', hinweis: 'Der Stern steht für Motoren auf dem Land, auf dem Wasser und in der Luft.' },
  { id: 'bmw', name: 'BMW', gruppe: 'autos', hinweis: 'Blau und Weiß im Kreis, die Farben aus dem bayerischen Wappen.' },
  { id: 'audi', name: 'Audi', gruppe: 'autos', hinweis: 'Vier Ringe für die vier Firmen, die 1932 zusammenkamen.' },
  { id: 'porsche', name: 'Porsche', gruppe: 'autos', hinweis: 'Das Wappen von Stuttgart trägt ein Pferd, drum herum die Farben Württembergs.' },
  { id: 'opel', name: 'Opel', gruppe: 'autos', hinweis: 'Der Blitz erinnert an einen schnellen Kurier aus der Frühzeit der Firma.' },
  { id: 'ferrari', name: 'Ferrari', gruppe: 'autos', hinweis: 'Das gelbe Schild mit dem schwarzen Pferd kommt aus Maranello.' },
  { id: 'toyota', name: 'Toyota', gruppe: 'autos', hinweis: 'Drei Ellipsen: zwei für den Kunden und das Haus, eine für die Welt.' },
  { id: 'ford', name: 'Ford', gruppe: 'autos', hinweis: 'Der Schriftzug im blauen Oval ist das Zeichen aus Detroit.' },
  { id: 'tesla', name: 'Tesla', gruppe: 'autos', hinweis: 'Das T steht für den Namen des Physikers Nikola Tesla.' },
  { id: 'fiat', name: 'Fiat', gruppe: 'autos', hinweis: 'Der Name ist die Abkürzung für Fabbrica Italiana Automobili Torino.' },
  { id: 'honda', name: 'Honda', gruppe: 'autos', hinweis: 'Das H im abgerundeten Viereck gehört zum Haus aus Hamamatsu.' },

  { id: 'nike', name: 'Nike', gruppe: 'marken', hinweis: 'Der Schwung heißt Swoosh und steht für die Siegesgöttin Nike.' },
  { id: 'adidas', name: 'Adidas', gruppe: 'marken', hinweis: 'Drei Streifen, benannt nach dem Gründer Adi Dassler.' },
  { id: 'apple', name: 'Apple', gruppe: 'marken', hinweis: 'Der angebissene Apfel ist das Zeichen aus Cupertino.' },
  { id: 'lego', name: 'Lego', gruppe: 'marken', hinweis: 'Der rote Stein mit den Noppen, der Name kommt vom dänischen „leg godt“.' },
  { id: 'milka', name: 'Milka', gruppe: 'marken', hinweis: 'Die lila Kuh wirbt seit über hundert Jahren für die Alpenmilch-Schokolade.' },
  { id: 'haribo', name: 'Haribo', gruppe: 'marken', hinweis: 'Der Goldbär, der Firmenname setzt sich aus Hans Riegel Bonn zusammen.' },

  { id: 'brandenburg', name: 'Brandenburger Tor', gruppe: 'orte', hinweis: 'Das Tor in Berlin, obenauf die Quadriga mit der Siegesgöttin.' },
  { id: 'eiffel', name: 'Eiffelturm', gruppe: 'orte', hinweis: 'Der Eisengittermast in Paris, gebaut für die Weltausstellung 1889.' },
  { id: 'kolosseum', name: 'Kolosseum', gruppe: 'orte', hinweis: 'Das Amphitheater in Rom, früher Arena für Spiele vor zehntausenden Menschen.' },
  { id: 'freiheit', name: 'Freiheitsstatue', gruppe: 'orte', hinweis: 'Sie steht auf Liberty Island vor New York, ein Geschenk aus Frankreich.' },
  { id: 'bigben', name: 'Big Ben', gruppe: 'orte', hinweis: 'Der Uhrturm am Palace of Westminster in London. Big Ben ist genau genommen die Glocke.' },
  { id: 'taj', name: 'Taj Mahal', gruppe: 'orte', hinweis: 'Das weiße Grabmal in Agra, gebaut von Shah Jahan für seine Frau Mumtaz.' },
  { id: 'pyramiden', name: 'Pyramiden von Gizeh', gruppe: 'orte', hinweis: 'Die Gräber der Pharaonen am Rand von Kairo, die größte für Cheops.' },
  { id: 'sydney', name: 'Opernhaus Sydney', gruppe: 'orte', hinweis: 'Die weißen Schalen am Hafen von Sydney, entworfen von Jørn Utzon.' },
  { id: 'mauer', name: 'Chinesische Mauer', gruppe: 'orte', hinweis: 'Die Befestigung zieht sich über Bergrücken im Norden Chinas.' },
  { id: 'neuschwanstein', name: 'Schloss Neuschwanstein', gruppe: 'orte', hinweis: 'Das Schloss Ludwigs II. über Hohenschwangau in Bayern.' },
  { id: 'dom', name: 'Kölner Dom', gruppe: 'orte', hinweis: 'Die gotische Kathedrale am Rhein, mit den beiden hohen Türmen.' },
  { id: 'sagrada', name: 'Sagrada Família', gruppe: 'orte', hinweis: 'Die Basilika in Barcelona, Antoni Gaudís Lebenswerk, bis heute unvollendet.' },

  { id: 'loewe', name: 'Löwe', gruppe: 'natur', hinweis: 'Die Mähne trägt das Männchen. Löwen leben in Rudeln in Afrika und einem kleinen Rest in Indien.' },
  { id: 'panda', name: 'Panda', gruppe: 'natur', hinweis: 'Der Große Panda frisst fast nur Bambus und lebt in den Bergen Chinas.' },
  { id: 'pinguin', name: 'Pinguin', gruppe: 'natur', hinweis: 'Er fliegt nicht, schwimmt aber ausgezeichnet. Die meisten Arten leben auf der Südhalbkugel.' },
  { id: 'elefant', name: 'Elefant', gruppe: 'natur', hinweis: 'Der Rüssel ist Nase und Hand zugleich. Afrikanische Elefanten haben größere Ohren.' },
  { id: 'giraffe', name: 'Giraffe', gruppe: 'natur', hinweis: 'Mit dem langen Hals erreicht sie Blätter, an die andere nicht herankommen.' },
  { id: 'fuchs', name: 'Fuchs', gruppe: 'natur', hinweis: 'Der Rotfuchs ist ein Einzelgänger und in Europa weit verbreitet.' },
  { id: 'eule', name: 'Eule', gruppe: 'natur', hinweis: 'Die nach vorn gerichteten Augen und der Gesichtsschleier gehören zu den Eulen.' },
  { id: 'delfin', name: 'Delfin', gruppe: 'natur', hinweis: 'Ein Zahnwal, kein Fisch. Delfine orientieren sich mit Echos.' },
  { id: 'rose', name: 'Rose', gruppe: 'natur', hinweis: 'Die Blüte mit den vielen Blättern und den Stacheln am Stiel.' },
  { id: 'sonnenblume', name: 'Sonnenblume', gruppe: 'natur', hinweis: 'Die große Scheibe dreht sich als Knospe zur Sonne, die reife Blüte bleibt nach Osten stehen.' },
  { id: 'kaktus', name: 'Kaktus', gruppe: 'natur', hinweis: 'Die Säule speichert Wasser, die Stacheln sind umgewandelte Blätter.' },
  { id: 'eiche', name: 'Eiche', gruppe: 'natur', hinweis: 'Am Baum hängen Eicheln. Eichen können mehrere hundert Jahre alt werden.' },

  { id: 'berlin', name: 'Capital Bra', gruppe: 'rap', antwort: 'capital', titel: 'Berlin lebt', hinweis: '„Berlin lebt“ ist das Album, mit dem Capital Bra 2018 ganz oben in den Charts stand.' },
  { id: 'anthrazit', name: 'RAF Camora', gruppe: 'rap', antwort: 'raf', titel: 'Anthrazit', hinweis: '„Anthrazit“ ist RAF Camoras Album von 2017.' },
  { id: 'hollywood', name: 'Bonez MC', gruppe: 'rap', antwort: 'bonez', titel: 'Hollywood', hinweis: '„Hollywood“ brachte Bonez MC 2020 als Soloalbum heraus.' },
  { id: 'ich', name: 'Sido', gruppe: 'rap', antwort: 'sido', titel: 'Ich', hinweis: '„Ich“ ist Sidos zweites Album, erschienen 2006.' },
  { id: 'bordstein', name: 'Bushido', gruppe: 'rap', antwort: 'bushido', titel: 'Vom Bordstein bis zur Skyline', hinweis: 'Bushidos Album von 2003, oft nur „Bordstein“ genannt.' },
  { id: 'raop', name: 'Cro', gruppe: 'rap', antwort: 'cro', titel: 'Raop', hinweis: '„Raop“ ist Cros Debütalbum von 2012, der Titel dreht das Wort Rap um.' },
  { id: 'triebwerke', name: 'Alligatoah', gruppe: 'rap', antwort: 'alligatoah', titel: 'Triebwerke', hinweis: '„Triebwerke“ ist Alligatoahs Album von 2013.' },
  { id: 'hinterland', name: 'Casper', gruppe: 'rap', antwort: 'casper', titel: 'Hinterland', hinweis: 'Caspers Album „Hinterland“ erschien 2013.' },
  { id: 'hurra', name: 'K.I.Z', gruppe: 'rap', antwort: 'kiz', titel: 'Hurra die Welt geht unter', hinweis: 'Das Album von K.I.Z kam 2015 heraus.' },
  { id: 'roulette', name: 'Haftbefehl', gruppe: 'rap', antwort: 'haftbefehl', titel: 'Russisch Roulette', hinweis: 'Haftbefehls Album „Russisch Roulette“ erschien 2014.' },
  { id: 'treppenhaus', name: 'Apache 207', gruppe: 'rap', antwort: 'apache', titel: 'Treppenhaus', hinweis: '„Treppenhaus“ ist das Debütalbum von Apache 207, 2020.' },
  { id: 'erde', name: 'Kontra K', gruppe: 'rap', antwort: 'kontra', titel: 'Erde & Knochen', hinweis: 'Kontra K veröffentlichte „Erde & Knochen“ 2021.' },
]

export const KATALOG: MotivEintrag[] = [...BASIS, ...ZUSATZ]

const BY_ID = new Map(KATALOG.map((eintrag) => [eintrag.id, eintrag]))

export const motivById = (id: string) => BY_ID.get(id)

export const motiveDerGruppe = (gruppe: MotivGruppe) => KATALOG.filter((eintrag) => eintrag.gruppe === gruppe)

export const antwortVon = (eintrag: MotivEintrag) => eintrag.antwort ?? eintrag.id
