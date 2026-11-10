# dev-bio

A personal developer page: bio, projects and a dated log, in a minimal terminal style. Plain HTML, one stylesheet and a few small scripts, with no build step and no dependencies.

## Layout

- **Left column:** bracket menu, projects list, log list.
- **Middle column:** the about section with the portrait, name and links.
- **Right column:** a small terminal that prints a status readout, then takes commands.
- **Narrower screens:** the readout moves under the bio below 1300px, and everything stacks on phones.
- **Post pages:** the article and the terminal side by side, with the terminal under the article below 1300px.

## Files

| Path | What it is |
| --- | --- |
| `index.html` | The home page |
| `log/*.html` | Log posts, one page each |
| `log/_template.html` | Starting point for a new post |
| `css/style.css` | All styles, Tokyo Night colors |
| `js/readout.js` | Live readout values: Brisbane time, viewer mode, last log date |
| `js/content.js` | The terminal's text: its files, help list and messages |
| `js/term-screen.js` | The terminal's screen: its elements, printing and output pace |
| `js/term-fs.js` | The terminal's files, and the `ls` and `cat` commands |
| `js/term-commands.js` | The terminal's command list |
| `js/term-editor.js` | The prompt line: history, Tab completion, keyboard shortcuts |
| `js/terminal.js` | Starts the terminal: boot run, command handling, online counter |
| `js/switcher.js` | Accent color dot in the top-right corner |
| `img/portrait.png` | Portrait |

## Run it locally

Open `index.html` in a browser. Nothing needs serving.

## Editing content

1. **Projects:** add an `<li>` to the projects list in `index.html`.
2. **New post:**
   1. Copy `log/_template.html` to `log/<slug>.html`.
   2. Replace the title, description, date and body.
   3. Add a line to the top of the log list in `index.html`, linking to the post.
   - Log entries go newest first, and the readout's `last log` line reads the top one.
3. **Shared parts:** each post carries its own copy of the bio text, readout and color switcher.
   - Posts show the article and the terminal. The bio text is hidden and feeds `cat about.md`.
   - When you change one of them in `index.html`, change it in the template and every post too.
4. **Readout lines:** edit the `<dl>` in `index.html`.
   - The terminal prints whatever is in the list, in order.
   - `time`, `mode` and `last log` are filled by `js/readout.js`.
   - `build` is a fixed date, so update it when you publish.
5. **Accent colors:** each swatch is a `<button class="sw-opt">` with a `data-accent` color.
   - A `data-under` color makes it a two-color swatch.
   - The first swatch is the default.

## Terminal

1. **Load:** the cursor blinks for 4.5 seconds. On the home page the terminal also takes focus. Post pages leave focus on the article.
2. **Auto-run:** it types `status` and prints the readout at line-printer pace.
   - Typing or pressing Enter before it starts cancels the auto-run.
3. **Visitor's turn:** the prompt takes commands.

- **Stop output:** a click on the terminal or Ctrl+C while it prints stops the output and leaves an empty prompt. Before the auto-run starts, either one cancels it.
  - On touch screens only a tap counts, so scrolling past the terminal doesn't stop it.
  - When nothing is printing, a click only focuses the prompt, so output stays selectable, and Ctrl+C cancels the typed line.
- **Commands:** `help`, `status`, `whoami`, `id`, `ls [-alth] [path]`, `cat <file>`, `pwd`, `theme [name]`, `history`, `date`, `echo`, `clear`, `exit`, plus `sudo` and `rm` jokes.
- **Files:** home holds `about.md`, `log/` and `projects/`, set in `js/content.js`.
  - `log/` and `projects/` fill from the lists in `index.html`, and `about.md` reads the bio.
  - Log dates are real. Sizes and clock times are made up, but stay the same on every visit.
- **Keys:** Enter, Up/Down history, Tab completion, Ctrl+A/E/K/U, Ctrl+L clear, Ctrl+C cancel or stop, Escape to leave.
- **Scripts:** `js/content.js` and the `js/term-*.js` files load before `js/terminal.js`, which starts the terminal. They are plain scripts, so the page works opened straight from disk.
- **Without JS:** the plain readout list shows instead.
- **Screen readers:** they get a labelled input, and new output is read aloud after the auto-run.

## Hosting

GitHub Pages serves the `main` branch as-is. `.nojekyll` turns off the Jekyll build.
