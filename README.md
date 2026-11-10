# dev-bio

A personal developer page: bio, projects and a dated log, in a minimal terminal style. Plain HTML, one stylesheet and three small scripts, with no build step and no dependencies.

## Layout

- **Left column:** bracket menu, projects list, log list.
- **Middle column:** the about section with the portrait, name and links.
- **Right column:** a small terminal that prints a status readout, then takes commands.
- **Narrower screens:** the readout moves under the bio below 1300px, and everything stacks on phones.

## Files

| Path | What it is |
| --- | --- |
| `index.html` | The page |
| `css/style.css` | All styles, Tokyo Night colors |
| `js/readout.js` | Live readout values: Brisbane time, viewer mode, last log date |
| `js/terminal.js` | The terminal: boot run, commands, keyboard shortcuts, online counter |
| `js/switcher.js` | Accent color dot in the top-right corner |
| `img/portrait.png` | Portrait |

## Run it locally

Open `index.html` in a browser. Nothing needs serving.

## Editing content

1. **Projects or log:** add an `<li>` to the list in `index.html`.
   - Log entries go newest first, and the readout's `last log` line reads the top one.
2. **Readout lines:** edit the `<dl>` in `index.html`.
   - The terminal prints whatever is in the list, in order.
   - `time`, `mode` and `last log` are filled by `js/readout.js`.
   - `build` is a fixed date, so update it when you publish.
3. **Accent colors:** each swatch is a `<button class="sw-opt">` with a `data-accent` color.
   - A `data-under` color makes it a two-color swatch.
   - The first swatch is the default.

## Terminal

1. **Load:** the terminal takes focus, and the cursor blinks for 4.5 seconds.
2. **Auto-run:** it types `status` and prints the readout at line-printer pace.
   - Typing or pressing Enter before it starts cancels the auto-run.
3. **Visitor's turn:** the prompt takes commands.

- **Commands:** `help`, `status`, `whoami`, `id`, `ls [projects|log]`, `cat about`, `theme [name]`, `history`, `date`, `echo`, `clear`, `exit`, plus a `sudo` joke.
- **Keys:** Enter, Up/Down history, Tab completion, Ctrl+A/E/K/U, Ctrl+L clear, Ctrl+C cancel, Escape to leave.
- **Without JS:** the plain readout list shows instead.
- **Screen readers:** they get a labelled input, and new output is read aloud after the auto-run.

## Hosting

GitHub Pages serves the `main` branch as-is. `.nojekyll` turns off the Jekyll build.
