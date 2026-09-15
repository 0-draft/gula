# GULA

A ledger for eating alone. 119 places you can walk into by yourself, rated on four axes.

<https://0-draft.github.io/gula/>

## Rating

One star is not enough, so there are four. The overall score is their weighted mean; unrated axes drop out of the calculation.

| Axis | What it measures | Weight |
| --- | --- | --- |
| うまい | Would you eat it again | ×3 |
| ひとり居心地 | Comfortable on your own | ×2 |
| 安い | Value for what you paid | ×1 |
| 入りやすい | Seated without queuing | ×1 |

Status (`todo` / `visited`) and a `love` flag are tracked separately. Stars are a score; love is whether you go back.

## Data

```text
data/shops.json    name, area, genre, price, hours, note, coordinates
data/ratings.json  stars, status, memo — the committed source of truth
```

The browser keeps a working copy in `localStorage` so stars can be tapped at the table. On load, the copy with the newer `updatedAt` wins.

No database and no server: GitHub Pages serves the files, and ratings reach the repo through an issue.

## Updating

Open an issue from a template: record a visit, add a shop, or fix wrong information. The data files are updated from there.

## Development

No build step — plain HTML, CSS and ES modules, with Leaflet from a CDN.

```bash
npm install
npm run dev    # http://localhost:8777
npm run lint   # data, js, css, markdown
npm test       # playwright smoke tests
```

## Notes

Hours and prices change; check before you go. 14 shops have coordinates verified against OpenStreetMap — the rest link out to a maps search until someone files them.
