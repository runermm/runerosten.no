-- Én rad per tekst: id er f.eks. «artikler/warfare-software», n er antall lyspærer.
CREATE TABLE IF NOT EXISTS lys (
  id TEXT PRIMARY KEY,
  n INTEGER NOT NULL DEFAULT 0
);
