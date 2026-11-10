// Everything the terminal shows that isn't on the page: its files, help, messages and easter eggs.
// js/terminal.js and js/term-*.js hold the behavior only. Page content (projects, log, bio, readout) stays in the HTML.
// Messages fill {placeholders} from the command that prints them.
window.TERM_CONTENT = {
  user: "dev",
  home: "/home/dev",

  // Files in the home directory.
  // page: the file's text is read from this element. text: the file's text, written here.
  // from: a folder filled from a page list, as "posts" (one file per link) or "folders" (one folder per link).
  // Dates come from the log list or the readout's build line. Sizes and clock times are made up but stable.
  files: [
    { name: "about.md", page: "#about p" },
    { name: ".plan", text: "nothing planned yet. check the log." },
    { name: "log", from: { list: "#log + ul li", as: "posts", ext: ".md" } },
    { name: "projects", from: { list: "#projects + ul li a", as: "folders" } }
  ],

  help: [
    ["status", "machine readout"],
    ["whoami", "who's logged in"],
    ["id", "user id"],
    ["ls", "[-alth] [path]"],
    ["cat", "<file>  try: cat about.md"],
    ["pwd", "print working directory"],
    ["theme", "[name]  change the accent color"],
    ["history", "commands so far"],
    ["date", "local time in Brisbane"],
    ["echo", "<text>"],
    ["clear", "clear the screen (ctrl+l)"],
    ["exit", "log out"]
  ],

  // Commands left out of help and Tab completion.
  hidden: ["nmap"],

  messages: {
    inputLabel: "Terminal command. Type help for a list.",
    outputLabel: "Terminal output",
    online: "online ",
    notFound: "bash: {cmd}: command not found",
    lsBadFlag: ["ls: invalid option -- '{flag}'", "usage: ls [-alth] [path]"],
    lsMissing: "ls: cannot access '{path}': No such file or directory",
    lsOnHome: "ls: {path}/: listed on the home page",
    catUsage: "usage: cat <file>",
    catMissing: "cat: {path}: No such file or directory",
    catDir: "cat: {path}: Is a directory",
    catNotDir: "cat: {path}: Not a directory",
    catPost: ["# {title}", "read it at {url}"],
    themeUsage: "usage: theme <name>",
    themeUnknown: "theme: unknown theme: {name}",
    themeSet: "accent: {name}",
    sudo: "{user} is not in the sudoers file. This incident will be reported.",
    rmDenied: "rm: cannot remove '{path}': Permission denied",
    rmMissing: ["rm: missing operand", "Try 'rm --help' for more information."],
    logout: "logout"
  },

  // Easter egg: cat on these paths.
  secret: {
    paths: ["/etc/shadow", "etc/shadow"],
    lines: ["cat: /etc/shadow: Permission denied", "nice try. This incident will be reported."]
  },

  // Easter egg: nmap with any target types this out, line by line.
  nmap: {
    usage: ["Nmap 7.95 ( https://nmap.org )", "Usage: nmap [Scan Type(s)] [Options] {target}"],
    start: "Starting Nmap 7.95 ( https://nmap.org )",
    lines: [
      "Nmap scan report for straya.local (127.0.0.1)",
      "PORT      STATE     SERVICE",
      "22/tcp    filtered  ssh       nice try",
      "80/tcp    open      http      you're here",
      "1337/tcp  open      projects  try: ls projects",
      "8080/tcp  open      log       try: ls log",
      "Nmap done: 1 IP address (1 host up)"
    ]
  }
};
