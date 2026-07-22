const NAMES: Record<string, { first: string[]; last: string[] }> = {
  England: { first: ['Oliver','Harry','Jack','Alfie','Lewis','Mason','Callum','Elliot'], last: ['Bennett','Foster','Walsh','Mercer','Hughes','Palmer','Carter','Dawson'] },
  Spain: { first: ['Alejandro','Hugo','Martín','Iker','Adrián','Sergio','Álvaro','Dani'], last: ['Vega','Navarro','Serrano','Molina','Iglesias','Cabrera','Roldán','Méndez'] },
  Italy: { first: ['Lorenzo','Matteo','Riccardo','Davide','Nicolò','Marco','Federico','Tommaso'], last: ['Romano','Conti','Moretti','Rinaldi','De Luca','Ferri','Marchetti','Gallo'] },
  Germany: { first: ['Lukas','Jonas','Felix','Leon','Niklas','Florian','Julian','Maximilian'], last: ['Vogel','Keller','Hartmann','Schuster','Neumann','Brandt','Kramer','Seidel'] },
  France: { first: ['Lucas','Théo','Mathis','Enzo','Hugo','Nathan','Rayan','Antoine'], last: ['Moreau','Leroux','Fontaine','Mercier','Dumont','Garnier','Renard','Chevalier'] },
  Netherlands: { first: ['Daan','Sem','Luuk','Jesse','Milan','Thijs','Bram','Noud'], last: ['de Vries','Van Dijk','Meijer','Smit','Visser','Mulder','Bos','Dekker'] },
  Portugal: { first: ['João','Tiago','Diogo','Gonçalo','Rafael','Tomás','Afonso','Duarte'], last: ['Silva','Pereira','Mendes','Correia','Tavares','Figueira','Moura','Coelho'] },
  Brazil: { first: ['Gabriel','Lucas','Matheus','Vinícius','Rafael','João Pedro','Caio','Bruno'], last: ['Santos','Oliveira','Almeida','Costa','Barbosa','Rocha','Moraes','Pires'] },
  Argentina: { first: ['Santiago','Mateo','Lautaro','Tomás','Valentín','Facundo','Julián','Franco'], last: ['Acosta','Ferreyra','Quiroga','Benítez','Paredes','Roldán','Sosa','Medina'] },
  USA: { first: ['Ethan','Noah','Liam','Caleb','Tyler','Jordan','Miles','Cameron'], last: ['Brooks','Reed','Foster','Hayes','Bennett','Coleman','Turner','Price'] },
  Mexico: { first: ['Diego','Emiliano','Santiago','Sebastián','Gael','Rodrigo','Javier','Mateo'], last: ['Hernández','Cortés','Salazar','Esquivel','Montoya','Treviño','Valdés','Zamora'] },
  Japan: { first: ['Haruto','Ren','Kaito','Sota','Yuto','Riku','Takumi','Daichi'], last: ['Sato','Nakamura','Kobayashi','Watanabe','Ito','Yamamoto','Matsuda','Fujimoto'] },
};

const FALLBACK = { first: ['Alex','Leo','Noah','Daniel','Marco','Adrian','Sam','Nico'], last: ['Silva','Martin','Costa','Vega','Rossi','Santos','Meyer','Marin'] };

function hash(seed: string): number {
  let value = 2166136261;
  for (let i = 0; i < seed.length; i += 1) value = Math.imul(value ^ seed.charCodeAt(i), 16777619);
  return Math.abs(value);
}

export function realisticName(country: string, seed = `${country}-${Math.random()}`): string {
  const pool = NAMES[country] ?? FALLBACK;
  const h = hash(seed);
  return `${pool.first[h % pool.first.length]} ${pool.last[Math.floor(h / 17) % pool.last.length]}`;
}
