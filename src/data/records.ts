export type RecordMetric = 'games' | 'goals' | 'assists' | 'rating';
export interface RecordEntry { name: string; value: number; note?: string; }

const ENGLAND: Record<Exclude<RecordMetric, 'rating'>, [string, number][]> = {
  games: [['Gareth Barry',653],['James Milner',637],['Ryan Giggs',632],['Frank Lampard',609],['David James',572],['Gary Speed',535],['Emile Heskey',516],['Mark Schwarzer',514],['Jamie Carragher',508],['Phil Neville',505]],
  goals: [['Alan Shearer',260],['Harry Kane',213],['Wayne Rooney',208],['Mohamed Salah',190],['Andrew Cole',187],['Sergio Agüero',184],['Frank Lampard',177],['Thierry Henry',175],['Robbie Fowler',163],['Jermain Defoe',162]],
  assists: [['Ryan Giggs',162],['Kevin De Bruyne',119],['Cesc Fàbregas',111],['Wayne Rooney',103],['Frank Lampard',102],['Dennis Bergkamp',94],['David Silva',93],['Steven Gerrard',92],['James Milner',89],['David Beckham',80]],
};
const LEAGUE_SEASON: Record<string, Record<RecordMetric, [string,number][]>> = {
  England: { games: [['Ever-present standard',38],['Full league season',38],['Historic ironman',38]], goals: [['Erling Haaland',36],['Andrew Cole',34],['Alan Shearer',34],['Mohamed Salah',32],['Cristiano Ronaldo',31],['Luis Suárez',31],['Harry Kane',30],['Robin van Persie',30],['Thierry Henry',30],['Kevin Phillips',30]], assists: [['Thierry Henry',20],['Kevin De Bruyne',20],['Mesut Özil',19],['Frank Lampard',18],['Cesc Fàbregas',18],['Kevin De Bruyne',18],['Mohamed Salah',18],['Ryan Giggs',16],['Eric Cantona',16],['David Silva',15]], rating: [['Historic elite season',8.65],['Ballon d’Or-level year',8.5],['League MVP standard',8.3],['Exceptional season',8.15],['World-class season',8.0],['Elite starter',7.85],['Team of season level',7.7],['Excellent',7.55],['Very good',7.4],['Strong',7.25]] },
};

const LEAGUE_LEADERS: Record<string, Record<RecordMetric, [string, number][]>> = {
  England: { ...ENGLAND, rating: LEAGUE_SEASON.England.rating },
  Spain: { goals: [['Lionel Messi',474],['Cristiano Ronaldo',311],['Telmo Zarra',251],['Karim Benzema',238],['Hugo Sánchez',234],['Raúl',228],['Alfredo Di Stéfano',227],['César Rodríguez',221],['Quini',219],['Pahiño',210]], assists: [['Lionel Messi',192],['Xavi',117],['Karim Benzema',104],['Dani Alves',101],['Cristiano Ronaldo',95],['Andrés Iniesta',87],['Luis Suárez',84],['Iker Muniain',80],['Joaquín',79],['Toni Kroos',70]], games: [['Andoni Zubizarreta',622],['Joaquín',622],['Raúl García',609],['Raúl',550],['Eusebio Sacristán',543],['Sergio Ramos',536],['Paco Buyo',542],['Manolo Sanchís',523],['Iker Casillas',510],['Lionel Messi',520]], rating: LEAGUE_SEASON.England.rating },
  Italy: { goals: [['Silvio Piola',274],['Francesco Totti',250],['Gunnar Nordahl',225],['José Altafini',216],['Giuseppe Meazza',216],['Antonio Di Natale',209],['Roberto Baggio',205],['Ciro Immobile',201],['Kurt Hamrin',190],['Alessandro Del Piero',188]], assists: [['Francesco Totti',150],['Roberto Baggio',118],['Alessandro Del Piero',105],['Andrea Pirlo',98],['Antonio Cassano',91],['Kaká',85],['Marek Hamšík',82],['Pavel Nedvěd',80],['Zlatan Ibrahimović',79],['Álvaro Recoba',75]], games: [['Gianluigi Buffon',657],['Paolo Maldini',647],['Francesco Totti',619],['Javier Zanetti',615],['Gianluca Pagliuca',592],['Dino Zoff',570],['Samir Handanović',566],['Pietro Vierchowod',562],['Roberto Mancini',541],['Silvio Piola',537]], rating: LEAGUE_SEASON.England.rating },
};

