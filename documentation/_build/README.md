# Documentation build

Regenerates every document in `docs/` from the source code, so code excerpts and numbers
(dining window, hold window, limits...) always match the program.

| File | Produces |
|---|---|
| `diagrams.py` + `render.sh` | `docs/uml/architecture`, `flowchart-booking`, `flowchart-waitlist-notification` (SVG -> PNG via Google Chrome) |
| `report.js` | `Project_Report.docx` (university template: cover, index, sections 1-7, source appendix) |
| `setup.js` | `Setup_and_Run_Guide.docx` |
| `concepts.js` | `Concepts_and_Study_Guide.docx` |
| `viva.js` | `Viva_Questions_and_Answers.docx` |
| `demo.js` | `Live_Demo_Script.docx` |
| `presentation.js` | `Presentation_Guide.docx` |
| `deck.js` + `slides_data.js` | `Presentation_Slides.pptx` (slide text and notes shared with the guide) |
| `lib.js` | shared styles, helpers, and code/constant extraction from `src/` |
| `fixfonts.py` | merges the embedded Inter faces into one font entry after each build |

```bash
npm install docx pptxgenjs react react-dom react-icons sharp   # once, anywhere; then point NODE_PATH at it
python3 diagrams.py ../uml && for d in architecture flowchart-booking flowchart-waitlist-notification; do ./render.sh ../uml/$d.svg ../uml/$d.png; done
NODE_PATH=/path/to/node_modules node build.js            # all documents
NODE_PATH=/path/to/node_modules node build.js report     # just one
PPTX_SKILL=/path/to/pptx-skill NODE_PATH=/path/to/node_modules node build.js deck   # the .pptx (applies the theme with the pptx skill's apply_theme.js)
```

`fonts/` holds Inter (SIL Open Font License), embedded into each .docx so the template font
shows even on computers without Inter installed. `class-diagram.svg` in `docs/uml` is hand-laid-out
and rendered with `render.sh`. This folder is not needed to run the application.
