/**
 * Specialist terminology and alias expansion for search.
 * Maps common abbreviations, nicknames and misspellings to canonical terms
 * so "SBC intake", "small block chevy intake" and "chevy 350 intake" all match.
 */

export const TERM_ALIASES: Record<string, string[]> = {
  sbc: ["small block chevy", "small block chevrolet", "chevy small block"],
  bbc: ["big block chevy", "big block chevrolet", "rat motor"],
  sbf: ["small block ford", "ford windsor"],
  windsor: ["ford windsor", "small block ford"],
  cleveland: ["ford cleveland", "351c"],
  ls: ["gm ls", "ls1", "ls2", "ls3", "lsx"],
  mopar: ["dodge", "plymouth", "chrysler"],
  hemi: ["mopar hemi", "426 hemi"],
  "289": ["ford windsor", "small block ford"],
  "302": ["ford windsor", "small block ford"],
  "351": ["ford windsor", "ford cleveland"],
  "351w": ["ford windsor 351"],
  "351c": ["ford cleveland 351"],
  "350": ["small block chevy"],
  "327": ["small block chevy"],
  "305": ["small block chevy"],
  "283": ["small block chevy"],
  "396": ["big block chevy"],
  "427": ["big block chevy", "ford fe"],
  "454": ["big block chevy"],
  "318": ["mopar la"],
  "340": ["mopar la"],
  "360": ["mopar la"],
  "383": ["mopar big block", "chevy stroker"],
  "440": ["mopar big block"],
  carb: ["carburettor", "carburetor"],
  carburetor: ["carburettor"],
  carburettor: ["carburetor"],
  carby: ["carburettor"],
  distributer: ["distributor"],
  dizzy: ["distributor"],
  tranny: ["transmission"],
  gearbox: ["transmission"],
  diff: ["differential"],
  shocks: ["shock absorbers", "springs shocks"],
  rims: ["wheels"],
  mags: ["wheels"],
  tires: ["tyres"],
  tyres: ["tires"],
  headlamp: ["headlight"],
  stang: ["mustang"],
  vette: ["corvette"],
  cuda: ["barracuda"],
  moulding: ["molding", "trim"],
  inlet: ["intake"],
  manifold: ["intake manifold"],
  cam: ["camshaft"],
  lifters: ["tappets"],
  tappets: ["lifters"],
  "head gasket": ["cylinder head gasket"],
  "water pump": ["waterpump"],
  waterpump: ["water pump"],
  radiator: ["cooling"],
  disk: ["disc"],
  rotor: ["disc rotor brake"],
  booster: ["brake booster"],
  efi: ["fuel injection"],
  hp: ["horsepower"],
};

/** Expand a raw query with alias terms. Returns the original plus expansions. */
export function expandQuery(query: string): string {
  const lower = query.toLowerCase();
  const extra = new Set<string>();
  for (const [term, expansions] of Object.entries(TERM_ALIASES)) {
    // match whole words (incl. numeric terms like 350)
    const re = new RegExp(`(^|[^a-z0-9])${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}($|[^a-z0-9])`, "i");
    if (re.test(lower)) {
      for (const e of expansions) extra.add(e);
    }
  }
  return extra.size ? `${query} ${[...extra].join(" ")}` : query;
}
