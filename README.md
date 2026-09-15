# I ate out

Every place I eat, scored out of ten.

<https://0-draft.github.io/i-ate-out/>

The first batch of candidates is a researched shortlist of Tokyo places that work on your own, but nothing about the app assumes you are alone — `solo` is a flag on a place, and a filter, not the premise.

## Scoring

One number, `0.0` to `10.0`, in steps of `0.5`. A place with a score shows up in the ranking; everything else stays a candidate.

## Views

- **Candidates** — researched, not yet scored
- **Ranking** — your scores, highest first
- **Map** — the places with coordinates, coloured by genre

## Updating

Write a line in an issue and a workflow applies it, commits, replies with what it did and closes the issue.

```text
無敵家 8.5
開楽 7 2026-09-16
新珍味 9 memo=ターロー飯がうまい
無敵家 clear
```

Names are matched loosely, so `無敵家`, `mutekiya` and `無敵家 池袋` all resolve to the same place. The app's "Save as an issue" button prefills the same thing as JSON.

## Data

```text
data/shops.json    name, area, genre, price, hours, note, coordinates, solo
data/ratings.json  scores — the committed source of truth
data/photos.json   which shop ids have a photo (generated)
assets/shops/<id>.jpg
```

The browser keeps a working copy of scores in `localStorage` so a place can be scored at the table. On load, whichever copy has the newer `updatedAt` wins.

No database and no server: GitHub Pages serves the files and issues carry the writes.

### Photos

Drop `assets/shops/<id>.jpg` in and run `npm run photos` to reindex. Cards without a photo fall back to a genre-coloured tile, and every card links out to an image search. Hotlinking photos from review sites is not an option — the licences forbid it and the referrer checks block it anyway.

## Development

No build step: plain HTML, CSS and ES modules, with Leaflet from a CDN.

```bash
npm install
npm run dev      # http://localhost:8777
npm run lint     # data, js, css, markdown
npm test         # node unit tests, then playwright
npm run photos   # reindex assets/shops
```

## Notes

Hours and prices change; check before you go. Eleven places have coordinates verified against OpenStreetMap — the rest link out to a maps search until someone files them.
