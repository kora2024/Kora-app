// ==============================================
// Les "fantômes fondateurs" de KORA
// Ces Éclats rendent le monde habitable au lancement
// Les vrais contenus Culture Connect 2026 les remplaceront en Mai
// ==============================================

export interface MockEclat {
  id: string;
  text: string;
  author: string;
  role: 'Griot' | 'Habitant' | 'Bâtisseur';
  territoire: string;
  lat: number;
  lng: number;
  color: string; // Hex color for the point
  createdAt: string;
}

export const MOCK_ECLATS: MockEclat[] = [
  {
    id: 'mock-ftf-001',
    text: 'Ce son est né cette nuit. Pas de titre encore.',
    author: 'Kévin Désir',
    role: 'Griot',
    territoire: 'Fort-de-France',
    lat: 14.6,
    lng: -61.0,
    color: '#A65D47', // Terracotta
    createdAt: '2025-06-01T20:30:00Z',
  },
  {
    id: 'mock-lag-001',
    text: 'La diaspora afrobeat frappe aux portes des Caraïbes.',
    author: 'Pulse Records',
    role: 'Bâtisseur',
    territoire: 'Lagos',
    lat: 6.5,
    lng: 3.4,
    color: '#FFD700', // Or
    createdAt: '2025-06-01T18:15:00Z',
  },
  {
    id: 'mock-par-001',
    text: 'Mon grand-père parlait créole à la maison.',
    author: 'Marie-Claire',
    role: 'Habitant',
    territoire: 'Paris',
    lat: 48.8,
    lng: 2.3,
    color: '#4A7FA5', // Bleu
    createdAt: '2025-06-01T14:00:00Z',
  },
  {
    id: 'mock-dak-001',
    text: 'La kora a 21 cordes. Chaque corde une voix.',
    author: 'Griot Sénégal',
    role: 'Griot',
    territoire: 'Dakar',
    lat: 14.7,
    lng: -17.4,
    color: '#D4A574', // Or chaud
    createdAt: '2025-06-01T16:45:00Z',
  },
  {
    id: 'mock-lon-001',
    text: 'Caribbean cuisine is cultural sovereignty.',
    author: 'Robert',
    role: 'Griot',
    territoire: 'Londres',
    lat: 51.5,
    lng: -0.1,
    color: '#7A9E7E', // Vert sage
    createdAt: '2025-06-01T12:30:00Z',
  },
  {
    id: 'mock-bog-001',
    text: 'Afro-descendant. Fier. Présent.',
    author: 'Amara',
    role: 'Griot',
    territoire: 'Bogotá',
    lat: 4.7,
    lng: -74.0,
    color: '#8B6AA0', // Violet
    createdAt: '2025-06-01T10:00:00Z',
  },
  {
    id: 'mock-nyc-001',
    text: 'The diaspora has always been global.',
    author: 'James',
    role: 'Habitant',
    territoire: 'New York',
    lat: 40.7,
    lng: -74.0,
    color: '#2C3E50', // Bleu foncé
    createdAt: '2025-06-01T08:00:00Z',
  },
  {
    id: 'mock-abi-001',
    text: 'Ici aussi la culture pulse.',
    author: 'Kofi',
    role: 'Griot',
    territoire: 'Abidjan',
    lat: 5.3,
    lng: -4.0,
    color: '#9ACD32', // Or vert
    createdAt: '2025-06-01T19:00:00Z',
  },
];

// Role badge colors
export const ROLE_COLORS = {
  Griot: '#A65D47',    // Terracotta
  Habitant: '#4A7FA5', // Bleu
  Bâtisseur: '#FFD700', // Or
};
