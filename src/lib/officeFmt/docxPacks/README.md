# Template packs — add templates without touching the editor

Drop a new `.js` file in this folder and its templates appear in **Templates** (Design tab) the next time the editor opens.
Nothing else to register: the editor loads every `*.js` here (except `index.js`).

```js
import { p, h1, banner, kv, rule, C, PB } from '../docxHtml';

export default {
  id: 'my-faculty',                                        // unique pack id
  label: { en: 'My faculty', ar: 'كليتي' },                // optional: label of the pack
  groups: [{ id: 'faculty', label: { en: 'Faculty forms', ar: 'نماذج الكلية' } }],   // optional: new gallery sections
  templates: [
    {
      id: 'faculty-request',            // unique across all packs
      group: 'faculty',                 // a group above, or an existing one: basic / work / academic / data / letters / covers / creative
      color: '#2b6cdf',                 // colour of the card
      label: { en: 'Request form', ar: 'نموذج طلب' },
      hint:  { en: 'Name, ID, request', ar: 'الاسم والرقم والطلب' },
      insertAt: 'start',                // optional: 'start' | 'cursor' | 'replace' — what the main button does (covers use 'start')
      html: ({ ar, title, today }) => banner(title) + kv([['الاسم', ''], ['الرقم', '']]),   // the document body (same HTML the editor uses)
    },
  ],
  blocks: [ /* optional quick blocks: { id, group, label, color, html } — see ../docxBlocks.js */ ],
};
```

Helpers in `../docxHtml.js`: `p h1 h2 h3 sp b big ul ol rule gap PB td row grid table banner callout kv sign th head blank`.
Page break = `PB`. Tables with no borders = `grid(...)`. Coloured cell = `td(text, 'background-color:#E8EEF9')`.

Users can also save any document as **My template** from the editor itself (stored on their device) and share it as a small `.json` file.