const NATIONAL: Record<string, Record<'games'|'goals'|'assists', [string,number][]>> = {
  Spain: { games: [['Sergio Ramos',180],['Iker Casillas',167],['Sergio Busquets',143],['Xavi',133],['Andrés Iniesta',131],['Andoni Zubizarreta',126],['David Silva',125],['Xabi Alonso',114],['Cesc Fàbregas',110],['Fernando Torres',110]], goals: [['David Villa',59],['Raúl',44],['Fernando Torres',38],['Álvaro Morata',37],['David Silva',35],['Fernando Hierro',29],['Álvaro Negredo',21],['Míchel',21],['Sergio Ramos',23],['Julio Salinas',22]], assists: [['Cesc Fàbregas',31],['David Silva',29],['Xavi',24],['Andrés Iniesta',23],['Jordi Alba',22],['Sergio Busquets',18],['Pedri',17],['Dani Olmo',16],['Fernando Torres',15],['David Villa',15]] },
  Argentina: { games: [['Lionel Messi',190],['Javier Mascherano',147],['Ángel Di María',145],['Javier Zanetti',143],['Nicolás Otamendi',130],['Sergio Agüero',101],['Roberto Ayala',115],['Diego Simeone',106],['Ángel Correa',95],['Diego Maradona',91]], goals: [['Lionel Messi',112],['Gabriel Batistuta',54],['Sergio Agüero',42],['Hernán Crespo',35],['Diego Maradona',34],['Gonzalo Higuaín',31],['Ángel Di María',31],['Lautaro Martínez',30],['Luis Artime',24],['Daniel Passarella',23]], assists: [['Lionel Messi',58],['Ángel Di María',30],['Diego Maradona',26],['Juan Román Riquelme',17],['Sergio Agüero',15],['Javier Saviola',14],['Gonzalo Higuaín',13],['Lautaro Martínez',12],['Claudio Caniggia',11],['Pablo Aimar',10]] },
  England: { games: [['Peter Shilton',125],['Wayne Rooney',120],['David Beckham',115],['Steven Gerrard',114],['Bobby Moore',108],['Ashley Cole',107],['Frank Lampard',106],['Bobby Charlton',106],['Harry Kane',105],['Billy Wright',105]], goals: [['Harry Kane',70],['Wayne Rooney',53],['Bobby Charlton',49],['Gary Lineker',48],['Jimmy Greaves',44],['Michael Owen',40],['Nat Lofthouse',30],['Alan Shearer',30],['Tom Finney',30],['Vivian Woodward',29]], assists: [['David Beckham',42],['Steven Gerrard',23],['Wayne Rooney',21],['Raheem Sterling',20],['Frank Lampard',18],['Bukayo Saka',17],['Harry Kane',17],['Paul Scholes',16],['Dele Alli',15],['Phil Foden',14]] },
  Portugal: { games: [['Cristiano Ronaldo',225],['João Moutinho',146],['Pepe',141],['Bruno Alves',96],['Rui Patrício',108],['Luís Figo',127],['Bernardo Silva',105],['Fernando Couto',110],['Nani',112],['Ricardo Carvalho',77]], goals: [['Cristiano Ronaldo',140],['Pauleta',47],['Eusébio',41],['Luís Figo',32],['Nuno Gomes',29],['Hélder Postiga',27],['Rui Costa',26],['Nani',24],['João Pinto',23],['Bruno Fernandes',23]], assists: [['Cristiano Ronaldo',46],['Luís Figo',29],['Bernardo Silva',25],['Bruno Fernandes',24],['João Moutinho',18],['Nani',17],['Rui Costa',16],['Ricardo Quaresma',15],['Diogo Jota',11],['João Félix',10]] },
};

function generic(metric: RecordMetric): [string, number][] {
  const top = metric === 'games' ? 620 : metric === 'goals' ? 310 : metric === 'assists' ? 155 : 8.6;
  return Array.from({length:10},(_,i)=>[`Historic ${metric} leader ${i+1}`, typeof top === 'number' ? +(top*(1-i*0.055)).toFixed(metric==='rating'?2:0) : top]);
}

export function leagueCareerRecords(country: string, metric: RecordMetric): RecordEntry[] {
  const rows = LEAGUE_LEADERS[country]?.[metric] ?? generic(metric);
  return rows.map(([name,value])=>({name,value}));
}
export function leagueSeasonRecords(country: string, metric: RecordMetric): RecordEntry[] {
  const rows = LEAGUE_SEASON[country]?.[metric] ?? (metric === 'games' ? generic('games').map(([n])=>[n,38] as [string,number]) : metric === 'goals' ? generic('goals').map(([n,v])=>[n,Math.round(v/9)] as [string,number]) : metric === 'assists' ? generic('assists').map(([n,v])=>[n,Math.round(v/7)] as [string,number]) : generic('rating'));
  return rows.map(([name,value])=>({name,value}));
}
export function nationalRecords(country: string, metric: 'games'|'goals'|'assists'): RecordEntry[] {
  const rows = NATIONAL[country]?.[metric] ?? generic(metric);
  return rows.map(([name,value])=>({name,value}));
}
